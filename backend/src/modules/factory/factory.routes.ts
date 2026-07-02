import { Router } from "express";
import type { Request } from "express";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import {
  factoryIntakeSchema,
  factoryProjectPatchSchema,
  factoryProjectSchema,
  factoryQuestionAnswerSchema,
  factoryRejectSchema,
  factoryService,
  type FactoryActor
} from "./factory.service";

export const factoryRouter = Router();
export const adminFactoryRouter = Router();

factoryRouter.use(authMiddleware, rateLimitMiddleware(120, 60));

factoryRouter.get("/projects", authMiddleware, (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  response.json({ data: factoryService.list(actor) });
});

factoryRouter.post("/projects", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  const parsed = factoryProjectSchema.safeParse(request.body || {});
  if (!actor || !parsed.success) return response.status(400).json({ error: "Invalid factory project", issues: parsed.success ? [] : parsed.error.issues });
  handle(response, () => factoryService.create(actor, parsed.data), 201);
});

factoryRouter.get("/projects/:projectId", authMiddleware, (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  const project = factoryService.detail(actor, String(request.params.projectId));
  if (!project) return response.status(404).json({ error: "Factory project not found" });
  response.json({ data: project });
});

factoryRouter.patch("/projects/:projectId", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  const parsed = factoryProjectPatchSchema.safeParse(request.body || {});
  if (!actor || !parsed.success) return response.status(400).json({ error: "Invalid factory project update", issues: parsed.success ? [] : parsed.error.issues });
  handle(response, () => factoryService.update(actor, String(request.params.projectId), parsed.data));
});

factoryRouter.post("/projects/:projectId/intake", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  const parsed = factoryIntakeSchema.safeParse(request.body || {});
  if (!actor || !parsed.success) return response.status(400).json({ error: "Invalid factory intake", issues: parsed.success ? [] : parsed.error.issues });
  handle(response, () => factoryService.submitIntake(actor, String(request.params.projectId), parsed.data));
});

factoryRouter.get("/projects/:projectId/intake", authMiddleware, (request, response) => routeProject(request, response, (_actor, projectId) => ({
  answers: factoryService.detail(_actor, projectId)?.intake,
  nextAction: factoryService.detail(_actor, projectId)?.nextAction
})));

factoryRouter.post("/projects/:projectId/requirements/analyze", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => {
    const detail = factoryService.detail(actor, String(request.params.projectId));
    if (!detail) throw new Error("Factory project not found.");
    return {
      requirementQualityScore: detail.requirementQualityScore,
      complexityScore: detail.complexityScore,
      buildSize: detail.buildSize,
      recommendedPlan: detail.recommendedPlan,
      nextAction: detail.nextAction,
      creditEstimate: { blueprint: 15, design: 10, buildStart: 25 }
    };
  });
});

factoryRouter.post("/projects/:projectId/questions/generate", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.generateQuestions(actor, String(request.params.projectId)));
});

factoryRouter.post("/projects/:projectId/questions/answer", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  const parsed = factoryQuestionAnswerSchema.safeParse(request.body || {});
  if (!actor || !parsed.success) return response.status(400).json({ error: "Invalid factory question answer", issues: parsed.success ? [] : parsed.error.issues });
  handle(response, () => factoryService.answerQuestion(actor, String(request.params.projectId), parsed.data));
});

factoryRouter.get("/projects/:projectId/questions", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => factoryService.detail(actor, projectId)?.questions || []));

factoryRouter.post("/projects/:projectId/blueprint/generate", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.generateBlueprint(actor, String(request.params.projectId)), 201);
});

factoryRouter.post("/projects/:projectId/blueprints/generate", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.generateBlueprint(actor, String(request.params.projectId)), 201);
});

factoryRouter.get("/projects/:projectId/blueprints", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => {
  factoryService.detail(actor, projectId);
  return factoryService.detail(actor, projectId)?.blueprint ? [factoryService.detail(actor, projectId)?.blueprint] : [];
}));

factoryRouter.get("/projects/:projectId/blueprints/:blueprintId", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => {
  const blueprint = factoryService.detail(actor, projectId)?.blueprint;
  if (!blueprint || blueprint.blueprintId !== String(request.params.blueprintId)) throw new Error("Blueprint not found.");
  return blueprint;
}));

factoryRouter.post("/projects/:projectId/blueprint/approve", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.approveBlueprint(actor, String(request.params.projectId)));
});

factoryRouter.post("/projects/:projectId/blueprints/:blueprintId/approve", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.approveBlueprint(actor, String(request.params.projectId)));
});

factoryRouter.post("/projects/:projectId/blueprint/reject", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  const parsed = factoryRejectSchema.safeParse(request.body || {});
  if (!actor || !parsed.success) return response.status(400).json({ error: "Invalid factory rejection", issues: parsed.success ? [] : parsed.error.issues });
  handle(response, () => factoryService.rejectBlueprint(actor, String(request.params.projectId), parsed.data));
});

factoryRouter.post("/projects/:projectId/blueprints/:blueprintId/reject", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  const parsed = factoryRejectSchema.safeParse(request.body || {});
  if (!actor || !parsed.success) return response.status(400).json({ error: "Invalid factory rejection", issues: parsed.success ? [] : parsed.error.issues });
  handle(response, () => factoryService.rejectBlueprint(actor, String(request.params.projectId), parsed.data));
});

factoryRouter.post("/projects/:projectId/design/generate", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.generateDesign(actor, String(request.params.projectId)), 201);
});

