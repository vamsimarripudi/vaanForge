import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { z } from "zod";
import { auditService } from "../audit/audit.service";
import {
  createId,
  store,
  type StoredDocsArticle,
  type StoredLegalPage,
  type StoredReleaseNote,
  type StoredStatusIncident,
  type StoredStatusService
} from "../../database/in-memory-store";

type Actor = { organizationId: string; userId: string; role: string };

export const docsArticleSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  categorySlug: z.string().min(2).default("product"),
  summary: z.string().min(8),
  body: z.string().min(20),
  status: z.enum(["draft", "published", "archived"]).default("draft")
});

export const statusIncidentSchema = z.object({
  title: z.string().min(4),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  serviceIds: z.array(z.string().min(2)).default([]),
  impact: z.string().min(8)
});

export const statusIncidentUpdateSchema = z.object({
  status: z.enum(["investigating", "identified", "monitoring", "resolved"]),
  message: z.string().min(8)
});

export const statusServiceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  status: z.enum(["operational", "degraded", "partial_outage", "major_outage", "monitoring_setup_required"]).default("monitoring_setup_required"),
  monitoringConnected: z.boolean().default(false),
  owner: z.string().min(2).default("KRAVIA Operations")
});

export const legalPageSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  body: z.string().min(30),
  effectiveDate: z.string().min(8),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  changelog: z.string().min(4).default("Initial managed policy version.")
});

export const releaseSchema = z.object({
  version: z.string().min(2),
  title: z.string().min(2),
  summary: z.string().min(8),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  migrationNotes: z.string().default("No migration notes recorded."),
  knownIssues: z.array(z.string()).default([]),
  changelogItems: z.array(z.object({ type: z.enum(["added", "changed", "fixed", "security", "deprecated"]), description: z.string().min(4) })).default([])
});

export const enterpriseLeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(2).optional(),
  message: z.string().min(10)
});

export const enterpriseDemoSchema = enterpriseLeadSchema.extend({
  preferredDate: z.string().optional(),
  useCase: z.string().min(8)
});

export const enterpriseLeadPatchSchema = z.object({
  status: z.enum(["new", "qualified", "contacted", "closed"]).optional(),
  ownerId: z.string().optional()
});

export const partnerApplicationSchema = z.object({
  applicantName: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(2).optional(),
  partnerType: z.enum(["agency", "freelancer", "consultant", "system_integrator"]),
  message: z.string().min(10)
});

export class PublicTrustService {
  docs() {
    this.seedDocsFromRepository();
    return {
      articles: store.docsArticles.filter((article) => article.status === "published").map((article) => this.publicDoc(article)),
      categories: this.docsCategories(),
      nextAction: "Open a guide or search documentation by workflow, API, billing, or security topic."
    };
  }

  docBySlug(slug: string) {
    this.seedDocsFromRepository();
    const article = store.docsArticles.find((item) => item.slug === slug && item.status === "published");
    if (!article) throw new Error("Documentation article not found.");
    return this.publicDoc(article, true);
  }

  searchDocs(query: string) {
    this.seedDocsFromRepository();
    const normalized = query.trim().toLowerCase();
    const articles = store.docsArticles
      .filter((article) => article.status === "published")
      .filter((article) => !normalized || [article.title, article.summary, article.body, article.categorySlug].join(" ").toLowerCase().includes(normalized))
      .map((article) => this.publicDoc(article));
    return { query, results: articles, count: articles.length };
  }

  docsCategories() {
    this.seedDocsFromRepository();
    return store.docsCategories.filter((category) => category.status === "active");
  }

  createDoc(actor: Actor, input: z.infer<typeof docsArticleSchema>) {
    const parsed = docsArticleSchema.parse(input);
    const now = new Date().toISOString();
    const existing = store.docsArticles.find((article) => article.slug === parsed.slug);
    if (existing) {
      existing.title = sanitize(parsed.title);
      existing.summary = sanitize(parsed.summary);
      existing.body = sanitize(parsed.body);
      existing.categorySlug = sanitize(parsed.categorySlug);
      existing.status = parsed.status;
      existing.version += 1;
      existing.updatedAt = now;
      this.recordDocVersion(existing, actor.userId, "Updated managed documentation article.");
      this.audit(actor, "DOCS_ARTICLE_UPDATED", "DocsArticle", existing.docId);
      return existing;
    }
    const article: StoredDocsArticle = {
      id: createId("doc"),
      docId: createId("doc"),
      slug: slugify(parsed.slug),
      title: sanitize(parsed.title),
      categorySlug: sanitize(parsed.categorySlug),
      summary: sanitize(parsed.summary),
      body: sanitize(parsed.body),
      status: parsed.status,
      version: 1,
      createdBy: actor.userId,
      publishedAt: parsed.status === "published" ? now : undefined,
      createdAt: now,
      updatedAt: now
    };
    store.docsArticles.push(article);
    this.ensureDocCategory(article.categorySlug);
    this.recordDocVersion(article, actor.userId, "Initial managed documentation article.");
    this.audit(actor, "DOCS_ARTICLE_CREATED", "DocsArticle", article.docId);
    return article;
  }

