import { Router, type Request } from "express";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import {
  marketplaceAppSchema,
  marketplaceInstallSchema,
  marketplaceReviewDecisionSchema,
  marketplaceService,
  marketplaceVersionSchema,
  publisherSchema
} from "./marketplace.service";

export const marketplaceRouter = Router();
export const marketplacePublisherRouter = Router();
export const marketplaceAdminRouter = Router();
export const marketplaceWorkspaceRouter = Router();

marketplaceRouter.use(rateLimitMiddleware(120, 60));
marketplacePublisherRouter.use(authMiddleware, rateLimitMiddleware(90, 60));
marketplaceAdminRouter.use(authMiddleware, rateLimitMiddleware(90, 60));
marketplaceWorkspaceRouter.use(authMiddleware, rateLimitMiddleware(90, 60));

marketplaceRouter.get("/apps", (request, response) => {
  response.json({ data: marketplaceService.storefront(actorOptional(request), { type: query(request, "type"), category: query(request, "category"), search: query(request, "search") }) });
});

marketplaceRouter.get("/categories", (_request, response) => {
  response.json({ data: marketplaceService.categories() });
});

marketplaceRouter.get("/apps/:appId", (request, response) => {
  try {
    response.json({ data: marketplaceService.appDetail(actorOptional(request), String(request.params.appId)) });
  } catch (error) {
    response.status(404).json({ error: "Marketplace app not found", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceRouter.post("/apps", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = marketplaceAppSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid marketplace app", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: marketplaceService.createApp(actor(request), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Marketplace app creation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceRouter.patch("/apps/:appId", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = marketplaceAppSchema.partial().safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid marketplace app update", issues: parsed.error.issues });
  try {
    response.json({ data: marketplaceService.updateApp(actor(request), String(request.params.appId), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Marketplace app update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceRouter.post("/apps/:appId/submit-review", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  try {
    const body = request.body && Object.keys(request.body).length ? request.body : undefined;
    response.json({ data: marketplaceService.submitApp(actor(request), String(request.params.appId), body) });
  } catch (error) {
    response.status(400).json({ error: "Marketplace submission failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceRouter.post("/apps/:appId/publish", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  try {
    response.json({ data: marketplaceService.publishApp(actor(request), String(request.params.appId)) });
  } catch (error) {
    response.status(400).json({ error: "Marketplace publish failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceRouter.post("/apps/:appId/install", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const parsed = marketplaceInstallSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid marketplace install", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: marketplaceService.install(actor(request), String(request.params.appId), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Marketplace install failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceRouter.post("/apps/:appId/uninstall", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  try {
    response.json({ data: marketplaceService.uninstall(actor(request), String(request.params.appId)) });
  } catch (error) {
    response.status(404).json({ error: "Marketplace uninstall failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceRouter.get("/installs", authMiddleware, (request, response) => {
  response.json({ data: marketplaceService.workspaceApps(actor(request)) });
});

marketplaceRouter.get("/publisher", authMiddleware, (request, response) => {
  response.json({ data: marketplaceService.publisherDashboard(actor(request)) });
});

marketplaceRouter.get("/publisher/apps", authMiddleware, (request, response) => {
  response.json({ data: marketplaceService.publisherApps(actor(request)) });
});

marketplaceRouter.get("/publisher/revenue", authMiddleware, (request, response) => {
  response.json({ data: marketplaceService.publisherRevenue(actor(request)) });
});

marketplaceRouter.post("/apps/:appId/reviews", authMiddleware, requirePermission("workspace:create"), (_request, response) => {
  response.status(501).json({ error: "Customer marketplace reviews are not enabled", message: "Ratings and customer reviews require a published review policy before collection.", nextAction: "Use marketplace install records and admin review gates until customer reviews are enabled." });
});

marketplacePublisherRouter.get("/", authMiddleware, (request, response) => {
  response.json({ data: marketplaceService.publisherDashboard(actor(request)) });
});

marketplacePublisherRouter.post("/", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = publisherSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid publisher profile", issues: parsed.error.issues });
  response.status(201).json({ data: marketplaceService.createPublisher(actor(request), parsed.data) });
});

marketplacePublisherRouter.get("/apps", authMiddleware, (request, response) => {
  response.json({ data: marketplaceService.publisherApps(actor(request)) });
});

marketplacePublisherRouter.post("/apps", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = marketplaceAppSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid marketplace app", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: marketplaceService.createApp(actor(request), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Marketplace app creation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplacePublisherRouter.post("/apps/:appId/submit", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  try {
    const body = request.body && Object.keys(request.body).length ? request.body : undefined;
    response.json({ data: marketplaceService.submitApp(actor(request), String(request.params.appId), body) });
  } catch (error) {
    response.status(400).json({ error: "Marketplace submission failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplacePublisherRouter.post("/apps/:appId/versions", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = marketplaceVersionSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid marketplace version", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: marketplaceService.createVersion(actor(request), String(request.params.appId), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Marketplace version creation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplacePublisherRouter.get("/payouts", authMiddleware, (request, response) => {
  response.json({ data: marketplaceService.payouts(actor(request)) });
});

marketplaceAdminRouter.get("/reviews", authMiddleware, (request, response) => {
  response.json({ data: marketplaceService.reviews(actor(request)) });
});

marketplaceAdminRouter.post("/reviews/:reviewId/decision", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = marketplaceReviewDecisionSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid marketplace review decision", issues: parsed.error.issues });
  try {
    response.json({ data: marketplaceService.decideReview(actor(request), String(request.params.reviewId), parsed.data) });
  } catch (error) {
    response.status(404).json({ error: "Marketplace review decision failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceAdminRouter.post("/reviews/:reviewId/approve", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  try {
    response.json({ data: marketplaceService.decideReview(actor(request), String(request.params.reviewId), { status: "approved", reason: "Approved through marketplace admin review.", evidence: { route: "approve" } }) });
  } catch (error) {
    response.status(404).json({ error: "Marketplace review approval failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceAdminRouter.post("/reviews/:reviewId/reject", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = marketplaceReviewDecisionSchema.partial().safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid marketplace rejection", issues: parsed.error.issues });
  try {
    response.json({ data: marketplaceService.decideReview(actor(request), String(request.params.reviewId), { status: "rejected", reason: parsed.data.reason || "Rejected through marketplace admin review.", evidence: parsed.data.evidence || {} }) });
  } catch (error) {
    response.status(404).json({ error: "Marketplace review rejection failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceAdminRouter.post("/apps/:appId/suspend", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = marketplaceReviewDecisionSchema.pick({ reason: true }).safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid marketplace suspension", issues: parsed.error.issues });
  try {
    response.json({ data: marketplaceService.suspendApp(actor(request), String(request.params.appId), parsed.data.reason) });
  } catch (error) {
    response.status(404).json({ error: "Marketplace suspension failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceWorkspaceRouter.get("/apps", authMiddleware, (request, response) => {
  response.json({ data: marketplaceService.workspaceApps(actor(request)) });
});

marketplaceWorkspaceRouter.post("/apps/:appId/install", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const parsed = marketplaceInstallSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid marketplace install", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: marketplaceService.install(actor(request), String(request.params.appId), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Marketplace install failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceWorkspaceRouter.post("/apps/:appId/uninstall", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  try {
    response.json({ data: marketplaceService.uninstall(actor(request), String(request.params.appId)) });
  } catch (error) {
    response.status(404).json({ error: "Marketplace uninstall failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceWorkspaceRouter.post("/apps/:appId/update", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  try {
    response.json({ data: marketplaceService.updateInstall(actor(request), String(request.params.appId)) });
  } catch (error) {
    response.status(400).json({ error: "Marketplace update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

marketplaceWorkspaceRouter.post("/apps/:appId/rollback", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  try {
    response.json({ data: marketplaceService.rollbackInstall(actor(request), String(request.params.appId)) });
  } catch (error) {
    response.status(400).json({ error: "Marketplace rollback failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

function actor(request: Request) {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}

function actorOptional(request: Request) {
  return {
    organizationId: request.session?.organizationId || "public",
    userId: request.session?.userId || "anonymous",
    role: request.session?.role || "public"
  };
}

function query(request: Request, key: string) {
  const value = request.query[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
