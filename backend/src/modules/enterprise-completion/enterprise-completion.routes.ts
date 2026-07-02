import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { billingService } from "../billing/billing.service";
import { operationsService } from "../operations/operations.service";
import { factoryService } from "../factory/factory.service";
import { enterpriseCompletionService, type CompletionActor } from "./enterprise-completion.service";

export const enterpriseCompletionRouter = Router();

enterpriseCompletionRouter.use(authMiddleware);

enterpriseCompletionRouter.get("/projects", (request, response) => response.json(enterpriseCompletionService.projects(actor(request), request.query as Record<string, unknown>)));
enterpriseCompletionRouter.post("/projects", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.createProject(actor(request), request.body || {}), 201));
enterpriseCompletionRouter.get("/projects/:projectId", (request, response) => found(response, enterpriseCompletionService.project(actor(request), String(request.params.projectId)), "Project not found"));
enterpriseCompletionRouter.patch("/projects/:projectId", requirePermission("workspace:create"), (request, response) => found(response, enterpriseCompletionService.updateProject(actor(request), String(request.params.projectId), request.body || {}), "Project not found"));
enterpriseCompletionRouter.delete("/projects/:projectId", requirePermission("workspace:create"), (request, response) => found(response, enterpriseCompletionService.archiveProject(actor(request), String(request.params.projectId)), "Project not found"));
enterpriseCompletionRouter.post("/projects/:projectId/archive", requirePermission("workspace:create"), (request, response) => found(response, enterpriseCompletionService.archiveProject(actor(request), String(request.params.projectId)), "Project not found"));
enterpriseCompletionRouter.post("/projects/:projectId/restore", requirePermission("workspace:create"), (request, response) => found(response, enterpriseCompletionService.project(actor(request), String(request.params.projectId)), "Project not found"));
enterpriseCompletionRouter.get("/projects/:projectId/activity", (request, response) => found(response, enterpriseCompletionService.project(actor(request), String(request.params.projectId))?.activity, "Project not found"));
enterpriseCompletionRouter.get("/projects/:projectId/usage", (request, response) => response.json({ data: enterpriseCompletionService.usage(actor(request)) }));

enterpriseCompletionRouter.get("/factory/projects/:projectId/intake", (request, response) => routeFactory(request, response, (project) => project.intake));
enterpriseCompletionRouter.post("/factory/projects/:projectId/requirements/analyze", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.analyzeRequirements(actor(request), request.body || {})));
enterpriseCompletionRouter.get("/factory/projects/:projectId/questions", (request, response) => routeFactory(request, response, (project) => project.questions));

enterpriseCompletionRouter.post("/factory/projects/:projectId/blueprints/generate", requirePermission("workspace:create"), (request, response) => routeFactoryAction(request, response, (a, projectId) => factoryService.generateBlueprint(a, projectId), 201));
enterpriseCompletionRouter.get("/factory/projects/:projectId/blueprints", (request, response) => routeFactory(request, response, (project) => project.blueprint ? [project.blueprint] : []));
enterpriseCompletionRouter.get("/factory/projects/:projectId/blueprints/:blueprintId", (request, response) => routeFactory(request, response, (project) => project.blueprint?.blueprintId === request.params.blueprintId ? project.blueprint : undefined));
enterpriseCompletionRouter.post("/factory/projects/:projectId/blueprints/:blueprintId/approve", requirePermission("workspace:create"), (request, response) => routeFactoryAction(request, response, (a, projectId) => factoryService.approveBlueprint(a, projectId)));
enterpriseCompletionRouter.post("/factory/projects/:projectId/blueprints/:blueprintId/reject", requirePermission("workspace:create"), (request, response) => routeFactoryAction(request, response, (a, projectId) => factoryService.rejectBlueprint(a, projectId, { reason: String(request.body?.reason || "Rejected by reviewer.") })));
enterpriseCompletionRouter.post("/factory/projects/:projectId/blueprints/:blueprintId/regenerate", requirePermission("workspace:create"), (request, response) => routeFactoryAction(request, response, (a, projectId) => factoryService.generateBlueprint(a, projectId), 201));

