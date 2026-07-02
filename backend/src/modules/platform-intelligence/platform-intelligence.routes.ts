import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { inspectionRunSchema, intelligenceReportSchema, platformIntelligenceService, type PlatformIntelligenceActor } from "./platform-intelligence.service";

export const platformIntelligenceRouter = Router();

platformIntelligenceRouter.use(authMiddleware);

platformIntelligenceRouter.get("/", requirePermission("audit:read"), (request, response) => ok(response, platformIntelligenceService.center(actor(request))));
platformIntelligenceRouter.get("/center", requirePermission("audit:read"), (request, response) => ok(response, platformIntelligenceService.center(actor(request))));
platformIntelligenceRouter.post("/health-scores/generate", requirePermission("settings:manage"), (request, response) => ok(response, platformIntelligenceService.generateHealthScores(actor(request))));
platformIntelligenceRouter.get("/health-scores", requirePermission("audit:read"), (request, response) => ok(response, platformIntelligenceService.generateHealthScores(actor(request))));
platformIntelligenceRouter.post("/self-heal", requirePermission("settings:manage"), (request, response) => ok(response, platformIntelligenceService.selfHeal(actor(request))));
platformIntelligenceRouter.get("/predictions", requirePermission("audit:read"), (request, response) => ok(response, platformIntelligenceService.predictions(actor(request))));
platformIntelligenceRouter.get("/recommendations", requirePermission("audit:read"), (request, response) => ok(response, platformIntelligenceService.recommendations(actor(request))));
platformIntelligenceRouter.get("/ai-cost-optimizer", requirePermission("audit:read"), (request, response) => ok(response, platformIntelligenceService.aiCostOptimizer(actor(request))));
platformIntelligenceRouter.get("/workspace-quality", requirePermission("audit:read"), (request, response) => ok(response, platformIntelligenceService.workspaceQuality(actor(request))));
platformIntelligenceRouter.get("/project-quality", requirePermission("audit:read"), (request, response) => ok(response, platformIntelligenceService.projectQuality(actor(request))));
platformIntelligenceRouter.post("/inspections/run", requirePermission("settings:manage"), route(inspectionRunSchema, (request, body) => platformIntelligenceService.runInspection(actor(request), body), 201));
platformIntelligenceRouter.get("/reports", requirePermission("reports:export"), (request, response) => ok(response, platformIntelligenceService.reports(actor(request))));
platformIntelligenceRouter.post("/reports", requirePermission("reports:export"), route(intelligenceReportSchema, (request, body) => platformIntelligenceService.createReport(actor(request), body), 201));

function route<T extends z.ZodTypeAny>(schema: T, handler: (request: Request, body: z.infer<T>) => unknown, status = 200) {
  return (request: Request, response: Response) => {
    const parsed = schema.safeParse(request.body || {});
    if (!parsed.success) return response.status(400).json({ error: "Validation failed", issues: parsed.error.issues, recoverable: true, nextAction: "Correct the request payload and retry." });
    try {
      response.status(status).json({ data: handler(request, parsed.data) });
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : "Request failed", recoverable: true, nextAction: "Review the intelligence evidence and retry." });
    }
  };
}

function ok(response: Response, data: unknown) {
  response.json({ data });
}

function actor(request: Request): PlatformIntelligenceActor {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}
