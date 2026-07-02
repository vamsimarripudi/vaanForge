import { Router, type Request } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import {
  docsArticleSchema,
  enterpriseDemoSchema,
  enterpriseLeadPatchSchema,
  enterpriseLeadSchema,
  legalPageSchema,
  partnerApplicationSchema,
  publicTrustService,
  releaseSchema,
  statusIncidentSchema,
  statusIncidentUpdateSchema,
  statusServiceSchema
} from "./public-trust.service";

export const docsPublicRouter = Router();
export const docsAdminRouter = Router();
export const statusPublicRouter = Router();
export const statusAdminRouter = Router();
export const legalPagesPublicRouter = Router();
export const legalPagesAdminRouter = Router();
export const releasesPublicRouter = Router();
export const releasesAdminRouter = Router();
export const enterprisePublicRouter = Router();
export const enterpriseAdminRouter = Router();
export const partnersProgramRouter = Router();
export const partnersAdminRouter = Router();

docsPublicRouter.use(rateLimitMiddleware(240, 60));
docsPublicRouter.get("/", (_request, response) => response.json({ data: publicTrustService.docs() }));
docsPublicRouter.get("/categories", (_request, response) => response.json({ data: publicTrustService.docsCategories() }));
docsPublicRouter.get("/search", (request, response) => response.json({ data: publicTrustService.searchDocs(String(request.query.q || "")) }));
docsPublicRouter.get("/:slug", (request, response) => {
  try {
    response.json({ data: publicTrustService.docBySlug(String(request.params.slug)) });
  } catch (error) {
    response.status(404).json({ error: "Documentation article not found", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

docsAdminRouter.use(authMiddleware, requirePermission("settings:manage"), rateLimitMiddleware(90, 60));
docsAdminRouter.post("/", (request, response) => {
  const parsed = docsArticleSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid documentation article", issues: parsed.error.issues });
  response.status(201).json({ data: publicTrustService.createDoc(actor(request), parsed.data) });
});
docsAdminRouter.patch("/:docId", (request, response) => {
  const parsed = docsArticleSchema.partial().safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid documentation update", issues: parsed.error.issues });
  try {
    response.json({ data: publicTrustService.createDoc(actor(request), { slug: String(request.params.docId), title: "Updated documentation", categorySlug: "product", summary: "Updated managed documentation.", body: "Updated managed documentation body.", status: "draft", ...parsed.data }) });
  } catch (error) {
    response.status(404).json({ error: "Documentation update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
docsAdminRouter.post("/:docId/publish", (request, response) => {
  try {
    response.json({ data: publicTrustService.publishDoc(actor(request), String(request.params.docId)) });
  } catch (error) {
    response.status(404).json({ error: "Documentation publish failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

statusPublicRouter.use(rateLimitMiddleware(240, 60));
statusPublicRouter.get("/", (_request, response) => response.json({ data: publicTrustService.status() }));
statusPublicRouter.get("/services", (_request, response) => response.json({ data: publicTrustService.statusServices() }));
statusPublicRouter.get("/incidents", (_request, response) => response.json({ data: publicTrustService.statusIncidents() }));
statusPublicRouter.get("/incidents/:incidentId", (request, response) => {
  try {
    response.json({ data: publicTrustService.statusIncident(String(request.params.incidentId)) });
  } catch (error) {
    response.status(404).json({ error: "Status incident not found", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
statusPublicRouter.get("/history", (_request, response) => response.json({ data: publicTrustService.statusHistory() }));
statusPublicRouter.post("/subscribe", (request, response) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid status subscription", issues: parsed.error.issues });
  response.status(201).json({ data: publicTrustService.subscribeToStatus(parsed.data.email) });
});

statusAdminRouter.use(authMiddleware, requirePermission("audit:read"), rateLimitMiddleware(90, 60));
statusAdminRouter.post("/incidents", (request, response) => {
  const parsed = statusIncidentSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid status incident", issues: parsed.error.issues });
  response.status(201).json({ data: publicTrustService.createIncident(actor(request), parsed.data) });
});
statusAdminRouter.patch("/incidents/:incidentId", (request, response) => {
  const parsed = statusIncidentUpdateSchema.partial().safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid status incident update", issues: parsed.error.issues });
  try {
    response.json({ data: publicTrustService.addIncidentUpdate(actor(request), String(request.params.incidentId), { status: parsed.data.status || "identified", message: parsed.data.message || "Incident details updated." }) });
  } catch (error) {
    response.status(404).json({ error: "Status incident update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
statusAdminRouter.post("/incidents/:incidentId/update", (request, response) => {
  const parsed = statusIncidentUpdateSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid status incident update", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: publicTrustService.addIncidentUpdate(actor(request), String(request.params.incidentId), parsed.data) });
  } catch (error) {
    response.status(404).json({ error: "Status incident update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
statusAdminRouter.post("/services", (request, response) => {
  const parsed = statusServiceSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid status service", issues: parsed.error.issues });
  response.status(201).json({ data: publicTrustService.createStatusService(actor(request), parsed.data) });
});
statusAdminRouter.patch("/services/:serviceId", (request, response) => {
  const parsed = statusServiceSchema.partial().safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid status service update", issues: parsed.error.issues });
  try {
    response.json({ data: publicTrustService.updateStatusService(actor(request), String(request.params.serviceId), parsed.data) });
  } catch (error) {
    response.status(404).json({ error: "Status service update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

legalPagesPublicRouter.use(rateLimitMiddleware(240, 60));
legalPagesPublicRouter.get("/pages", (_request, response) => response.json({ data: publicTrustService.legalPages() }));
legalPagesPublicRouter.get("/pages/:slug", (request, response) => {
  try {
    response.json({ data: publicTrustService.legalPage(String(request.params.slug)) });
  } catch (error) {
    response.status(404).json({ error: "Legal page not found", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

legalPagesAdminRouter.use(authMiddleware, requirePermission("legal:manage"), rateLimitMiddleware(90, 60));
legalPagesAdminRouter.post("/pages", (request, response) => {
  const parsed = legalPageSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid legal page", issues: parsed.error.issues });
  response.status(201).json({ data: publicTrustService.createLegalPage(actor(request), parsed.data) });
});
legalPagesAdminRouter.patch("/pages/:pageId", (request, response) => {
  const parsed = legalPageSchema.partial().safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid legal page update", issues: parsed.error.issues });
  try {
    response.json({ data: publicTrustService.createLegalPage(actor(request), { slug: String(request.params.pageId), title: "Updated legal page", body: "Updated legal page content for KRAVIA PRIVATE LIMITED managed publication.", effectiveDate: "2026-07-01", status: "draft", changelog: "Updated managed legal page.", ...parsed.data }) });
  } catch (error) {
    response.status(404).json({ error: "Legal page update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
legalPagesAdminRouter.post("/pages/:pageId/publish", (request, response) => {
  try {
    response.json({ data: publicTrustService.publishLegalPage(actor(request), String(request.params.pageId)) });
  } catch (error) {
    response.status(404).json({ error: "Legal page publish failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

releasesPublicRouter.use(rateLimitMiddleware(240, 60));
releasesPublicRouter.get("/", (_request, response) => response.json({ data: publicTrustService.releases() }));
releasesPublicRouter.get("/changelog", (_request, response) => response.json({ data: publicTrustService.changelog() }));
releasesPublicRouter.get("/:releaseId", (request, response) => {
  try {
    response.json({ data: publicTrustService.release(String(request.params.releaseId)) });
  } catch (error) {
    response.status(404).json({ error: "Release not found", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

releasesAdminRouter.use(authMiddleware, requirePermission("settings:manage"), rateLimitMiddleware(90, 60));
releasesAdminRouter.post("/", (request, response) => {
  const parsed = releaseSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid release", issues: parsed.error.issues });
  response.status(201).json({ data: publicTrustService.createRelease(actor(request), parsed.data) });
});
releasesAdminRouter.patch("/:releaseId", (request, response) => {
  const parsed = releaseSchema.partial().safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid release update", issues: parsed.error.issues });
  try {
    response.json({ data: publicTrustService.updateRelease(actor(request), String(request.params.releaseId), parsed.data) });
  } catch (error) {
    response.status(404).json({ error: "Release update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
releasesAdminRouter.post("/:releaseId/publish", (request, response) => {
  try {
    response.json({ data: publicTrustService.publishRelease(actor(request), String(request.params.releaseId)) });
  } catch (error) {
    response.status(404).json({ error: "Release publish failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

enterprisePublicRouter.use(rateLimitMiddleware(120, 60));
enterprisePublicRouter.post("/contact-sales", (request, response) => {
  const parsed = enterpriseLeadSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid enterprise lead", issues: parsed.error.issues });
  response.status(201).json({ data: publicTrustService.createEnterpriseLead(parsed.data) });
});
enterprisePublicRouter.post("/demo-request", (request, response) => {
  const parsed = enterpriseDemoSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid demo request", issues: parsed.error.issues });
  response.status(201).json({ data: publicTrustService.createDemoRequest(parsed.data) });
});
enterprisePublicRouter.get("/solutions", (_request, response) => response.json({ data: publicTrustService.enterpriseSolutions() }));
enterprisePublicRouter.get("/security", (_request, response) => response.json({ data: publicTrustService.enterpriseSecurity() }));

enterpriseAdminRouter.use(authMiddleware, requirePermission("settings:manage"), rateLimitMiddleware(90, 60));
enterpriseAdminRouter.get("/leads", (_request, response) => response.json({ data: publicTrustService.adminEnterpriseLeads() }));
enterpriseAdminRouter.get("/demo-requests", (_request, response) => response.json({ data: publicTrustService.adminDemoRequests() }));
enterpriseAdminRouter.patch("/leads/:leadId", (request, response) => {
  const parsed = enterpriseLeadPatchSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid enterprise lead update", issues: parsed.error.issues });
  try {
    response.json({ data: publicTrustService.updateEnterpriseLead(actor(request), String(request.params.leadId), parsed.data) });
  } catch (error) {
    response.status(404).json({ error: "Enterprise lead update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

partnersProgramRouter.use(rateLimitMiddleware(120, 60));
partnersProgramRouter.post("/apply", (request, response) => {
  const parsed = partnerApplicationSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid partner application", issues: parsed.error.issues });
  response.status(201).json({ data: publicTrustService.applyForPartner(parsed.data) });
});
partnersProgramRouter.get("/profile", authMiddleware, (request, response) => response.json({ data: publicTrustService.partnerProfile(actor(request)) }));
partnersProgramRouter.get("/referrals", authMiddleware, (request, response) => response.json({ data: publicTrustService.partnerReferrals(actor(request)) }));
partnersProgramRouter.get("/commissions", authMiddleware, (request, response) => response.json({ data: publicTrustService.partnerCommissions(actor(request)) }));
partnersProgramRouter.get("/payouts", authMiddleware, (request, response) => response.json({ data: publicTrustService.partnerPayouts(actor(request)) }));
partnersProgramRouter.get("/resources", (_request, response) => response.json({ data: publicTrustService.partnerResources() }));

partnersAdminRouter.use(authMiddleware, requirePermission("settings:manage"), rateLimitMiddleware(90, 60));
partnersAdminRouter.get("/applications", (_request, response) => response.json({ data: publicTrustService.adminPartnerApplications() }));
partnersAdminRouter.post("/applications/:applicationId/approve", (request, response) => {
  try {
    response.json({ data: publicTrustService.decidePartnerApplication(actor(request), String(request.params.applicationId), "approved") });
  } catch (error) {
    response.status(404).json({ error: "Partner application approval failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
partnersAdminRouter.post("/applications/:applicationId/reject", (request, response) => {
  try {
    response.json({ data: publicTrustService.decidePartnerApplication(actor(request), String(request.params.applicationId), "rejected") });
  } catch (error) {
    response.status(404).json({ error: "Partner application rejection failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
partnersAdminRouter.get("/", (_request, response) => response.json({ data: publicTrustService.adminPartners() }));
partnersAdminRouter.patch("/:partnerId", (request, response) => {
  const parsed = z.object({ status: z.enum(["PROSPECT", "ACTIVE", "PAUSED", "ENDED"]).optional(), revenueSharePercent: z.number().min(0).max(100).optional() }).safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid partner update", issues: parsed.error.issues });
  try {
    response.json({ data: publicTrustService.updatePartner(actor(request), String(request.params.partnerId), parsed.data) });
  } catch (error) {
    response.status(404).json({ error: "Partner update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

function actor(request: Request) {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}
