import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  architectureDecisionPatchSchema,
  architectureDecisionSchema,
  architectureReviewPatchSchema,
  architectureReviewSchema,
  databaseMetricSchema,
  engineeringOperationsService,
  engineeringProjectPatchSchema,
  engineeringProjectSchema,
  engineeringReportSchema,
  environmentHealthSchema,
  environmentPatchSchema,
  environmentSchema,
  featureFlagEvaluationSchema,
  featureFlagPatchSchema,
  featureFlagSchema,
  migrationPatchSchema,
  migrationSchema,
  releasePipelinePatchSchema,
  releasePipelineSchema,
  technicalDebtPatchSchema,
  technicalDebtSchema,
  type EngineeringActor
} from "./engineering-operations.service";

export const engineeringOperationsRouter = Router();

engineeringOperationsRouter.use(authMiddleware);

engineeringOperationsRouter.get("/", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.dashboard(actor(request))));
engineeringOperationsRouter.get("/dashboard", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.dashboard(actor(request))));

engineeringOperationsRouter.get("/projects", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.projects(actor(request))));
engineeringOperationsRouter.post("/projects", requirePermission("settings:manage"), route(engineeringProjectSchema, (request, body) => engineeringOperationsService.upsertProject(actor(request), body), 201));
engineeringOperationsRouter.patch("/projects/:engineeringProjectId", requirePermission("settings:manage"), route(engineeringProjectPatchSchema, (request, body) => engineeringOperationsService.updateProject(actor(request), String(request.params.engineeringProjectId), body)));

engineeringOperationsRouter.get("/architecture", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.architectureSummary(actor(request))));
engineeringOperationsRouter.get("/architecture/reviews", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.architectureSummary(actor(request)).reviews));
engineeringOperationsRouter.post("/architecture/reviews", requirePermission("settings:manage"), route(architectureReviewSchema, (request, body) => engineeringOperationsService.createArchitectureReview(actor(request), body), 201));
engineeringOperationsRouter.patch("/architecture/reviews/:reviewId", requirePermission("settings:manage"), route(architectureReviewPatchSchema, (request, body) => engineeringOperationsService.updateArchitectureReview(actor(request), String(request.params.reviewId), body)));
engineeringOperationsRouter.get("/architecture/adr", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.architectureSummary(actor(request)).decisions));
engineeringOperationsRouter.post("/architecture/adr", requirePermission("settings:manage"), route(architectureDecisionSchema, (request, body) => engineeringOperationsService.createArchitectureDecision(actor(request), body), 201));
engineeringOperationsRouter.patch("/architecture/adr/:adrId", requirePermission("settings:manage"), route(architectureDecisionPatchSchema, (request, body) => engineeringOperationsService.updateArchitectureDecision(actor(request), String(request.params.adrId), body)));

engineeringOperationsRouter.get("/quality", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.codeQuality(actor(request))));
engineeringOperationsRouter.get("/technical-debt", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.technicalDebt(actor(request))));
engineeringOperationsRouter.post("/technical-debt", requirePermission("settings:manage"), route(technicalDebtSchema, (request, body) => engineeringOperationsService.createTechnicalDebt(actor(request), body), 201));
engineeringOperationsRouter.patch("/technical-debt/:debtId", requirePermission("settings:manage"), route(technicalDebtPatchSchema, (request, body) => engineeringOperationsService.updateTechnicalDebt(actor(request), String(request.params.debtId), body)));

engineeringOperationsRouter.get("/release-pipeline", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.releasePipeline(actor(request))));
engineeringOperationsRouter.post("/release-pipeline", requirePermission("settings:manage"), route(releasePipelineSchema, (request, body) => engineeringOperationsService.createReleasePipeline(actor(request), body), 201));
engineeringOperationsRouter.patch("/release-pipeline/:pipelineId", requirePermission("settings:manage"), route(releasePipelinePatchSchema, (request, body) => engineeringOperationsService.updateReleasePipeline(actor(request), String(request.params.pipelineId), body)));

engineeringOperationsRouter.get("/environments", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.environments(actor(request))));
engineeringOperationsRouter.post("/environments", requirePermission("settings:manage"), route(environmentSchema, (request, body) => engineeringOperationsService.upsertEnvironment(actor(request), body), 201));
engineeringOperationsRouter.patch("/environments/:environmentId", requirePermission("settings:manage"), route(environmentPatchSchema, (request, body) => engineeringOperationsService.updateEnvironment(actor(request), String(request.params.environmentId), body)));
engineeringOperationsRouter.post("/environments/health", requirePermission("settings:manage"), route(environmentHealthSchema, (request, body) => engineeringOperationsService.recordEnvironmentHealth(actor(request), body), 201));

engineeringOperationsRouter.get("/database", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.databaseGovernance(actor(request))));
engineeringOperationsRouter.post("/database/migrations", requirePermission("settings:manage"), route(migrationSchema, (request, body) => engineeringOperationsService.createMigration(actor(request), body), 201));
engineeringOperationsRouter.patch("/database/migrations/:migrationId", requirePermission("settings:manage"), route(migrationPatchSchema, (request, body) => engineeringOperationsService.updateMigration(actor(request), String(request.params.migrationId), body)));
engineeringOperationsRouter.post("/database/metrics", requirePermission("settings:manage"), route(databaseMetricSchema, (request, body) => engineeringOperationsService.recordDatabaseMetric(actor(request), body), 201));

engineeringOperationsRouter.get("/analytics", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.analytics(actor(request))));
engineeringOperationsRouter.get("/governance", requirePermission("audit:read"), (request, response) => ok(response, engineeringOperationsService.platformGovernance(actor(request))));
engineeringOperationsRouter.get("/admin-tools", requirePermission("settings:manage"), (request, response) => ok(response, engineeringOperationsService.adminTools(actor(request))));
engineeringOperationsRouter.post("/feature-flags", requirePermission("settings:manage"), route(featureFlagSchema, (request, body) => engineeringOperationsService.createFeatureFlag(actor(request), body), 201));
engineeringOperationsRouter.patch("/feature-flags/:flagId", requirePermission("settings:manage"), route(featureFlagPatchSchema, (request, body) => engineeringOperationsService.updateFeatureFlag(actor(request), String(request.params.flagId), body)));
engineeringOperationsRouter.post("/feature-flags/evaluate", requirePermission("audit:read"), route(featureFlagEvaluationSchema, (request, body) => engineeringOperationsService.evaluateFeatureFlag(actor(request), body)));

engineeringOperationsRouter.get("/reports", requirePermission("reports:export"), (request, response) => ok(response, engineeringOperationsService.reports(actor(request))));
engineeringOperationsRouter.post("/reports", requirePermission("reports:export"), route(engineeringReportSchema, (request, body) => engineeringOperationsService.createReport(actor(request), body), 201));

function route<T extends z.ZodTypeAny>(schema: T, handler: (request: Request, body: z.infer<T>) => unknown, status = 200) {
  return (request: Request, response: Response) => {
    const parsed = schema.safeParse(request.body || {});
    if (!parsed.success) return response.status(400).json({ error: "Validation failed", issues: parsed.error.issues, recoverable: true, nextAction: "Correct the request payload and retry." });
    try {
      response.status(status).json({ data: handler(request, parsed.data) });
    } catch (error) {
      response.status(404).json({ error: error instanceof Error ? error.message : "Request failed", recoverable: true, nextAction: "Refresh the resource and retry." });
    }
  };
}

function ok(response: Response, data: unknown) {
  response.json({ data });
}

function actor(request: Request): EngineeringActor {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}