  publishDoc(actor: Actor, docId: string) {
    const article = store.docsArticles.find((item) => item.docId === docId);
    if (!article) throw new Error("Documentation article not found.");
    article.status = "published";
    article.publishedAt = new Date().toISOString();
    article.updatedAt = article.publishedAt;
    this.audit(actor, "DOCS_ARTICLE_PUBLISHED", "DocsArticle", article.docId);
    return article;
  }

  status() {
    this.seedStatusServices();
    const incidents = store.statusIncidents.filter((incident) => incident.status !== "resolved");
    const services = store.statusServices;
    return {
      status: incidents.length ? "incident_active" : services.some((service) => service.status !== "operational") ? "attention_required" : "operational",
      services,
      incidents,
      note: services.some((service) => !service.monitoringConnected)
        ? "Some services are not connected to automated monitoring yet. VaanForge does not publish uptime percentages without monitoring evidence."
        : "Service states are backed by health check records."
    };
  }

  statusServices() {
    this.seedStatusServices();
    return store.statusServices;
  }

  statusIncidents() {
    return store.statusIncidents.map((incident) => this.publicIncident(incident));
  }

  statusIncident(incidentId: string) {
    const incident = store.statusIncidents.find((item) => item.incidentId === incidentId);
    if (!incident) throw new Error("Incident not found.");
    return this.publicIncident(incident);
  }

  statusHistory() {
    return {
      incidents: store.statusIncidents.filter((incident) => incident.status === "resolved").map((incident) => this.publicIncident(incident)),
      healthChecks: store.statusHealthChecks
    };
  }

  subscribeToStatus(email: string) {
    const parsed = z.string().email().parse(email);
    const existing = store.statusSubscribers.find((subscriber) => subscriber.email === parsed);
    if (existing) return existing;
    const subscriber = { id: createId("stsub"), subscriberId: createId("status_subscriber"), email: parsed, status: "active" as const, createdAt: new Date().toISOString() };
    store.statusSubscribers.push(subscriber);
    return subscriber;
  }

  createStatusService(actor: Actor, input: z.infer<typeof statusServiceSchema>) {
    const parsed = statusServiceSchema.parse(input);
    const now = new Date().toISOString();
    const service: StoredStatusService = {
      id: createId("svc"),
      serviceId: createId("status_service"),
      name: sanitize(parsed.name),
      slug: slugify(parsed.slug),
      status: parsed.status,
      monitoringConnected: parsed.monitoringConnected,
      owner: sanitize(parsed.owner),
      createdAt: now,
      updatedAt: now
    };
    store.statusServices.push(service);
    this.audit(actor, "STATUS_SERVICE_CREATED", "StatusService", service.serviceId);
    return service;
  }

  updateStatusService(actor: Actor, serviceId: string, input: Partial<z.infer<typeof statusServiceSchema>>) {
    const service = store.statusServices.find((item) => item.serviceId === serviceId);
    if (!service) throw new Error("Status service not found.");
    const parsed = statusServiceSchema.partial().parse(input);
    Object.assign(service, {
      name: parsed.name ? sanitize(parsed.name) : service.name,
      slug: parsed.slug ? slugify(parsed.slug) : service.slug,
      status: parsed.status ?? service.status,
      monitoringConnected: parsed.monitoringConnected ?? service.monitoringConnected,
      owner: parsed.owner ? sanitize(parsed.owner) : service.owner,
      updatedAt: new Date().toISOString()
    });
    this.audit(actor, "STATUS_SERVICE_UPDATED", "StatusService", service.serviceId);
    return service;
  }