enterpriseCompletionRouter.post("/factory/projects/:projectId/task-graph/generate", requirePermission("workspace:create"), (request, response) => routeFactoryAction(request, response, (a, projectId) => factoryService.approveBlueprint(a, projectId)));
enterpriseCompletionRouter.get("/factory/projects/:projectId/task-graph", (request, response) => routeFactory(request, response, (project) => project.taskGraph));
enterpriseCompletionRouter.get("/factory/projects/:projectId/tasks", (request, response) => routeFactory(request, response, (project) => project.tasks));
enterpriseCompletionRouter.get("/factory/tasks/:taskId", (request, response) => routeFactoryTask(request, response));
enterpriseCompletionRouter.patch("/factory/tasks/:taskId", requirePermission("workspace:create"), (request, response) => routeFactoryTask(request, response, request.body || {}));
enterpriseCompletionRouter.post("/factory/tasks/:taskId/assign", requirePermission("workspace:create"), (request, response) => routeFactoryTask(request, response, { ownerId: request.body?.ownerId, status: "assigned" }));
enterpriseCompletionRouter.post("/factory/tasks/:taskId/complete", requirePermission("workspace:create"), (request, response) => routeFactoryTask(request, response, { status: "completed" }));
enterpriseCompletionRouter.post("/factory/tasks/:taskId/block", requirePermission("workspace:create"), (request, response) => routeFactoryTask(request, response, { status: "blocked", nextAction: request.body?.nextAction || "Resolve blocking issue." }));

enterpriseCompletionRouter.post("/factory/projects/:projectId/code/start", requirePermission("workspace:create"), (request, response) => routeFactoryAction(request, response, (a, projectId) => factoryService.startBuild(a, projectId)));
enterpriseCompletionRouter.get("/factory/projects/:projectId/files", (request, response) => routeFactory(request, response, (project) => project.files));
enterpriseCompletionRouter.get("/factory/projects/:projectId/files/:fileId", (request, response) => routeFactory(request, response, (project) => project.files.find((file: { fileId?: string; id?: string }) => file.fileId === request.params.fileId || file.id === request.params.fileId)));
enterpriseCompletionRouter.post("/factory/projects/:projectId/files/:fileId/approve", requirePermission("workspace:create"), (request, response) => routeFactory(request, response, () => ({ fileId: request.params.fileId, status: "approved", nextAction: "File approved for generation output." })));
enterpriseCompletionRouter.post("/factory/projects/:projectId/files/:fileId/reject", requirePermission("workspace:create"), (request, response) => routeFactory(request, response, () => ({ fileId: request.params.fileId, status: "rejected", reason: request.body?.reason || "Rejected by reviewer.", nextAction: "Regenerate a new file version." })));
enterpriseCompletionRouter.get("/factory/projects/:projectId/diffs", (request, response) => routeFactory(request, response, (project) => project.files.map((file: { fileId?: string; path?: string }) => ({ diffId: `diff_${file.fileId || file.path}`, file, status: "review_required" }))));
enterpriseCompletionRouter.get("/factory/projects/:projectId/diffs/:diffId", (request, response) => routeFactory(request, response, () => ({ diffId: request.params.diffId, status: "review_required" })));

enterpriseCompletionRouter.post("/factory/projects/:projectId/qa/run", requirePermission("workspace:create"), (request, response) => routeFactoryAction(request, response, (a, projectId) => factoryService.startBuild(a, projectId)));
enterpriseCompletionRouter.get("/factory/projects/:projectId/qa/:validationId", (request, response) => routeFactory(request, response, (project) => project.qa.find((run: { validationId?: string; id?: string }) => run.validationId === request.params.validationId || run.id === request.params.validationId)));
enterpriseCompletionRouter.post("/factory/projects/:projectId/qa/:validationId/retry", requirePermission("workspace:create"), (request, response) => routeFactory(request, response, () => ({ validationId: request.params.validationId, status: "queued", nextAction: "Validation retry queued." })));
enterpriseCompletionRouter.post("/factory/projects/:projectId/security/review", requirePermission("workspace:create"), (request, response) => routeFactory(request, response, () => ({ reviewId: `security_${Date.now()}`, status: "pending", checks: ["auth", "permissions", "tenant isolation", "input validation", "prompt injection", "secret exposure"] })));
enterpriseCompletionRouter.get("/factory/projects/:projectId/security/reviews", (request, response) => routeFactory(request, response, () => []));
enterpriseCompletionRouter.get("/factory/projects/:projectId/security/reviews/:reviewId", (request, response) => routeFactory(request, response, () => ({ reviewId: request.params.reviewId, status: "pending" })));