factoryRouter.post("/projects/:projectId/design/approve", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.approveDesign(actor, String(request.params.projectId)));
});

factoryRouter.post("/projects/:projectId/build/start", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.startBuild(actor, String(request.params.projectId)));
});

factoryRouter.post("/projects/:projectId/task-graph/generate", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.startBuild(actor, String(request.params.projectId)));
});

factoryRouter.get("/projects/:projectId/task-graph", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => factoryService.detail(actor, projectId)?.taskGraph || null));

factoryRouter.post("/projects/:projectId/code/start", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.startBuild(actor, String(request.params.projectId)));
});

factoryRouter.post("/projects/:projectId/build/pause", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.pauseBuild(actor, String(request.params.projectId)));
});

factoryRouter.post("/projects/:projectId/build/resume", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.resumeBuild(actor, String(request.params.projectId)));
});

factoryRouter.get("/projects/:projectId/tasks", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => factoryService.tasks(actor, projectId)));
factoryRouter.get("/projects/:projectId/files", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => factoryService.files(actor, projectId)));
factoryRouter.get("/projects/:projectId/diffs", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => factoryService.files(actor, projectId).filter((file: any) => file.diffRequired).map((file: any) => ({ diffId: `${file.fileId}:diff`, fileId: file.fileId, path: file.path, status: file.status }))));
factoryRouter.post("/projects/:projectId/qa/run", authMiddleware, requirePermission("workspace:create"), (request, response) => routeProject(request, response, (actor, projectId) => factoryService.qa(actor, projectId)));
factoryRouter.get("/projects/:projectId/qa", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => factoryService.qa(actor, projectId)));
factoryRouter.post("/projects/:projectId/security/review", authMiddleware, requirePermission("workspace:create"), (request, response) => routeProject(request, response, (actor, projectId) => ({ status: "completed", projectId, checks: ["auth", "rbac", "tenant isolation", "prompt injection", "secret exposure"], evidence: factoryService.qa(actor, projectId).validations.filter((run: any) => run.validationType === "security") })));
factoryRouter.get("/projects/:projectId/security/reviews", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => [{ status: "completed", projectId, evidence: factoryService.qa(actor, projectId).validations.filter((run: any) => run.validationType === "security") }]));
factoryRouter.get("/projects/:projectId/deployment", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => factoryService.detail(actor, projectId)?.release || { status: "not_prepared", nextAction: "Prepare release after QA passes." }));
factoryRouter.get("/projects/:projectId/release", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => factoryService.detail(actor, projectId)?.release || null));
factoryRouter.get("/projects/:projectId/docs", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => factoryService.docs(actor, projectId)));
factoryRouter.get("/projects/:projectId/memory", authMiddleware, (request, response) => routeProject(request, response, (actor, projectId) => factoryService.memory(actor, projectId)));

factoryRouter.post("/projects/:projectId/release/prepare", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.prepareRelease(actor, String(request.params.projectId)), 201);
});

factoryRouter.post("/projects/:projectId/release/approve", authMiddleware, requirePermission("workspace:create"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  handle(response, () => factoryService.approveRelease(actor, String(request.params.projectId)));
});

adminFactoryRouter.use(authMiddleware, requirePermission("audit:read"));
adminFactoryRouter.get("/", authMiddleware, requirePermission("audit:read"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  response.json({ data: factoryService.adminSummary(actor) });
});
adminFactoryRouter.get("/projects", authMiddleware, requirePermission("audit:read"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  response.json({ data: factoryService.list(actor) });
});
adminFactoryRouter.get("/runs", authMiddleware, requirePermission("audit:read"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  response.json({ data: factoryService.adminSummary(actor) });
});
adminFactoryRouter.get("/quality", authMiddleware, requirePermission("audit:read"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  response.json({ data: factoryService.quality(actor) });
});
adminFactoryRouter.get("/reviews", authMiddleware, requirePermission("audit:read"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  response.json({ data: factoryService.reviews(actor) });
});
adminFactoryRouter.get("/memory", authMiddleware, requirePermission("audit:read"), (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  response.json({ data: factoryService.adminSummary(actor).memory });
});
adminFactoryRouter.get("/settings", authMiddleware, requirePermission("audit:read"), (_request, response) => {
  response.json({ data: { approvalGates: ["blueprint", "design", "build", "release"], overwritePolicy: "diff_approval_required", secretStorage: "blocked", nextAction: "Tune factory governance in admin settings." } });
});

function actorFromSession(request: Request): FactoryActor | undefined {
  const session = request.session;
  if (!session?.organizationId || !session.userId) return undefined;
  return { userId: session.userId, organizationId: session.organizationId, role: session.role };
}

function handle(response: { status: (code: number) => { json: (body: unknown) => void }; json: (body: unknown) => void }, fn: () => unknown, status = 200) {
  try {
    const data = fn();
    response.status(status).json({ data });
  } catch (error) {
    response.status(400).json({ error: "Factory action failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
}

function routeProject(request: Request, response: { status: (code: number) => { json: (body: unknown) => void }; json: (body: unknown) => void }, fn: (actor: FactoryActor, projectId: string) => unknown) {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  try {
    response.json({ data: fn(actor, String(request.params.projectId)) });
  } catch (error) {
    response.status(404).json({ error: "Factory project not found", message: error instanceof Error ? error.message : "Unknown error" });
  }
}