  createIncident(actor: Actor, input: z.infer<typeof statusIncidentSchema>) {
    const parsed = statusIncidentSchema.parse(input);
    const now = new Date().toISOString();
    const incident: StoredStatusIncident = {
      id: createId("stinc"),
      incidentId: createId("incident"),
      title: sanitize(parsed.title),
      severity: parsed.severity,
      status: "investigating",
      serviceIds: parsed.serviceIds.map(sanitize),
      impact: sanitize(parsed.impact),
      ownerId: actor.userId,
      createdAt: now,
      updatedAt: now
    };
    store.statusIncidents.push(incident);
    this.addIncidentUpdate(actor, incident.incidentId, { status: "investigating", message: "Incident opened and investigation started." });
    this.audit(actor, "STATUS_INCIDENT_CREATED", "StatusIncident", incident.incidentId);
    return this.publicIncident(incident);
  }

  addIncidentUpdate(actor: Actor, incidentId: string, input: z.infer<typeof statusIncidentUpdateSchema>) {
    const parsed = statusIncidentUpdateSchema.parse(input);
    const incident = store.statusIncidents.find((item) => item.incidentId === incidentId);
    if (!incident) throw new Error("Incident not found.");
    const now = new Date().toISOString();
    incident.status = parsed.status;
    incident.updatedAt = now;
    if (parsed.status === "resolved") incident.resolvedAt = now;
    const update = { id: createId("stupd"), updateId: createId("incident_update"), incidentId, status: parsed.status, message: sanitize(parsed.message), createdBy: actor.userId, createdAt: now };
    store.statusIncidentUpdates.push(update);
    this.audit(actor, "STATUS_INCIDENT_UPDATED", "StatusIncident", incident.incidentId, { status: parsed.status });
    return { incident: this.publicIncident(incident), update };
  }

  legalPages() {
    this.seedLegalPages();
    return store.legalPages.filter((page) => page.status === "published").map((page) => this.publicLegalPage(page));
  }

  legalPage(slug: string) {
    this.seedLegalPages();
    const page = store.legalPages.find((item) => item.slug === slug && item.status === "published");
    if (!page) throw new Error("Legal page not found.");
    return this.publicLegalPage(page, true);
  }

  createLegalPage(actor: Actor, input: z.infer<typeof legalPageSchema>) {
    const parsed = legalPageSchema.parse(input);
    const now = new Date().toISOString();
    const existing = store.legalPages.find((page) => page.slug === parsed.slug);
    if (existing) {
      existing.title = sanitize(parsed.title);
      existing.body = sanitize(parsed.body);
      existing.effectiveDate = parsed.effectiveDate;
      existing.status = parsed.status;
      existing.version += 1;
      existing.updatedAt = now;
      this.recordLegalVersion(existing, actor.userId, parsed.changelog);
      this.audit(actor, "LEGAL_PAGE_UPDATED", "LegalPage", existing.pageId);
      return existing;
    }
    const page: StoredLegalPage = {
      id: createId("lpage"),
      pageId: createId("legal_page"),
      slug: slugify(parsed.slug),
      title: sanitize(parsed.title),
      body: sanitize(parsed.body),
      version: 1,
      effectiveDate: parsed.effectiveDate,
      status: parsed.status,
      createdBy: actor.userId,
      publishedAt: parsed.status === "published" ? now : undefined,
      createdAt: now,
      updatedAt: now
    };
    store.legalPages.push(page);
    this.recordLegalVersion(page, actor.userId, parsed.changelog);
    this.audit(actor, "LEGAL_PAGE_CREATED", "LegalPage", page.pageId);
    return page;
  }

  publishLegalPage(actor: Actor, pageId: string) {
    const page = store.legalPages.find((item) => item.pageId === pageId);
    if (!page) throw new Error("Legal page not found.");
    page.status = "published";
    page.publishedAt = new Date().toISOString();
    page.updatedAt = page.publishedAt;
    this.audit(actor, "LEGAL_PAGE_PUBLISHED", "LegalPage", page.pageId);
    return page;
  }

  releases() {
    this.seedReleases();
    return store.releaseNotes.filter((release) => release.status === "published").map((release) => this.publicRelease(release));
  }

  release(releaseId: string) {
    this.seedReleases();
    const release = store.releaseNotes.find((item) => item.releaseId === releaseId || item.version === releaseId);
    if (!release || release.status !== "published") throw new Error("Release not found.");
    return this.publicRelease(release, true);
  }

