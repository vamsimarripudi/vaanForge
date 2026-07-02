import { createHash } from "node:crypto";
import { z } from "zod";
import {
  createId,
  store,
  type StoredMarketplaceApp,
  type StoredMarketplaceAppVersion,
  type StoredMarketplaceInstall,
  type StoredMarketplacePermission,
  type StoredMarketplacePricing,
  type StoredMarketplacePublisher,
  type StoredMarketplaceReview,
  type StoredMarketplaceReviewStatus,
  type StoredMarketplaceReviewType
} from "../../database/in-memory-store";
import { billingService } from "../billing/billing.service";
import { auditService } from "../audit/audit.service";

type Actor = { organizationId: string; userId: string; role: string };

const appTypes = ["app", "plugin", "template", "agent_extension", "workflow_automation", "integration"] as const;
const reviewTypes: StoredMarketplaceReviewType[] = ["security", "code_scan", "permission", "manual"];

export const publisherSchema = z.object({
  displayName: z.string().min(2),
  profileUrl: z.string().url().optional()
});

export const marketplaceAppSchema = z.object({
  name: z.string().min(2),
  appType: z.enum(appTypes),
  category: z.string().min(2),
  shortDescription: z.string().min(8).max(180),
  description: z.string().min(20),
  supportUrl: z.string().url().optional(),
  requestedPermissions: z.array(z.string().min(2)).min(1),
  pricing: z.object({
    model: z.enum(["free", "paid", "usage_based"]).default("free"),
    currency: z.enum(["INR", "USD"]).default("INR"),
    amount: z.number().int().min(0).default(0),
    billingMetric: z.string().min(2).optional(),
    revenueSharePercent: z.number().int().min(0).max(100).default(70)
  }).default({ model: "free", currency: "INR", amount: 0, revenueSharePercent: 70 }),
  manifest: z.record(z.unknown()).default({}),
  versionNumber: z.string().min(1).default("1.0.0"),
  changelog: z.string().min(4).default("Initial marketplace submission."),
  releaseNotes: z.string().min(4).default("Initial marketplace release.")
});

export const marketplaceVersionSchema = z.object({
  versionNumber: z.string().min(1),
  changelog: z.string().min(4),
  releaseNotes: z.string().min(4),
  manifest: z.record(z.unknown()).default({})
});

export const marketplaceReviewDecisionSchema = z.object({
  status: z.enum(["approved", "rejected", "changes_requested"]),
  reason: z.string().min(4),
  evidence: z.record(z.unknown()).default({})
});

export const marketplaceInstallSchema = z.object({
  workspaceId: z.string().min(2).default("default-workspace"),
  consentedPermissions: z.array(z.string().min(2)).min(1)
});