enterpriseCompletionRouter.get("/billing/plans", (_request, response) => response.json({ data: enterpriseCompletionService.plans() }));
enterpriseCompletionRouter.post("/billing/checkout", requirePermission("billing:manage"), (request, response) => handle(response, () => billingService.createCheckout({ organizationId: actor(request).organizationId, planId: String(request.body?.planId || "starter"), billingCycle: request.body?.billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY" })));
enterpriseCompletionRouter.post("/billing/subscribe", requirePermission("billing:manage"), (request, response) => handle(response, () => billingService.subscribe({ organizationId: actor(request).organizationId, customerId: customerId(request), actorId: actor(request).userId, planId: String(request.body?.planId || "starter"), billingCycle: request.body?.billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY" })));
enterpriseCompletionRouter.post("/billing/cancel", requirePermission("billing:manage"), (request, response) => handle(response, () => billingService.cancel({ organizationId: actor(request).organizationId, customerId: customerId(request), actorId: actor(request).userId })));
enterpriseCompletionRouter.get("/billing/subscription", (request, response) => response.json({ data: billingService.usage(actor(request).organizationId, customerId(request)).limits.at(0) }));
enterpriseCompletionRouter.get("/billing/invoices", (request, response) => response.json({ data: billingService.invoices(actor(request).organizationId, customerId(request)) }));
enterpriseCompletionRouter.get("/billing/usage", (request, response) => response.json({ data: billingService.usage(actor(request).organizationId, customerId(request)) }));
enterpriseCompletionRouter.get("/billing/credits", (request, response) => response.json({ data: billingService.credits(actor(request).organizationId, customerId(request)) }));
enterpriseCompletionRouter.post("/billing/credits/topup", requirePermission("billing:manage"), (request, response) => handle(response, () => billingService.topup({ organizationId: actor(request).organizationId, customerId: customerId(request), actorId: actor(request).userId, credits: Number(request.body?.credits || 1), paymentReference: request.body?.paymentReference })));

enterpriseCompletionRouter.get("/analytics/overview", (request, response) => response.json({ data: operationsService.analytics(actor(request)) }));
enterpriseCompletionRouter.get("/analytics/usage", (request, response) => response.json({ data: enterpriseCompletionService.usage(actor(request)) }));
enterpriseCompletionRouter.get("/analytics/billing", (request, response) => response.json({ data: billingService.usage(actor(request).organizationId, customerId(request)) }));
enterpriseCompletionRouter.get("/analytics/projects", (request, response) => response.json(enterpriseCompletionService.projects(actor(request), request.query as Record<string, unknown>)));
enterpriseCompletionRouter.get("/operations/health", (request, response) => response.json({ data: operationsService.health(actor(request)) }));
enterpriseCompletionRouter.get("/operations/queues", (request, response) => response.json({ data: enterpriseCompletionService.queues(actor(request)) }));
enterpriseCompletionRouter.get("/operations/workers", (request, response) => response.json({ data: enterpriseCompletionService.queues(actor(request)) }));
enterpriseCompletionRouter.get("/operations/incidents", (request, response) => response.json({ data: operationsService.incidents(actor(request)) }));

enterpriseCompletionRouter.post("/ml/requirements/score", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.analyzeRequirements(actor(request), request.body || {})));
enterpriseCompletionRouter.post("/ml/projects/complexity", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.scoreComplexity(actor(request), request.body || {})));
enterpriseCompletionRouter.post("/ml/projects/estimate", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.estimateProject(actor(request), request.body || {})));
enterpriseCompletionRouter.post("/ml/templates/recommend", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.recommendTemplate(actor(request), request.body || {})));
enterpriseCompletionRouter.post("/ml/risks/score", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.analyzeRequirements(actor(request), request.body || {})));
enterpriseCompletionRouter.post("/ml/errors/classify", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.classifyError(actor(request), request.body || {})));
enterpriseCompletionRouter.post("/ml/anomalies/detect", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.detectAnomaly(actor(request), request.body || {})));

enterpriseCompletionRouter.post("/memory", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.createMemory(actor(request), request.body || {}), 201));
enterpriseCompletionRouter.get("/memory", (request, response) => response.json({ data: enterpriseCompletionService.memory(actor(request)) }));
enterpriseCompletionRouter.get("/memory/:memoryId", (request, response) => found(response, enterpriseCompletionService.memory(actor(request)).find((entry) => entry.memoryId === request.params.memoryId), "Memory not found"));
enterpriseCompletionRouter.patch("/memory/:memoryId", requirePermission("workspace:create"), (request, response) => found(response, enterpriseCompletionService.updateMemory(actor(request), String(request.params.memoryId), request.body || {}), "Memory not found"));
enterpriseCompletionRouter.post("/memory/:memoryId/approve", requirePermission("workspace:create"), (request, response) => found(response, enterpriseCompletionService.reviewMemory(actor(request), String(request.params.memoryId), "approved"), "Memory not found"));
enterpriseCompletionRouter.post("/memory/:memoryId/reject", requirePermission("workspace:create"), (request, response) => found(response, enterpriseCompletionService.reviewMemory(actor(request), String(request.params.memoryId), "rejected"), "Memory not found"));
enterpriseCompletionRouter.post("/knowledge/search", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.knowledgeSearch(actor(request), request.body || {})));
enterpriseCompletionRouter.post("/knowledge/retrieve", requirePermission("workspace:create"), (request, response) => handle(response, () => enterpriseCompletionService.knowledgeSearch(actor(request), request.body || {})));

