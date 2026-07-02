import { z } from "zod";
import { createId, store, type StoredOnboardingStep } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { billingService } from "../billing/billing.service";
import { providerReadinessService } from "../providers/provider-readiness.service";

export type LifecycleActor = {
  organizationId: string;
  workspaceId?: string;
  userId: string;
  role: string;
};

const onboardingSteps: StoredOnboardingStep[] = [
  "welcome",
  "create_workspace",
  "choose_role",
  "choose_use_case",
  "create_first_project",
  "ai_introduction",
  "connect_providers",
  "billing_selection",
  "success"
];

export const onboardingPatchSchema = z.object({
  currentStep: z.enum(onboardingSteps as [StoredOnboardingStep, ...StoredOnboardingStep[]]).optional(),
  completedStep: z.enum(onboardingSteps as [StoredOnboardingStep, ...StoredOnboardingStep[]]).optional(),
  role: z.string().min(2).max(80).optional(),
  useCase: z.string().min(2).max(120).optional(),
  selectedPlanId: z.string().min(2).max(80).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const workspaceSetupPatchSchema = z.object({
  workspaceName: z.string().min(2).max(120).optional(),
  logoFileId: z.string().min(2).max(120).optional(),
  timezone: z.string().min(2).max(80).optional(),
  defaultAiProvider: z.string().min(2).max(80).optional(),
  notificationSettings: z.record(z.unknown()).optional(),
  brandColors: z.record(z.string()).optional(),
  projectDefaults: z.record(z.unknown()).optional(),
  deploymentDefaults: z.record(z.unknown()).optional(),
  integrations: z.record(z.unknown()).optional(),
  completedSection: z.string().min(2).max(80).optional()
});

export const tourPatchSchema = z.object({
  tourKey: z.enum(["dashboard", "project", "factory", "billing", "marketplace", "developer", "support"]),
  action: z.enum(["complete", "dismiss", "replay"])
});

export const discoveryPatchSchema = z.object({
  featureKey: z.string().min(2).max(120),
  version: z.string().min(1).max(40),
  action: z.enum(["viewed", "dismissed"])
});

export class LifecycleService {
  start(actor: LifecycleActor) {
    const existing = this.progress(actor);
    if (existing) return this.onboardingSnapshot(actor, existing);
    const now = new Date().toISOString();
    const progress = {
      id: createId("onb"),
      organizationId: actor.organizationId,
      workspaceId: actor.workspaceId,
      userId: actor.userId,
      status: "in_progress" as const,
      currentStep: "welcome" as const,
      completedSteps: [],
      metadata: {},
      createdAt: now,
      updatedAt: now
    };
    store.onboardingProgress.push(progress);
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, workspaceId: actor.workspaceId, action: "SETTINGS_CHANGED", entityType: "OnboardingProgress", entityId: progress.id, result: "success", metadata: { lifecycleAction: "ONBOARDING_STARTED" } });
    return this.onboardingSnapshot(actor, progress);
  }

  get(actor: LifecycleActor) {
    const existing = this.progress(actor) ?? this.start(actor).progress;
    return this.onboardingSnapshot(actor, existing);
  }

  patch(actor: LifecycleActor, input: z.infer<typeof onboardingPatchSchema>) {
    const parsed = onboardingPatchSchema.parse(input);
    const progress = this.progress(actor) ?? this.start(actor).progress;
    if (parsed.currentStep) progress.currentStep = parsed.currentStep;
    if (parsed.completedStep && !progress.completedSteps.includes(parsed.completedStep)) {
      progress.completedSteps.push(parsed.completedStep);
      progress.currentStep = this.nextStep(progress.completedSteps);
    }
    if (parsed.role) progress.role = parsed.role;
    if (parsed.useCase) progress.useCase = parsed.useCase;
    if (parsed.selectedPlanId) progress.selectedPlanId = parsed.selectedPlanId;
    if (parsed.metadata) progress.metadata = { ...progress.metadata, ...parsed.metadata };
    progress.status = progress.completedSteps.length >= onboardingSteps.length ? "completed" : "in_progress";
    progress.updatedAt = new Date().toISOString();
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, workspaceId: actor.workspaceId, action: "SETTINGS_CHANGED", entityType: "OnboardingProgress", entityId: progress.id, result: "success", metadata: { lifecycleAction: "ONBOARDING_UPDATED", currentStep: progress.currentStep, completedSteps: progress.completedSteps.length } });
    return this.onboardingSnapshot(actor, progress);
  }

  complete(actor: LifecycleActor) {
    const progress = this.progress(actor) ?? this.start(actor).progress;
    progress.status = "completed";
    progress.currentStep = "success";
    progress.completedSteps = [...onboardingSteps];
    progress.updatedAt = new Date().toISOString();
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, workspaceId: actor.workspaceId, action: "SETTINGS_CHANGED", entityType: "OnboardingProgress", entityId: progress.id, result: "success", metadata: { lifecycleAction: "ONBOARDING_COMPLETED" } });
    return this.onboardingSnapshot(actor, progress);
  }

  workspaceSetup(actor: LifecycleActor) {
    const workspaceId = actor.workspaceId ?? store.workspaces.find((workspace) => workspace.organizationId === actor.organizationId)?.id ?? "workspace_pending";
    let setup = store.workspaceSetups.find((item) => item.organizationId === actor.organizationId && item.workspaceId === workspaceId);
    if (!setup) {
      const workspace = store.workspaces.find((item) => item.id === workspaceId);
      const now = new Date().toISOString();
      setup = {
        id: createId("wsetup"),
        organizationId: actor.organizationId,
        workspaceId,
        userId: actor.userId,
        workspaceName: workspace?.name,
        timezone: "Asia/Kolkata",
        notificationSettings: { product: true, billing: true, security: true },
        completedSections: workspace ? ["workspace_name"] : [],
        createdAt: now,
        updatedAt: now
      };
      store.workspaceSetups.push(setup);
    }
    return { setup, sections: this.workspaceSetupSections(setup) };
  }

  updateWorkspaceSetup(actor: LifecycleActor, input: z.infer<typeof workspaceSetupPatchSchema>) {
    const parsed = workspaceSetupPatchSchema.parse(input);
    const snapshot = this.workspaceSetup(actor);
    const setup = snapshot.setup;
    Object.assign(setup, {
      workspaceName: parsed.workspaceName ?? setup.workspaceName,
      logoFileId: parsed.logoFileId ?? setup.logoFileId,
      timezone: parsed.timezone ?? setup.timezone,
      defaultAiProvider: parsed.defaultAiProvider ?? setup.defaultAiProvider,
      notificationSettings: parsed.notificationSettings ?? setup.notificationSettings,
      brandColors: parsed.brandColors ?? setup.brandColors,
      projectDefaults: parsed.projectDefaults ?? setup.projectDefaults,
      deploymentDefaults: parsed.deploymentDefaults ?? setup.deploymentDefaults,
      integrations: parsed.integrations ?? setup.integrations,
      updatedAt: new Date().toISOString()
    });
    if (parsed.completedSection && !setup.completedSections.includes(parsed.completedSection)) setup.completedSections.push(parsed.completedSection);
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, workspaceId: setup.workspaceId, action: "SETTINGS_CHANGED", entityType: "WorkspaceSetup", entityId: setup.id, result: "success", metadata: { lifecycleAction: "WORKSPACE_SETUP_UPDATED", completedSections: setup.completedSections } });
    return { setup, sections: this.workspaceSetupSections(setup) };
  }

  tours(actor: LifecycleActor) {
    const definitions = [
      tour("dashboard", "Dashboard tour", "/dashboard"),
      tour("project", "Project tour", "/projects"),
      tour("factory", "Factory tour", "/factory/projects"),
      tour("billing", "Billing tour", "/billing"),
      tour("marketplace", "Marketplace tour", "/marketplace"),
      tour("developer", "Developer portal tour", "/developers"),
      tour("support", "Support tour", "/support")
    ];
    return definitions.map((definition) => {
      const progress = store.productTourProgress.find((item) => item.organizationId === actor.organizationId && item.userId === actor.userId && item.tourKey === definition.key);
      return { ...definition, status: progress?.status ?? "available", replayCount: progress?.replayCount ?? 0, completedAt: progress?.completedAt, lastViewedAt: progress?.lastViewedAt };
    });
  }

  updateTour(actor: LifecycleActor, input: z.infer<typeof tourPatchSchema>) {
    const parsed = tourPatchSchema.parse(input);
    const now = new Date().toISOString();
    let progress = store.productTourProgress.find((item) => item.organizationId === actor.organizationId && item.userId === actor.userId && item.tourKey === parsed.tourKey);
    if (!progress) {
      progress = { id: createId("tour"), organizationId: actor.organizationId, userId: actor.userId, tourKey: parsed.tourKey, status: "available", replayCount: 0, createdAt: now, updatedAt: now };
      store.productTourProgress.push(progress);
    }
    if (parsed.action === "complete") {
      progress.status = "completed";
      progress.completedAt = now;
    }
    if (parsed.action === "dismiss") progress.status = "dismissed";
    if (parsed.action === "replay") {
      progress.status = "available";
      progress.replayCount += 1;
    }
    progress.lastViewedAt = now;
    progress.updatedAt = now;
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: "SETTINGS_CHANGED", entityType: "ProductTourProgress", entityId: progress.id, result: "success", metadata: { lifecycleAction: "PRODUCT_TOUR_UPDATED", tourKey: parsed.tourKey, action: parsed.action } });
    return progress;
  }

  featureDiscovery(actor: LifecycleActor) {
    const viewed = new Set(store.featureDiscoveryViews.filter((item) => item.organizationId === actor.organizationId && item.userId === actor.userId).map((item) => `${item.featureKey}:${item.version}`));
    return [
      feature("factory-lifecycle", "Guided factory lifecycle", "v1.0.0-rc1", "Continue from idea to release with approval checkpoints.", "/factory/projects"),
      feature("provider-readiness", "Provider readiness", "v1.0.0-rc1", "Admins can verify configured providers without exposing secrets.", "/admin/providers/readiness"),
      feature("billing-limits", "Server-side usage limits", "v1.0.0-rc1", "Every limited action checks plan usage before it runs.", "/billing/usage"),
      feature("support-center", "Unified support center", "v1.0.0-rc1", "Tickets, messages, KB, and admin support actions share one workflow.", "/support")
    ].map((item) => ({ ...item, viewed: viewed.has(`${item.key}:${item.version}`) }));
  }

  updateFeatureDiscovery(actor: LifecycleActor, input: z.infer<typeof discoveryPatchSchema>) {
    const parsed = discoveryPatchSchema.parse(input);
    const existing = store.featureDiscoveryViews.find((item) => item.organizationId === actor.organizationId && item.userId === actor.userId && item.featureKey === parsed.featureKey && item.version === parsed.version);
    if (existing) {
      existing.status = parsed.action;
      return existing;
    }
    const view = { id: createId("fdv"), organizationId: actor.organizationId, userId: actor.userId, featureKey: parsed.featureKey, version: parsed.version, status: parsed.action, createdAt: new Date().toISOString() };
    store.featureDiscoveryViews.push(view);
    return view;
  }

  commandPalette(actor: LifecycleActor) {
    return {
      shortcut: "Ctrl/Cmd + K",
      commands: this.commandCatalog(actor),
      recent: store.commandUsage.filter((item) => item.organizationId === actor.organizationId && item.userId === actor.userId).slice(-10).reverse()
    };
  }

  runCommand(actor: LifecycleActor, commandId: string, source: "palette" | "search" | "shortcut" = "palette") {
    const command = this.commandCatalog(actor).find((item) => item.id === commandId);
    if (!command) throw new Error("Command not found.");
    const usage = { id: createId("cmd"), organizationId: actor.organizationId, userId: actor.userId, commandId, source, createdAt: new Date().toISOString() };
    store.commandUsage.push(usage);
    return { command, usage };
  }

  search(actor: LifecycleActor, query: string) {
    const needle = query.trim().toLowerCase();
    const matches = (value?: string) => !needle || value?.toLowerCase().includes(needle);
    return {
      query,
      groups: [
        { category: "Projects", results: store.projects.filter((item) => item.organizationId === actor.organizationId && matches(item.name)).map((item) => result(item.id, item.name, item.description ?? "Project", `/projects/${item.id}`)) },
        { category: "Tasks", results: store.tasks.filter((item) => item.organizationId === actor.organizationId && matches(item.title)).map((item) => result(item.id, item.title, item.status, `/tasks/${item.id}`)) },
        { category: "Deployments", results: store.agentDeployments.filter((item) => item.organizationId === actor.organizationId && matches(item.deploymentId)).map((item) => result(item.deploymentId, `Deployment ${item.deploymentId}`, item.status, `/deployments/${item.deploymentId}`)) },
        { category: "Marketplace", results: store.marketplaceInstalls.filter((item) => item.organizationId === actor.organizationId).map((item) => result(item.installId, item.appId, item.status, "/marketplace/installed")) },
        { category: "Docs", results: store.docsArticles.filter((item) => item.status === "published" && matches(item.title)).map((item) => result(item.slug, item.title, item.categorySlug, `/docs/${item.slug}`)) },
        { category: "Tickets", results: store.supportTickets.filter((item) => item.organizationId === actor.organizationId && matches(item.subject)).map((item) => result(item.id, item.subject, item.status, `/support/tickets/${item.id}`)) },
        { category: "Settings", results: this.commandCatalog(actor).filter((item) => item.group === "Settings" && matches(item.label)).map((item) => result(item.id, item.label, item.description, item.href)) }
      ]
    };
  }

  workspaceAnalytics(actor: LifecycleActor) {
    const subscription = store.customerSubscriptions.find((item) => item.organizationId === actor.organizationId);
    const usage = store.customerUsageEvents.filter((item) => item.organizationId === actor.organizationId);
    return {
      projects: store.projects.filter((item) => item.organizationId === actor.organizationId).length + store.factoryProjects.filter((item) => item.organizationId === actor.organizationId).length,
      creditsUsed: usage.reduce((sum, item) => sum + (item.creditsUsed ?? 0), 0),
      storageGb: Math.round(((store.cloudStorageObjects.filter((item) => item.organizationId === actor.organizationId).reduce((sum, item) => sum + item.sizeBytes, 0) + store.supportAttachments.filter((item) => item.organizationId === actor.organizationId).reduce((sum, item) => sum + item.sizeBytes, 0)) / 1024 / 1024 / 1024) * 100) / 100,
      deployments: store.agentDeployments.filter((item) => item.organizationId === actor.organizationId).length,
      apiUsage: store.apiUsageLogs.filter((item) => item.organizationId === actor.organizationId).length,
      users: store.users.filter((item) => item.organizationId === actor.organizationId).length,
      marketplaceInstalls: store.marketplaceInstalls.filter((item) => item.organizationId === actor.organizationId).length,
      billing: { planId: subscription?.planId ?? "free", status: subscription?.status ?? "trial_or_free" },
      support: { openTickets: store.supportTickets.filter((item) => item.organizationId === actor.organizationId && item.status !== "CLOSED" && item.status !== "RESOLVED").length }
    };
  }

  productHealth(actor: LifecycleActor) {
    const analytics = this.workspaceAnalytics(actor);
    const readiness = providerReadinessService.readiness();
    const setup = this.workspaceSetup(actor).setup;
    const recommendations = [
      analytics.projects === 0 ? next("create_first_project", "Create your first project", "/projects/new", "high") : undefined,
      setup.completedSections.length < 5 ? next("finish_workspace_setup", "Finish workspace setup", "/onboarding", "medium") : undefined,
      readiness.totals.missingSecret > 0 ? next("configure_providers", "Configure required providers", "/admin/providers/readiness", "high") : undefined,
      analytics.support.openTickets > 0 ? next("review_support", "Review open support tickets", "/support/tickets", "medium") : undefined
    ].filter(Boolean);
    return {
      workspaceCompleteness: score(setup.completedSections.length, 9),
      securityScore: readiness.totals.missingSecret === 0 ? 90 : 60,
      billingStatus: analytics.billing.status,
      providerReadiness: readiness.totals,
      documentationCompleteness: store.docsArticles.filter((item) => item.status === "published").length,
      teamCompleteness: analytics.users > 1 ? 100 : 45,
      projectHealth: analytics.projects > 0 ? "active" : "needs_first_project",
      recommendations
    };
  }

  private onboardingSnapshot(actor: LifecycleActor, progress: NonNullable<ReturnType<LifecycleService["progress"]>>) {
    return {
      fields: [
        "founderName",
        "companyName",
        "businessType",
        "country",
        "industry",
        "teamSize",
        "productsNeeded",
        "painPoints",
        "revenueStage",
        "preferredPlan",
        "requiredPortals",
        "complianceNeeds",
        "supportNeeds",
        "workspaceName",
        "role",
        "useCase",
        "firstProject",
        "aiProvider",
        "planId"
      ],
      steps: onboardingSteps.map((step) => ({ key: step, completed: progress.completedSteps.includes(step), active: progress.currentStep === step })),
      progress,
      resumeStep: progress.currentStep,
      workspaceSetup: this.workspaceSetup(actor)
    };
  }

  private progress(actor: LifecycleActor) {
    return store.onboardingProgress.find((item) => item.organizationId === actor.organizationId && item.userId === actor.userId);
  }

  private nextStep(completed: StoredOnboardingStep[]) {
    return onboardingSteps.find((step) => !completed.includes(step)) ?? "success";
  }

  private workspaceSetupSections(setup: { completedSections: string[] }) {
    return ["workspace_name", "logo", "timezone", "default_ai_provider", "notifications", "team_invitation", "brand_colors", "project_defaults", "deployment_defaults", "integrations"].map((key) => ({ key, completed: setup.completedSections.includes(key) }));
  }

  private commandCatalog(actor: LifecycleActor) {
    return [
      command("create_project", "Create Project", "Projects", "Start a new VaanForge project.", "/projects/new"),
      command("open_billing", "Open Billing", "Billing", "View plan, usage, credits, and invoices.", "/billing"),
      command("generate_blueprint", "Generate Blueprint", "Factory", "Open the factory blueprint step for the active project.", "/factory/projects"),
      command("invite_user", "Invite User", "Settings", "Invite a teammate to the workspace.", "/settings/team"),
      command("upgrade_plan", "Upgrade Plan", "Billing", "Compare plans and upgrade limits.", "/plans/pricing"),
      command("deploy", "Deploy", "Factory", "Review deployment readiness.", "/factory/projects"),
      command("search_docs", "Search Documentation", "Docs", "Search VaanForge documentation.", "/docs"),
      command("contact_support", "Contact Support", "Support", "Create or review support tickets.", "/support/tickets")
    ].map((item) => ({ ...item, organizationId: actor.organizationId }));
  }
}

function score(value: number, total: number) {
  return Math.min(100, Math.round((value / total) * 100));
}

function tour(key: string, title: string, href: string) {
  return { key, title, href, steps: ["Orient", "Primary action", "Review state", "Next action"] };
}

function feature(key: string, title: string, version: string, description: string, href: string) {
  return { key, title, version, description, href };
}

function command(id: string, label: string, group: string, description: string, href: string) {
  return { id, label, group, description, href };
}

function result(id: string, title: string, description: string, href: string) {
  return { id, title, description, href };
}

function next(id: string, title: string, href: string, priority: "high" | "medium" | "low") {
  return { id, title, href, priority };
}

export const lifecycleService = new LifecycleService();