export class MarketplaceService {
  categories() {
    const known = new Map<string, { slug: string; name: string; count: number }>();
    for (const category of store.marketplaceCategories.filter((item) => item.status === "active")) {
      known.set(category.slug, { slug: category.slug, name: category.name, count: 0 });
    }
    for (const app of store.marketplaceApps.filter((item) => item.status === "published")) {
      const slug = uniqueCategorySlug(app.category);
      const existing = known.get(slug) || { slug, name: app.category, count: 0 };
      existing.count += 1;
      known.set(slug, existing);
    }
    return Array.from(known.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  storefront(actor: Actor, filters: { type?: string; category?: string; search?: string } = {}) {
    const apps = store.marketplaceApps
      .filter((app) => app.status === "published")
      .filter((app) => !filters.type || app.appType === filters.type)
      .filter((app) => !filters.category || app.category.toLowerCase() === filters.category.toLowerCase())
      .filter((app) => {
        if (!filters.search) return true;
        const query = filters.search.toLowerCase();
        return [app.name, app.slug, app.category, app.shortDescription].join(" ").toLowerCase().includes(query);
      })
      .map((app) => this.hydrateApp(app));

    return {
      apps,
      totals: {
        apps: apps.length,
        plugins: apps.filter((app) => app.appType === "plugin").length,
        templates: apps.filter((app) => app.appType === "template").length,
        integrations: apps.filter((app) => app.appType === "integration").length
      },
      nextAction: apps.length ? "Review permissions, pricing, and publisher trust before installing into a workspace." : "Submit and approve marketplace apps before the storefront can list installable products."
    };
  }

  appDetail(actor: Actor, appId: string) {
    const app = store.marketplaceApps.find((item) => item.appId === appId && (item.status === "published" || item.organizationId === actor.organizationId));
    if (!app) throw new Error("Marketplace app not found.");
    return this.hydrateApp(app);
  }

  updateApp(actor: Actor, appId: string, input: Partial<z.infer<typeof marketplaceAppSchema>>) {
    const app = this.requirePublisherApp(actor, appId);
    if (app.status === "published") throw new Error("Published marketplace apps are immutable. Create a new version for changes.");
    const parsed = marketplaceAppSchema.partial().parse(input);
    if (parsed.name) app.name = sanitize(parsed.name);
    if (parsed.category) app.category = sanitize(parsed.category);
    if (parsed.shortDescription) app.shortDescription = sanitize(parsed.shortDescription);
    if (parsed.description) app.description = sanitize(parsed.description);
    if (parsed.supportUrl !== undefined) app.supportUrl = parsed.supportUrl;
    if (parsed.requestedPermissions) {
      app.requestedPermissions = parsed.requestedPermissions.map(sanitize);
      this.replacePermissions(app, app.requestedPermissions);
    }
    if (parsed.pricing) this.upsertPricing(app, { model: parsed.pricing.model ?? "free", currency: parsed.pricing.currency ?? "INR", amount: parsed.pricing.amount ?? 0, billingMetric: parsed.pricing.billingMetric, revenueSharePercent: parsed.pricing.revenueSharePercent ?? 70 });
    app.updatedAt = new Date().toISOString();
    app.activityHistory.push({ at: app.updatedAt, status: app.status, message: "Marketplace app draft updated." });
    this.audit(actor, "MARKETPLACE_APP_UPDATED", "MarketplaceApp", app.appId);
    return this.hydrateApp(app);
  }

  publishApp(actor: Actor, appId: string) {
    const app = store.marketplaceApps.find((item) => item.appId === appId);
    if (!app) throw new Error("Marketplace app not found.");
    const version = this.requireVersion(app.currentVersionId);
    const reviews = store.marketplaceReviews.filter((review) => review.versionId === version.versionId);
    if (!reviews.length || !reviews.every((review) => review.status === "approved")) throw new Error("All marketplace review gates must be approved before publishing.");
    app.status = "published";
    app.reviewRequired = false;
    app.updatedAt = new Date().toISOString();
    version.status = "published";
    version.approvedById = actor.userId;
    app.activityHistory.push({ at: app.updatedAt, status: "published", message: "App published by marketplace administrator after review approval." });
    this.audit(actor, "MARKETPLACE_APP_PUBLISHED", "MarketplaceApp", app.appId);
    return this.hydrateApp(app);
  }

  suspendApp(actor: Actor, appId: string, reason: string) {
    const app = store.marketplaceApps.find((item) => item.appId === appId);
    if (!app) throw new Error("Marketplace app not found.");
    app.status = "suspended";
    app.nextAction = "Resolve the suspension reason and submit a reviewed version before relisting.";
    app.updatedAt = new Date().toISOString();
    app.activityHistory.push({ at: app.updatedAt, status: "suspended", message: sanitize(reason) });
    this.audit(actor, "MARKETPLACE_APP_SUSPENDED", "MarketplaceApp", app.appId, { reason });
    return this.hydrateApp(app);
  }

  publisherDashboard(actor: Actor) {
    const publisher = this.ensurePublisher(actor);
    const apps = this.publisherApps(actor);
    const payouts = store.marketplacePayouts.filter((payout) => payout.organizationId === actor.organizationId && payout.publisherId === publisher.publisherId);
    return {
      publisher,
      totals: {
        apps: apps.length,
        published: apps.filter((app) => app.status === "published").length,
        pendingReviews: store.marketplaceReviews.filter((review) => review.organizationId === actor.organizationId && review.status === "pending").length,
        payoutAmount: payouts.reduce((sum, payout) => sum + payout.amount, 0)
      },
      nextAction: "Create or update an app, submit an immutable version, and wait for all review gates before publishing."
    };
  }

  createPublisher(actor: Actor, input: z.infer<typeof publisherSchema>) {
    const parsed = publisherSchema.parse(input);
    const existing = store.marketplacePublishers.find((item) => item.organizationId === actor.organizationId && item.ownerId === actor.userId);
    if (existing) return existing;
    const now = new Date().toISOString();
    const developer = this.ensureDeveloperAccount(actor);
    const publisher: StoredMarketplacePublisher = {
      id: createId("mpub"),
      publisherId: createId("publisher"),
      developerId: developer.developerId,
      organizationId: actor.organizationId,
      displayName: sanitize(parsed.displayName),
      profileUrl: parsed.profileUrl,
      verified: false,
      status: "active",
      ownerId: actor.userId,
      priority: "HIGH",
      dueDate: inDays(14),
      nextAction: "Submit the first marketplace app for security, code, permission, and manual review.",
      activityHistory: [{ at: now, status: "active", message: "Publisher profile created." }],
      createdAt: now,
      updatedAt: now
    };
    store.marketplacePublishers.push(publisher);
    this.audit(actor, "MARKETPLACE_PUBLISHER_CREATED", "MarketplacePublisher", publisher.publisherId);
    return publisher;
  }

  publisherApps(actor: Actor) {
    const publisher = this.ensurePublisher(actor);
    return store.marketplaceApps.filter((app) => app.organizationId === actor.organizationId && app.publisherId === publisher.publisherId).map((app) => this.hydrateApp(app));
  }

  createApp(actor: Actor, input: z.infer<typeof marketplaceAppSchema>) {
    const parsed = marketplaceAppSchema.parse(input);
    this.scanForUnsafeContent(parsed);
    const publisher = this.ensurePublisher(actor);
    const now = new Date().toISOString();
    const app: StoredMarketplaceApp = {
      id: createId("mapp"),
      appId: createId("market_app"),
      publisherId: publisher.publisherId,
      organizationId: actor.organizationId,
      name: sanitize(parsed.name),
      slug: uniqueSlug(parsed.name),
      appType: parsed.appType,
      category: sanitize(parsed.category),
      shortDescription: sanitize(parsed.shortDescription),
      description: sanitize(parsed.description),
      supportUrl: parsed.supportUrl,
      requestedPermissions: parsed.requestedPermissions.map(sanitize),
      pricingModel: parsed.pricing.model,
      status: "draft",
      reviewRequired: true,
      ownerId: actor.userId,
      priority: "HIGH",
      dueDate: inDays(21),
      nextAction: "Submit an immutable version for marketplace review.",
      activityHistory: [{ at: now, status: "draft", message: "Marketplace app created." }],
      createdAt: now,
      updatedAt: now
    };
    store.marketplaceApps.push(app);
    this.replacePermissions(app, parsed.requestedPermissions);
    this.upsertPricing(app, parsed.pricing);
    const version = this.createVersionRecord(actor, app, parsed, "draft");
    app.currentVersionId = version.versionId;
    app.latestVersionNumber = version.versionNumber;
    this.audit(actor, "MARKETPLACE_APP_CREATED", "MarketplaceApp", app.appId, { appType: app.appType, pricingModel: app.pricingModel });
    return this.hydrateApp(app);
  }

  submitApp(actor: Actor, appId: string, input?: Partial<z.infer<typeof marketplaceVersionSchema>>) {
    const app = this.requirePublisherApp(actor, appId);
    const now = new Date().toISOString();
    const version = input ? this.createVersion(actor, appId, input) : this.requireVersion(app.currentVersionId);
    version.status = "submitted";
    app.status = "in_review";
    app.reviewRequired = true;
    app.nextAction = "Admin review must approve security, code scan, permission, and manual gates.";
    app.activityHistory.push({ at: now, status: "in_review", message: `Version ${version.versionNumber} submitted for review.` });
    app.updatedAt = now;
    this.createReviewGates(app, version, actor.userId);
    this.audit(actor, "MARKETPLACE_APP_SUBMITTED", "MarketplaceApp", app.appId, { versionId: version.versionId });
    return this.hydrateApp(app);
  }

  createVersion(actor: Actor, appId: string, input: Partial<z.infer<typeof marketplaceVersionSchema>>) {
    const app = this.requirePublisherApp(actor, appId);
    const parsed = marketplaceVersionSchema.parse(input);
    this.scanForUnsafeContent(parsed);
    const existing = store.marketplaceAppVersions.find((version) => version.appId === app.appId && version.versionNumber === parsed.versionNumber);
    if (existing) throw new Error("Marketplace app versions are immutable. Create a new version number instead.");
    const version = this.createVersionRecord(actor, app, parsed, "draft");
    app.currentVersionId = version.versionId;
    app.latestVersionNumber = version.versionNumber;
    app.status = "draft";
    app.nextAction = "Submit this immutable version for review.";
    app.updatedAt = new Date().toISOString();
    this.audit(actor, "MARKETPLACE_APP_VERSION_CREATED", "MarketplaceAppVersion", version.versionId, { appId });
    return version;
  }

  reviews(actor: Actor) {
    return store.marketplaceReviews
      .filter((review) => review.organizationId === actor.organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((review) => ({ ...review, app: store.marketplaceApps.find((app) => app.appId === review.appId), version: store.marketplaceAppVersions.find((version) => version.versionId === review.versionId) }));
  }

  decideReview(actor: Actor, reviewId: string, input: z.infer<typeof marketplaceReviewDecisionSchema>) {
    const parsed = marketplaceReviewDecisionSchema.parse(input);
    const review = store.marketplaceReviews.find((item) => item.organizationId === actor.organizationId && item.reviewId === reviewId);
    if (!review) throw new Error("Marketplace review not found.");
    review.status = parsed.status;
    review.reviewerId = actor.userId;
    review.reason = sanitize(parsed.reason);
    review.evidence = maskRecord({ ...review.evidence, ...parsed.evidence, reviewedAt: new Date().toISOString() });
    review.nextAction = parsed.status === "approved" ? "Wait for the remaining marketplace review gates." : "Publisher must submit a corrected version before publication.";
    review.updatedAt = new Date().toISOString();

    const app = store.marketplaceApps.find((item) => item.appId === review.appId);
    const version = store.marketplaceAppVersions.find((item) => item.versionId === review.versionId);
    if (app && version) this.recalculateReviewState(actor, app, version);
    this.audit(actor, "MARKETPLACE_REVIEW_DECIDED", "MarketplaceReview", review.reviewId, { status: review.status, reviewType: review.reviewType });
    return review;
  }

  workspaceApps(actor: Actor) {
    return store.marketplaceInstalls
      .filter((install) => install.organizationId === actor.organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((install) => ({ ...install, app: store.marketplaceApps.find((app) => app.appId === install.appId), version: store.marketplaceAppVersions.find((version) => version.versionId === install.versionId) }));
  }

  install(actor: Actor, appId: string, input: z.infer<typeof marketplaceInstallSchema>) {
    const parsed = marketplaceInstallSchema.parse(input);
    const app = store.marketplaceApps.find((item) => item.appId === appId && item.status === "published");
    if (!app) throw new Error("Only reviewed and published marketplace apps can be installed.");
    const version = this.requireVersion(app.currentVersionId);
    const missing = app.requestedPermissions.filter((permission) => !parsed.consentedPermissions.includes(permission));
    if (missing.length) throw new Error(`Permission consent missing for: ${missing.join(", ")}`);
    const now = new Date().toISOString();
    const pricing = store.marketplacePricing.find((item) => item.appId === app.appId);
    if (pricing && pricing.amount > 0) {
      billingService.checkAndConsume({ organizationId: actor.organizationId, customerId: actor.userId, actorId: actor.userId, metric: "template_use", quantity: 1, source: "marketplace_install", sourceId: app.appId, credits: Math.max(1, Math.ceil(pricing.amount / 1000)) });
    }
    const install: StoredMarketplaceInstall = {
      id: createId("mins"),
      installId: createId("install"),
      appId: app.appId,
      versionId: version.versionId,
      organizationId: actor.organizationId,
      workspaceId: sanitize(parsed.workspaceId),
      installedById: actor.userId,
      consentedPermissions: parsed.consentedPermissions.map(sanitize),
      status: "installed",
      ownerId: actor.userId,
      priority: "HIGH",
      dueDate: inDays(30),
      nextAction: "Monitor app permissions, updates, and workspace usage.",
      activityHistory: [{ at: now, status: "installed", message: `Installed ${app.name} ${version.versionNumber}.` }],
      createdAt: now,
      updatedAt: now
    };
    store.marketplaceInstalls.push(install);
    if (pricing && pricing.amount > 0) this.createPayout(app, pricing, install);
    this.audit(actor, "MARKETPLACE_APP_INSTALLED", "MarketplaceInstall", install.installId, { appId: app.appId, versionId: version.versionId, permissions: install.consentedPermissions });
    return install;
  }

  uninstall(actor: Actor, appId: string) {
    const install = this.requireInstall(actor, appId);
    install.status = "uninstalled";
    install.nextAction = "Confirm downstream automations no longer depend on this app.";
    install.updatedAt = new Date().toISOString();
    install.activityHistory.push({ at: install.updatedAt, status: "uninstalled", message: "App uninstalled from workspace." });
    this.audit(actor, "MARKETPLACE_APP_UNINSTALLED", "MarketplaceInstall", install.installId, { appId });
    return install;
  }

  updateInstall(actor: Actor, appId: string) {
    const install = this.requireInstall(actor, appId);
    const app = store.marketplaceApps.find((item) => item.appId === appId && item.status === "published");
    if (!app?.currentVersionId) throw new Error("Published app version not found.");
    if (install.versionId === app.currentVersionId) return install;
    install.rollbackVersionId = install.versionId;
    install.versionId = app.currentVersionId;
    install.status = "installed";
    install.nextAction = "Validate the updated app in the workspace and monitor errors.";
    install.updatedAt = new Date().toISOString();
    install.activityHistory.push({ at: install.updatedAt, status: "installed", message: "App updated to current marketplace version." });
    this.audit(actor, "MARKETPLACE_APP_UPDATED", "MarketplaceInstall", install.installId, { appId, versionId: install.versionId });
    return install;
  }

  rollbackInstall(actor: Actor, appId: string) {
    const install = this.requireInstall(actor, appId);
    if (!install.rollbackVersionId) throw new Error("No rollback version is available for this install.");
    const previous = install.versionId;
    install.versionId = install.rollbackVersionId;
    install.rollbackVersionId = previous;
    install.status = "rolled_back";
    install.nextAction = "Review update failure evidence before attempting another upgrade.";
    install.updatedAt = new Date().toISOString();
    install.activityHistory.push({ at: install.updatedAt, status: "rolled_back", message: "App rolled back to previous immutable version." });
    this.audit(actor, "MARKETPLACE_APP_ROLLED_BACK", "MarketplaceInstall", install.installId, { appId, versionId: install.versionId });
    return install;
  }

  payouts(actor: Actor) {
    const publisher = this.ensurePublisher(actor);
    return store.marketplacePayouts.filter((payout) => payout.organizationId === actor.organizationId && payout.publisherId === publisher.publisherId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  publisherRevenue(actor: Actor) {
    const publisher = this.ensurePublisher(actor);
    const events = store.marketplaceRevenueEvents.filter((event) => event.publisherId === publisher.publisherId);
    const payouts = this.payouts(actor);
    return {
      events,
      payouts,
      totals: {
        revenue: events.reduce((sum, event) => sum + event.amount, 0),
        payouts: payouts.reduce((sum, payout) => sum + payout.amount, 0),
        currency: events[0]?.currency || payouts[0]?.currency || "INR"
      },
      nextAction: events.length ? "Review revenue events and payout status." : "Revenue appears after paid marketplace installs or billing-connected purchases."
    };
  }

  private hydrateApp(app: StoredMarketplaceApp) {
    return {
      ...app,
      publisher: store.marketplacePublishers.find((publisher) => publisher.publisherId === app.publisherId),
      version: store.marketplaceAppVersions.find((version) => version.versionId === app.currentVersionId),
      versions: store.marketplaceAppVersions.filter((version) => version.appId === app.appId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      permissions: store.marketplacePermissions.filter((permission) => permission.appId === app.appId),
      pricing: store.marketplacePricing.find((pricing) => pricing.appId === app.appId),
      reviews: store.marketplaceReviews.filter((review) => review.appId === app.appId)
    };
  }

  private ensurePublisher(actor: Actor) {
    return store.marketplacePublishers.find((item) => item.organizationId === actor.organizationId && item.ownerId === actor.userId) || this.createPublisher(actor, { displayName: `Publisher ${actor.userId}` });
  }

  private ensureDeveloperAccount(actor: Actor) {
    let account = store.developerAccounts.find((item) => item.organizationId === actor.organizationId && item.userId === actor.userId);
    if (!account) {
      const now = new Date().toISOString();
      account = { id: createId("dev"), developerId: createId("developer"), organizationId: actor.organizationId, userId: actor.userId, displayName: `Developer ${actor.userId}`, status: "active", ownerId: actor.userId, priority: "HIGH", dueDate: inDays(30), nextAction: "Create developer apps or marketplace publisher profile.", activityHistory: [{ at: now, status: "active", message: "Developer account initialized for marketplace." }], createdAt: now, updatedAt: now };
      store.developerAccounts.push(account);
    }
    return account;
  }

  private requirePublisherApp(actor: Actor, appId: string) {
    const publisher = this.ensurePublisher(actor);
    const app = store.marketplaceApps.find((item) => item.organizationId === actor.organizationId && item.publisherId === publisher.publisherId && item.appId === appId);
    if (!app) throw new Error("Publisher app not found.");
    return app;
  }

  private requireVersion(versionId: string | undefined) {
    const version = store.marketplaceAppVersions.find((item) => item.versionId === versionId);
    if (!version) throw new Error("Marketplace app version not found.");
    return version;
  }

  private requireInstall(actor: Actor, appId: string) {
    const install = store.marketplaceInstalls.find((item) => item.organizationId === actor.organizationId && item.appId === appId && item.status !== "uninstalled");
    if (!install) throw new Error("Marketplace install not found.");
    return install;
  }

  private createVersionRecord(actor: Actor, app: StoredMarketplaceApp, input: { versionNumber: string; changelog: string; releaseNotes: string; manifest: Record<string, unknown> }, status: StoredMarketplaceAppVersion["status"]) {
    const manifest = maskRecord(input.manifest || {});
    const version: StoredMarketplaceAppVersion = {
      id: createId("mver"),
      versionId: createId("version"),
      appId: app.appId,
      organizationId: app.organizationId,
      versionNumber: sanitize(input.versionNumber),
      changelog: sanitize(input.changelog),
      manifest,
      packageChecksum: checksum({ appId: app.appId, version: input.versionNumber, manifest }),
      releaseNotes: sanitize(input.releaseNotes),
      status,
      immutable: true,
      submittedById: actor.userId,
      createdAt: new Date().toISOString()
    };
    store.marketplaceAppVersions.push(version);
    return version;
  }

  private createReviewGates(app: StoredMarketplaceApp, version: StoredMarketplaceAppVersion, actorId: string) {
    for (const reviewType of reviewTypes) {
      const existing = store.marketplaceReviews.find((review) => review.versionId === version.versionId && review.reviewType === reviewType);
      if (existing) continue;
      const now = new Date().toISOString();
      const status = this.automatedReviewStatus(reviewType, app, version);
      const review: StoredMarketplaceReview = {
        id: createId("mrev"),
        reviewId: createId("review"),
        appId: app.appId,
        versionId: version.versionId,
        organizationId: app.organizationId,
        reviewType,
        status,
        reviewerId: status === "approved" ? "system" : undefined,
        evidence: this.reviewEvidence(reviewType, app, version, status),
        nextAction: status === "approved" ? "Automated review gate passed." : "Admin reviewer must inspect this marketplace submission.",
        createdAt: now,
        updatedAt: now
      };
      store.marketplaceReviews.push(review);
    }
    app.activityHistory.push({ at: new Date().toISOString(), status: "in_review", message: `Review gates created by ${actorId}.` });
  }

  private automatedReviewStatus(reviewType: StoredMarketplaceReviewType, app: StoredMarketplaceApp, version: StoredMarketplaceAppVersion): StoredMarketplaceReviewStatus {
    if (reviewType === "manual") return "pending";
    if (reviewType === "permission" && app.requestedPermissions.some((permission) => /admin|billing|deploy|secret/i.test(permission))) return "pending";
    if (reviewType === "security" && containsInjection(JSON.stringify(version.manifest))) return "rejected";
    return "approved";
  }

  private reviewEvidence(reviewType: StoredMarketplaceReviewType, app: StoredMarketplaceApp, version: StoredMarketplaceAppVersion, status: StoredMarketplaceReviewStatus) {
    return {
      reviewType,
      status,
      appId: app.appId,
      versionId: version.versionId,
      checksum: version.packageChecksum,
      permissions: app.requestedPermissions,
      secretScan: JSON.stringify(version.manifest).match(/secret|token|password|provider api key/i) ? "masked" : "clean",
      promptInjectionScan: containsInjection(JSON.stringify(version.manifest)) ? "blocked" : "clean"
    };
  }

  private recalculateReviewState(actor: Actor, app: StoredMarketplaceApp, version: StoredMarketplaceAppVersion) {
    const reviews = store.marketplaceReviews.filter((review) => review.versionId === version.versionId);
    if (reviews.some((review) => review.status === "rejected")) {
      app.status = "rejected";
      version.status = "rejected";
      app.nextAction = "Publisher must submit a new immutable version addressing review rejection.";
      app.updatedAt = new Date().toISOString();
      return;
    }
    if (reviews.length >= reviewTypes.length && reviews.every((review) => review.status === "approved")) {
      app.status = "published";
      app.reviewRequired = false;
      app.currentVersionId = version.versionId;
      app.latestVersionNumber = version.versionNumber;
      app.nextAction = "Marketplace app is live. Monitor installs, reviews, and payout status.";
      version.status = "published";
      version.approvedById = actor.userId;
      app.activityHistory.push({ at: new Date().toISOString(), status: "published", message: `Version ${version.versionNumber} published after all review gates passed.` });
      app.updatedAt = new Date().toISOString();
    }
  }

  private replacePermissions(app: StoredMarketplaceApp, permissions: string[]) {
    store.marketplacePermissions = store.marketplacePermissions.filter((permission) => permission.appId !== app.appId);
    for (const permission of permissions) {
      const key = sanitize(permission);
      const item: StoredMarketplacePermission = { id: createId("mperm"), permissionId: createId("permission"), appId: app.appId, organizationId: app.organizationId, key, description: `Allows ${app.name} to access ${key}.`, riskLevel: /admin|billing|deploy|secret/i.test(key) ? "HIGH" : /write|manage/i.test(key) ? "MEDIUM" : "LOW", required: true, createdAt: new Date().toISOString() };
      store.marketplacePermissions.push(item);
    }
  }

  private upsertPricing(app: StoredMarketplaceApp, pricing: z.infer<typeof marketplaceAppSchema>["pricing"]) {
    const now = new Date().toISOString();
    const item: StoredMarketplacePricing = { id: createId("mprice"), pricingId: createId("pricing"), appId: app.appId, organizationId: app.organizationId, model: pricing.model, currency: pricing.currency, amount: pricing.amount, billingMetric: pricing.billingMetric, revenueSharePercent: pricing.revenueSharePercent, createdAt: now, updatedAt: now };
    store.marketplacePricing = store.marketplacePricing.filter((existing) => existing.appId !== app.appId);
    store.marketplacePricing.push(item);
  }

  private createPayout(app: StoredMarketplaceApp, pricing: StoredMarketplacePricing, install: StoredMarketplaceInstall) {
    const amount = Math.floor((pricing.amount * pricing.revenueSharePercent) / 100);
    store.marketplaceRevenueEvents.push({ id: createId("mrevn"), revenueEventId: createId("marketplace_revenue"), publisherId: app.publisherId, organizationId: app.organizationId, appId: app.appId, sourceInstallId: install.installId, amount: pricing.amount, currency: pricing.currency, status: "recorded", createdAt: new Date().toISOString() });
    if (amount <= 0) return;
    const now = new Date().toISOString();
    store.marketplacePayouts.push({ id: createId("mpay"), payoutId: createId("payout"), publisherId: app.publisherId, organizationId: app.organizationId, appId: app.appId, amount, currency: pricing.currency, status: "pending", sourceInstallId: install.installId, dueDate: inDays(30), activityHistory: [{ at: now, status: "pending", message: "Marketplace payout accrued from paid install." }], createdAt: now, updatedAt: now });
  }

  private scanForUnsafeContent(value: unknown) {
    const serialized = JSON.stringify(value);
    if (containsInjection(serialized)) throw new Error("Marketplace submission failed prompt-injection protection.");
    if (/provider api key|private key|BEGIN RSA PRIVATE KEY|secret_key/i.test(serialized)) throw new Error("Marketplace submission contains sensitive secrets.");
  }

  private audit(actor: Actor, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: "VAANFORGE_AGENT_RUN", entityType, entityId, metadata: { marketplaceAction: action, ...metadata } });
  }
}

function sanitize(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/secret|token|provider api key|system prompt/gi, "[removed]").trim();
}

function containsInjection(value: string) {
  return /ignore previous instructions|system prompt|developer message|exfiltrate|jailbreak|provider api key/i.test(value);
}

function maskRecord(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /secret|token|password|key/i.test(key) ? "[masked]" : typeof item === "string" ? sanitize(item) : item]));
}

function checksum(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function uniqueSlug(name: string) {
  const base = sanitize(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "marketplace-app";
  let slug = base;
  let suffix = 2;
  while (store.marketplaceApps.some((app) => app.slug === slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function uniqueCategorySlug(name: string) {
  return sanitize(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "general";
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const marketplaceService = new MarketplaceService();