  changelog() {
    this.seedReleases();
    return store.releaseChangelogItems.map((item) => ({ ...item, release: store.releaseNotes.find((release) => release.releaseId === item.releaseId) })).filter((item) => item.release?.status === "published");
  }

  createRelease(actor: Actor, input: z.infer<typeof releaseSchema>) {
    const parsed = releaseSchema.parse(input);
    const now = new Date().toISOString();
    const release: StoredReleaseNote = {
      id: createId("rel"),
      releaseId: createId("release"),
      version: sanitize(parsed.version),
      title: sanitize(parsed.title),
      summary: sanitize(parsed.summary),
      status: parsed.status,
      releasedAt: parsed.status === "published" ? now : undefined,
      createdBy: actor.userId,
      createdAt: now,
      updatedAt: now
    };
    store.releaseNotes.push(release);
    store.releaseVersions.push({ id: createId("relv"), versionId: createId("release_version"), releaseId: release.releaseId, version: release.version, migrationNotes: sanitize(parsed.migrationNotes), knownIssues: parsed.knownIssues.map(sanitize), createdAt: now });
    for (const item of parsed.changelogItems) {
      store.releaseChangelogItems.push({ id: createId("relc"), itemId: createId("changelog"), releaseId: release.releaseId, type: item.type, description: sanitize(item.description), createdAt: now });
    }
    this.audit(actor, "RELEASE_CREATED", "Release", release.releaseId);
    return this.publicRelease(release, true);
  }

  updateRelease(actor: Actor, releaseId: string, input: Partial<z.infer<typeof releaseSchema>>) {
    const release = store.releaseNotes.find((item) => item.releaseId === releaseId);
    if (!release) throw new Error("Release not found.");
    const parsed = releaseSchema.partial().parse(input);
    if (parsed.title) release.title = sanitize(parsed.title);
    if (parsed.summary) release.summary = sanitize(parsed.summary);
    if (parsed.status) release.status = parsed.status;
    release.updatedAt = new Date().toISOString();
    this.audit(actor, "RELEASE_UPDATED", "Release", release.releaseId);
    return this.publicRelease(release, true);
  }

  publishRelease(actor: Actor, releaseId: string) {
    const release = store.releaseNotes.find((item) => item.releaseId === releaseId);
    if (!release) throw new Error("Release not found.");
    release.status = "published";
    release.releasedAt = new Date().toISOString();
    release.updatedAt = release.releasedAt;
    this.audit(actor, "RELEASE_PUBLISHED", "Release", release.releaseId);
    return this.publicRelease(release, true);
  }

  createEnterpriseLead(input: z.infer<typeof enterpriseLeadSchema>) {
    const parsed = enterpriseLeadSchema.parse(input);
    const now = new Date().toISOString();
    const lead = { id: createId("elead"), leadId: createId("enterprise_lead"), name: sanitize(parsed.name), email: parsed.email, company: parsed.company ? sanitize(parsed.company) : undefined, message: sanitize(parsed.message), status: "new" as const, createdAt: now, updatedAt: now };
    store.enterpriseLeads.push(lead);
    return lead;
  }

  createDemoRequest(input: z.infer<typeof enterpriseDemoSchema>) {
    const parsed = enterpriseDemoSchema.parse(input);
    const now = new Date().toISOString();
    const request = { id: createId("edemo"), requestId: createId("demo_request"), name: sanitize(parsed.name), email: parsed.email, company: parsed.company ? sanitize(parsed.company) : undefined, preferredDate: parsed.preferredDate, useCase: sanitize(parsed.useCase), status: "new" as const, createdAt: now, updatedAt: now };
    store.enterpriseDemoRequests.push(request);
    return request;
  }

  enterpriseSolutions() {
    this.seedEnterpriseContent();
    return store.enterpriseSolutionPages.filter((page) => page.status === "published");
  }

  enterpriseSecurity() {
    return {
      title: "VaanForge enterprise security",
      claims: [],
      controls: ["RBAC", "tenant isolation", "signed webhooks", "audit logs", "secret masking", "prompt-injection screening"],
      note: "Compliance certifications are not claimed until externally verified. Security materials are managed by KRAVIA PRIVATE LIMITED."
    };
  }

  adminEnterpriseLeads() {
    return store.enterpriseLeads;
  }

  adminDemoRequests() {
    return store.enterpriseDemoRequests;
  }