enterpriseCompletionRouter.post("/proof-records", requirePermission("audit:read"), (request, response) => handle(response, () => enterpriseCompletionService.createProof(actor(request), request.body || {}), 201));
enterpriseCompletionRouter.get("/proof-records", (request, response) => response.json({ data: enterpriseCompletionService.proofRecords(actor(request)) }));
enterpriseCompletionRouter.get("/proof-records/:proofId", (request, response) => found(response, enterpriseCompletionService.proofRecords(actor(request)).find((proof) => proof.proofId === request.params.proofId), "Proof record not found"));
enterpriseCompletionRouter.post("/proof-records/:proofId/verify", requirePermission("audit:read"), (request, response) => found(response, enterpriseCompletionService.verifyProof(actor(request), String(request.params.proofId)), "Proof record not found"));

function actor(request: Request): CompletionActor {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}

function customerId(request: Request) {
  return String(request.query.customerId || request.body?.customerId || request.session!.userId);
}

function factoryActor(request: Request) {
  return actor(request);
}

function routeFactory(request: Request, response: Response, select: (project: Record<string, any>) => unknown) {
  const project = factoryService.detail(factoryActor(request), String(request.params.projectId)) as Record<string, any> | undefined;
  if (!project) return response.status(404).json({ error: "Factory project not found" });
  const data = select(project);
  if (data === undefined) return response.status(404).json({ error: "Factory resource not found" });
  response.json({ data });
}

function routeFactoryAction(request: Request, response: Response, action: (actor: CompletionActor, projectId: string) => unknown, status = 200) {
  handle(response, () => action(factoryActor(request), String(request.params.projectId)), status);
}

function routeFactoryTask(request: Request, response: Response, patch?: Record<string, unknown>) {
  const allProjects = factoryService.list(factoryActor(request)).projects as Array<{ projectId: string }>;
  for (const projectRef of allProjects) {
    const project = factoryService.detail(factoryActor(request), projectRef.projectId) as Record<string, any> | undefined;
    const task = project?.tasks?.find((item: { taskId?: string; id?: string }) => item.taskId === request.params.taskId || item.id === request.params.taskId);
    if (task) {
      Object.assign(task, patch || {});
      response.json({ data: task });
      return;
    }
  }
  response.status(404).json({ error: "Factory task not found" });
}

function handle(response: Response, fn: () => unknown, status = 200) {
  try {
    response.status(status).json({ data: fn() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: "Validation failed", issues: error.issues, recoverable: true, nextAction: "Correct the request payload and retry." });
      return;
    }
    response.status(400).json({ error: error instanceof Error ? error.message : "Request failed", recoverable: true, nextAction: "Review the request and retry." });
  }
}

function found(response: Response, data: unknown, message: string) {
  if (!data) return response.status(404).json({ error: message, recoverable: true, nextAction: "Refresh the resource list and retry." });
  response.json({ data });
}
