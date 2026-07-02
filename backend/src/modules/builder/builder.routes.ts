import { Router } from "express";
import type { Request } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import { requireUsageLimit } from "../billing/usage-limit.middleware";
import {
  builderBlueprintDecisionSchema,
  builderChangeRequestSchema,
  builderProjectPatchSchema,
  builderProjectSchema,
  builderRequirementSchema,
  builderService,
  type BuilderActor
} from "./builder.service";

export const builderRouter = Router();

builderRouter.use(authMiddleware, rateLimitMiddleware(120, 60));

builderRouter.get("/projects", authMiddleware, async (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  response.json({ data: await builderService.list(actor) });
});

builderRouter.post("/projects", authMiddleware, requireUsageLimit({ metric: "agent_run" }), async (request, response) => {
  const actor = actorFromSession(request);
  const parsed = builderProjectSchema.safeParse(request.body || {});
  if (!actor || !parsed.success) {
    response.status(400).json({ error: "Invalid builder project", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  try {
    response.status(201).json({ data: await builderService.create(actor, parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Builder project creation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

builderRouter.get("/projects/:projectId", authMiddleware, async (request, response) => {
  const actor = actorFromSession(request);
  const project = actor ? await builderService.detail(actor, String(request.params.projectId)) : undefined;
  if (!project) {
    response.status(404).json({ error: "Builder project not found" });
    return;
  }
  response.json({ data: project });
});

builderRouter.patch("/projects/:projectId", authMiddleware, async (request, response) => {
  const actor = actorFromSession(request);
  const parsed = builderProjectPatchSchema.safeParse(request.body || {});
  if (!actor || !parsed.success) {
    response.status(400).json({ error: "Invalid builder project update", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  const project = await builderService.update(actor, String(request.params.projectId), parsed.data);
  if (!project) response.status(404).json({ error: "Builder project not found" });
  else response.json({ data: project });
});

builderRouter.post("/projects/:projectId/requirements", authMiddleware, requireUsageLimit({ metric: "regeneration" }), async (request, response) => {
  const actor = actorFromSession(request);
  const parsed = builderRequirementSchema.safeParse(request.body || {});
  if (!actor || !parsed.success) {
    response.status(400).json({ error: "Invalid builder requirements", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  try {
    const project = await builderService.submitRequirements(actor, String(request.params.projectId), parsed.data);
    if (!project) response.status(404).json({ error: "Builder project not found" });
    else response.json({ data: project });
  } catch (error) {
    response.status(400).json({ error: "Requirement submission failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

builderRouter.get("/projects/:projectId/blueprint", authMiddleware, async (request, response) => {
  const actor = actorFromSession(request);
  const blueprint = actor ? await builderService.blueprint(actor, String(request.params.projectId)) : undefined;
  if (!blueprint) response.status(404).json({ error: "Builder blueprint not found" });
  else response.json({ data: blueprint });
});

builderRouter.post("/projects/:projectId/blueprint/approve", authMiddleware, requireUsageLimit({ metric: "build_minute" }), async (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  try {
    const project = await builderService.approveBlueprint(actor, String(request.params.projectId));
    if (!project) response.status(404).json({ error: "Builder project not found" });
    else response.json({ data: project });
  } catch (error) {
    response.status(400).json({ error: "Blueprint approval failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

builderRouter.post("/projects/:projectId/blueprint/reject", authMiddleware, async (request, response) => {
  const actor = actorFromSession(request);
  const parsed = builderBlueprintDecisionSchema.safeParse(request.body || {});
  if (!actor || !parsed.success) {
    response.status(400).json({ error: "Invalid blueprint rejection", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  const project = await builderService.rejectBlueprint(actor, String(request.params.projectId), parsed.data.reason);
  if (!project) response.status(404).json({ error: "Builder project not found" });
  else response.json({ data: project });
});

builderRouter.get("/projects/:projectId/progress", authMiddleware, async (request, response) => {
  const actor = actorFromSession(request);
  const progress = actor ? await builderService.progress(actor, String(request.params.projectId)) : undefined;
  if (!progress) response.status(404).json({ error: "Builder project not found" });
  else response.json({ data: progress });
});

builderRouter.get("/projects/:projectId/outputs", authMiddleware, async (request, response) => {
  const actor = actorFromSession(request);
  if (!actor) return response.status(400).json({ error: "Organization context is required" });
  response.json({ data: await builderService.outputs(actor, String(request.params.projectId)) });
});

builderRouter.post("/projects/:projectId/change-requests", authMiddleware, requireUsageLimit({ metric: "regeneration" }), async (request, response) => {
  const actor = actorFromSession(request);
  const parsed = builderChangeRequestSchema.safeParse(request.body || {});
  if (!actor || !parsed.success) {
    response.status(400).json({ error: "Invalid change request", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  try {
    const changeRequest = await builderService.changeRequest(actor, String(request.params.projectId), parsed.data);
    if (!changeRequest) response.status(404).json({ error: "Builder project not found" });
    else response.status(201).json({ data: changeRequest });
  } catch (error) {
    response.status(400).json({ error: "Change request failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

function actorFromSession(request: Request): BuilderActor | undefined {
  const session = request.session;
  if (!session?.organizationId || !session.userId) return undefined;
  return { userId: session.userId, organizationId: session.organizationId, role: session.role };
}