  updateEnterpriseLead(actor: Actor, leadId: string, input: z.infer<typeof enterpriseLeadPatchSchema>) {
    const lead = store.enterpriseLeads.find((item) => item.leadId === leadId);
    if (!lead) throw new Error("Enterprise lead not found.");
    const parsed = enterpriseLeadPatchSchema.parse(input);
    if (parsed.status) lead.status = parsed.status;
    if (parsed.ownerId) lead.ownerId = sanitize(parsed.ownerId);
    lead.updatedAt = new Date().toISOString();
    this.audit(actor, "ENTERPRISE_LEAD_UPDATED", "EnterpriseLead", lead.leadId);
    return lead;
  }

  applyForPartner(input: z.infer<typeof partnerApplicationSchema>) {
    const parsed = partnerApplicationSchema.parse(input);
    const now = new Date().toISOString();
    const application = { id: createId("papp"), applicationId: createId("partner_application"), applicantName: sanitize(parsed.applicantName), email: parsed.email, company: parsed.company ? sanitize(parsed.company) : undefined, partnerType: parsed.partnerType, message: sanitize(parsed.message), status: "submitted" as const, createdAt: now, updatedAt: now };
    store.partnerApplications.push(application);
    return application;
  }

  partnerProfile(actor: Actor) {
    const partner = store.partners.find((item) => item.organizationId === actor.organizationId);
    return { partner: partner || null, application: store.partnerApplications.find((item) => item.email === actor.userId), nextAction: partner ? "Track referrals, commissions, and payouts." : "Submit a partner application before referrals or commissions are available." };
  }

  partnerReferrals(actor: Actor) {
    const partner = this.partnerForActor(actor);
    return partner ? store.partnerReferrals.filter((referral) => referral.partnerId === partner.id) : [];
  }

  partnerCommissions(actor: Actor) {
    const partner = this.partnerForActor(actor);
    return partner ? store.partnerCommissions.filter((commission) => commission.partnerId === partner.id) : [];
  }

  partnerPayouts(actor: Actor) {
    const partner = this.partnerForActor(actor);
    return partner ? store.partnerPayouts.filter((payout) => payout.partnerId === partner.id) : [];
  }

  partnerResources() {
    this.seedPartnerResources();
    return store.partnerResources.filter((resource) => resource.status === "published");
  }

  adminPartnerApplications() {
    return store.partnerApplications;
  }

  decidePartnerApplication(actor: Actor, applicationId: string, status: "approved" | "rejected") {
    const application = store.partnerApplications.find((item) => item.applicationId === applicationId);
    if (!application) throw new Error("Partner application not found.");
    application.status = status;
    application.updatedAt = new Date().toISOString();
    if (status === "approved" && !store.partners.some((partner) => partner.name === application.applicantName)) {
      store.partners.push({ id: createId("par"), organizationId: actor.organizationId, name: application.applicantName, status: "ACTIVE", revenueSharePercent: 20, createdAt: application.updatedAt });
    }
    this.audit(actor, `PARTNER_APPLICATION_${status.toUpperCase()}`, "PartnerApplication", application.applicationId);
    return application;
  }

  adminPartners() {
    return store.partners;
  }

  updatePartner(actor: Actor, partnerId: string, input: { status?: "PROSPECT" | "ACTIVE" | "PAUSED" | "ENDED"; revenueSharePercent?: number }) {
    const partner = store.partners.find((item) => item.id === partnerId);
    if (!partner) throw new Error("Partner not found.");
    if (input.status) partner.status = input.status;
    if (typeof input.revenueSharePercent === "number") partner.revenueSharePercent = Math.max(0, Math.min(100, input.revenueSharePercent));
    this.audit(actor, "PARTNER_UPDATED", "Partner", partner.id);
    return partner;
  }

  private publicDoc(article: StoredDocsArticle, includeBody = false) {
    return {
      docId: article.docId,
      slug: article.slug,
      title: article.title,
      categorySlug: article.categorySlug,
      summary: article.summary,
      body: includeBody ? article.body : undefined,
      version: article.version,
      sourcePath: article.sourcePath,
      updatedAt: article.updatedAt
    };
  }

  private publicIncident(incident: StoredStatusIncident) {
    return {
      ...incident,
      updates: store.statusIncidentUpdates.filter((update) => update.incidentId === incident.incidentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    };
  }

  private publicLegalPage(page: StoredLegalPage, includeBody = false) {
    return {
      pageId: page.pageId,
      slug: page.slug,
      title: page.title,
      body: includeBody ? page.body : undefined,
      version: page.version,
      effectiveDate: page.effectiveDate,
      lastUpdatedAt: page.updatedAt,
      company: "KRAVIA PRIVATE LIMITED"
    };
  }

  private publicRelease(release: StoredReleaseNote, includeDetails = false) {
    return {
      ...release,
      versionInfo: includeDetails ? store.releaseVersions.find((item) => item.releaseId === release.releaseId) : undefined,
      changelog: includeDetails ? store.releaseChangelogItems.filter((item) => item.releaseId === release.releaseId) : undefined
    };
  }

  private recordDocVersion(article: StoredDocsArticle, createdBy: string, changelog: string) {
    store.docsVersions.push({ id: createId("docv"), versionId: createId("doc_version"), docId: article.docId, version: article.version, body: article.body, changelog, createdBy, createdAt: new Date().toISOString() });
    store.docsSearchIndex = store.docsSearchIndex.filter((item) => item.docId !== article.docId);
    store.docsSearchIndex.push({ id: createId("docidx"), docId: article.docId, terms: [article.title, article.summary, article.body, article.categorySlug].join(" ").toLowerCase(), updatedAt: new Date().toISOString() });
  }

  private recordLegalVersion(page: StoredLegalPage, createdBy: string, changelog: string) {
    store.legalPageVersions.push({ id: createId("lpv"), versionId: createId("legal_version"), pageId: page.pageId, version: page.version, body: page.body, effectiveDate: page.effectiveDate, changelog: sanitize(changelog), createdBy, createdAt: new Date().toISOString() });
  }

  private ensureDocCategory(slug: string) {
    if (store.docsCategories.some((category) => category.slug === slug)) return;
    store.docsCategories.push({ id: createId("doccat"), categoryId: createId("docs_category"), slug, title: titleize(slug), description: `${titleize(slug)} documentation for VaanForge.`, status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  private seedDocsFromRepository() {
    if (store.docsArticles.length) return;
    const docsRoot = resolve(process.cwd(), basename(process.cwd()).toLowerCase() === "backend" ? "../docs" : "docs");
    const candidates = ["01-introduction.md", "03-installation.md", "09-security.md", "product/marketplace.md", "product/status-page.md", "product/legal-pages.md", "product/releases.md", "product/enterprise-sales.md", "product/partners.md"];
    for (const relativePath of candidates) {
      const fullPath = join(docsRoot, relativePath);
      if (!existsSync(fullPath)) continue;
      const body = readFileSync(fullPath, "utf8").trim();
      if (!body) continue;
      const title = body.match(/^#\s+(.+)$/m)?.[1] || titleize(relativePath.replace(/\.md$/, ""));
      const categorySlug = relativePath.includes("/") ? relativePath.split("/")[0] : "getting-started";
      const now = new Date().toISOString();
      const article: StoredDocsArticle = { id: createId("doc"), docId: createId("doc"), slug: slugify(relativePath.replace(/\.md$/, "")), title: sanitize(title), categorySlug, summary: summarize(body), body: sanitizeBody(body), sourcePath: `docs/${relativePath}`, status: "published", version: 1, createdBy: "repository", publishedAt: now, createdAt: now, updatedAt: now };
      store.docsArticles.push(article);
      this.ensureDocCategory(categorySlug);
      this.recordDocVersion(article, "repository", "Seeded from repository documentation.");
    }
  }

  private seedStatusServices() {
    if (store.statusServices.length) return;
    const names = ["API", "Auth", "AI Providers", "Factory", "Agents", "Billing", "Marketplace", "Deployments", "Files/Storage", "Email", "Webhooks", "Docs", "Support"];
    const now = new Date().toISOString();
    for (const name of names) {
      store.statusServices.push({ id: createId("svc"), serviceId: createId("status_service"), name, slug: slugify(name), status: "monitoring_setup_required", monitoringConnected: false, owner: "KRAVIA Operations", createdAt: now, updatedAt: now });
    }
  }

  private seedLegalPages() {
    if (store.legalPages.length) return;
    const pages = [
      ["privacy-policy", "Privacy Policy"],
      ["terms-of-use", "Terms of Use"],
      ["terms-and-conditions", "Terms and Conditions"],
      ["refund-cancellation-policy", "Refund and Cancellation Policy"],
      ["payment-policy", "Payment Policy"],
      ["cookie-policy", "Cookie Policy"],
      ["data-usage-policy", "Data Usage Policy"],
      ["plan-limits", "Plan Limits"],
      ["security", "Security"],
      ["acceptable-use", "Acceptable Use"],
      ["subprocessors", "Subprocessors"],
      ["contact", "Legal Contact"]
    ];
    for (const [slug, title] of pages) {
      const body = `${title} for VaanForge by KRAVIA PRIVATE LIMITED. This managed policy page records version, effective date, and last updated date. Production publication requires legal review before external launch.`;
      this.createSeedLegalPage(slug, title, body);
    }
  }

  private createSeedLegalPage(slug: string, title: string, body: string) {
    const now = new Date().toISOString();
    const page: StoredLegalPage = { id: createId("lpage"), pageId: createId("legal_page"), slug, title, body, version: 1, effectiveDate: "2026-07-01", status: "draft", createdBy: "system", createdAt: now, updatedAt: now };
    store.legalPages.push(page);
    this.recordLegalVersion(page, "system", "Seeded managed policy page.");
  }

  private seedReleases() {
    if (store.releaseNotes.length) return;
    const now = new Date().toISOString();
    const changelog = this.readFirstExisting(["CHANGELOG.md", "RELEASE_NOTES_RC1.md"]);
    const summary = changelog ? summarize(changelog) : "No public release notes have been published yet.";
    const release: StoredReleaseNote = { id: createId("rel"), releaseId: createId("release"), version: "v1.0.0-rc1", title: "VaanForge RC1", summary, status: changelog ? "published" : "draft", releasedAt: changelog ? now : undefined, createdBy: "repository", createdAt: now, updatedAt: now };
    store.releaseNotes.push(release);
    store.releaseVersions.push({ id: createId("relv"), versionId: createId("release_version"), releaseId: release.releaseId, version: release.version, migrationNotes: "See repository release documentation.", knownIssues: [], createdAt: now });
    if (changelog) store.releaseChangelogItems.push({ id: createId("relc"), itemId: createId("changelog"), releaseId: release.releaseId, type: "changed", description: summary, createdAt: now });
  }

  private seedEnterpriseContent() {
    if (store.enterpriseSolutionPages.length) return;
    const now = new Date().toISOString();
    store.enterpriseSolutionPages.push({ id: createId("esol"), solutionId: createId("enterprise_solution"), slug: "ai-software-factory", title: "AI Software Factory", summary: "Enterprise software delivery workflows with human approvals, billing controls, and deployment governance.", body: "VaanForge helps teams move from requirements to release through governed AI workflows. Security and compliance claims remain evidence-backed.", status: "published", updatedAt: now });
  }

  private seedPartnerResources() {
    if (store.partnerResources.length) return;
    const now = new Date().toISOString();
    store.partnerResources.push({ id: createId("pres"), resourceId: createId("partner_resource"), slug: "partner-onboarding", title: "Partner onboarding", summary: "Steps for agencies, consultants, freelancers, and system integrators to apply and operate in the VaanForge partner program.", status: "published", updatedAt: now });
  }

  private readFirstExisting(paths: string[]) {
    const root = resolve(process.cwd(), basename(process.cwd()).toLowerCase() === "backend" ? ".." : ".");
    for (const relativePath of paths) {
      const fullPath = join(root, relativePath);
      if (existsSync(fullPath)) return readFileSync(fullPath, "utf8").trim();
    }
    return "";
  }

  private partnerForActor(actor: Actor) {
    return store.partners.find((partner) => partner.organizationId === actor.organizationId);
  }

  private audit(actor: Actor, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: "VAANFORGE_AGENT_RUN", entityType, entityId, metadata: { publicTrustAction: action, ...metadata } });
  }
}

function sanitize(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/secret|token|provider api key|private key/gi, "[removed]").trim();
}

function sanitizeBody(value: string) {
  return value.replace(/secret|token|provider api key|private key/gi, "[removed]").trim();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/\\/g, "/").replace(/\.md$/g, "").replace(/[^a-z0-9/]+/g, "-").replace(/\/+/g, "/").replace(/^-|-$/g, "");
}

function titleize(value: string) {
  return value.replace(/[/-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function summarize(value: string) {
  return sanitizeBody(value.replace(/^#.+$/gm, "").replace(/\s+/g, " ").trim()).slice(0, 220) || "Managed VaanForge content.";
}

export const publicTrustService = new PublicTrustService();
