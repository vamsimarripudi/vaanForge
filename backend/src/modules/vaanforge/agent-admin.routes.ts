import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { agentActionSchema, agentAdminService } from "./agent-admin.service";
import { agentDeploymentService, deploymentActionSchema, deploymentCreateSchema } from "./agent-deployment.service";
import { agentMemoryService, knowledgeSearchSchema, memoryInputSchema, memoryPatchSchema, memoryReviewSchema } from "./agent-memory.service";
import { agentTemplateService, templateInputSchema, templateUseSchema } from "./agent-template.service";
import { agentTeamService, assignSchema, commentSchema, conflictSchema, finalReviewSchema, handoffSchema, reviewSchema, roleSchema } from "./agent-team.service";
import { agentWorkspaceService, workspaceControlSchema, workspaceInstructionSchema } from "./agent-workspace.service";

export const agentAdminRouter = Router();

agentAdminRouter.use(authMiddleware, requirePermission("audit:read"));

agentAdminRouter.get("/summary", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentAdminService.summary(request.session.organizationId) : emptySummary() });
});

agentAdminRouter.get("/runs", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentAdminService.runs(request.session.organizationId) : [] });
});

agentAdminRouter.get("/memory", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentMemoryService.list(request.session.organizationId, true) : [] });
});

agentAdminRouter.post("/memory", requirePermission("workspace:create"), async (request, response) => {
  const parsed = memoryInputSchema.safeParse(request.body);
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid memory request", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  try {
    response.status(201).json({ data: await agentMemoryService.create(request.session.organizationId, request.session.userId, parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Memory creation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

agentAdminRouter.get("/memory/review", async (request, response) => {
  const entries = request.session?.organizationId ? await agentMemoryService.list(request.session.organizationId, true) : [];
  response.json({ data: entries.filter((entry) => entry.status === "pending_review") });
});

agentAdminRouter.get("/memory/:memoryId", async (request, response) => {
  const memory = request.session?.organizationId ? await agentMemoryService.detail(request.session.organizationId, String(request.params.memoryId)) : undefined;
  if (!memory) {
    response.status(404).json({ error: "Memory entry not found" });
    return;
  }
  response.json({ data: memory });
});

agentAdminRouter.patch("/memory/:memoryId", requirePermission("workspace:create"), async (request, response) => {
  const parsed = memoryPatchSchema.safeParse(request.body || {});
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid memory update", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  try {
    const memory = await agentMemoryService.update(request.session.organizationId, request.session.userId, String(request.params.memoryId), parsed.data);
    if (!memory) response.status(404).json({ error: "Memory entry not found" });
    else response.json({ data: memory });
  } catch (error) {
    response.status(400).json({ error: "Memory update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

for (const action of ["approve", "reject", "archive"] as const) {
  agentAdminRouter.post(`/memory/:memoryId/${action}`, requirePermission("workspace:create"), async (request, response) => {
    const parsed = memoryReviewSchema.safeParse(request.body || {});
    if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
      response.status(400).json({ error: `Invalid memory ${action} request`, issues: parsed.success ? [] : parsed.error.issues });
      return;
    }
    const decision = action === "approve" ? "approved" : action === "reject" ? "rejected" : "archived";
    const memory = await agentMemoryService.review(request.session.organizationId, request.session.userId, String(request.params.memoryId), decision, parsed.data);
    if (!memory) response.status(404).json({ error: "Memory entry not found" });
    else response.json({ data: memory });
  });
}

agentAdminRouter.get("/knowledge-base", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentMemoryService.knowledge(request.session.organizationId) : [] });
});

agentAdminRouter.post("/knowledge-base/search", async (request, response) => {
  const parsed = knowledgeSearchSchema.safeParse(request.body || {});
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid knowledge search", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.json({ data: await agentMemoryService.search(request.session.organizationId, request.session.userId, parsed.data) });
});

agentAdminRouter.post("/knowledge-base/retrieve", async (request, response) => {
  const parsed = knowledgeSearchSchema.safeParse(request.body || {});
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid knowledge retrieval", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.json({ data: await agentMemoryService.retrieve(request.session.organizationId, request.session.userId, parsed.data) });
});

agentAdminRouter.get("/deployments", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentDeploymentService.list(request.session.organizationId) : [] });
});

agentAdminRouter.post("/deployments", requirePermission("workspace:create"), async (request, response) => {
  const parsed = deploymentCreateSchema.safeParse(request.body);
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid deployment request", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  try {
    response.status(201).json({ data: await agentDeploymentService.create(request.session.organizationId, request.session.userId, parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Deployment creation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

agentAdminRouter.get("/deployments/:deploymentId", async (request, response) => {
  const deployment = request.session?.organizationId ? await agentDeploymentService.detail(request.session.organizationId, String(request.params.deploymentId)) : undefined;
  if (!deployment) {
    response.status(404).json({ error: "Deployment not found" });
    return;
  }
  response.json({ data: deployment });
});

agentAdminRouter.get("/deployments/:deploymentId/logs", async (request, response) => {
  response.json({ data: request.session?.organizationId ? agentDeploymentService.logs(request.session.organizationId, String(request.params.deploymentId)) : [] });
});

for (const action of ["prepare", "deploy", "verify", "rollback"] as const) {
  agentAdminRouter.post(`/deployments/:deploymentId/${action}`, requirePermission("workspace:create"), async (request, response) => {
    const parsed = deploymentActionSchema.safeParse(request.body || {});
    const organizationId = request.session?.organizationId;
    const actorId = request.session?.userId;
    if (!parsed.success || !organizationId || !actorId) {
      response.status(400).json({ error: `Invalid deployment ${action} request`, issues: parsed.success ? [] : parsed.error.issues });
      return;
    }
    try {
      const deploymentId = String(request.params.deploymentId);
      const result = {
        prepare: () => agentDeploymentService.prepare(organizationId, actorId, deploymentId, parsed.data.signature),
        deploy: () => agentDeploymentService.deploy(organizationId, actorId, deploymentId, parsed.data),
        verify: () => agentDeploymentService.verify(organizationId, actorId, deploymentId, parsed.data.signature),
        rollback: () => agentDeploymentService.rollback(organizationId, actorId, deploymentId, parsed.data)
      }[action];
      response.json({ data: await result() });
    } catch (error) {
      response.status(400).json({ error: `Deployment ${action} failed`, message: error instanceof Error ? error.message : "Unknown error" });
    }
  });
}

agentAdminRouter.get("/runs/:runId/deployment", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentDeploymentService.runDeploymentForRun(request.session.organizationId, String(request.params.runId)) : [] });
});

agentAdminRouter.get("/workspace", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentWorkspaceService.overview(request.session.organizationId) : [] });
});

agentAdminRouter.get("/team", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentTeamService.team(request.session.organizationId) : { roles: [], activeAssignments: [] } });
});

agentAdminRouter.get("/team/roles", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentTeamService.roles(request.session.organizationId) : [] });
});

agentAdminRouter.post("/team/roles", requirePermission("workspace:create"), async (request, response) => {
  const parsed = roleSchema.safeParse(request.body);
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid agent role", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.status(201).json({ data: await agentTeamService.createRole(request.session.organizationId, request.session.userId, parsed.data) });
});

agentAdminRouter.patch("/team/roles/:roleId", requirePermission("workspace:create"), async (request, response) => {
  if (!request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Organization context is required" });
    return;
  }
  const updated = await agentTeamService.updateRole(request.session.organizationId, request.session.userId, String(request.params.roleId), request.body);
  if (!updated) {
    response.status(404).json({ error: "Agent role not found" });
    return;
  }
  response.json({ data: updated });
});

agentAdminRouter.get("/runs/:runId/team", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentTeamService.runTeam(request.session.organizationId, String(request.params.runId)) : undefined });
});

agentAdminRouter.post("/runs/:runId/team/assign", requirePermission("workspace:create"), async (request, response) => {
  const parsed = assignSchema.safeParse(request.body || {});
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid team assignment request", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.status(201).json({ data: await agentTeamService.assign(request.session.organizationId, request.session.userId, String(request.params.runId), parsed.data) });
});

const teamActionSchemas = { handoff: handoffSchema, comment: commentSchema, conflict: conflictSchema, review: reviewSchema, "final-review": finalReviewSchema } as const;
for (const action of ["handoff", "comment", "conflict", "review", "final-review"] as const) {
  agentAdminRouter.post(`/runs/:runId/team/${action}`, requirePermission("workspace:create"), async (request, response) => {
    const parsed = teamActionSchemas[action].safeParse(request.body || {});
    if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
      response.status(400).json({ error: `Invalid team ${action} request`, issues: parsed.success ? [] : parsed.error.issues });
      return;
    }
    const serviceCall = {
      handoff: () => agentTeamService.handoff(request.session!.organizationId!, request.session!.userId, String(request.params.runId), parsed.data as never),
      comment: () => agentTeamService.comment(request.session!.organizationId!, request.session!.userId, String(request.params.runId), parsed.data as never),
      conflict: () => agentTeamService.conflict(request.session!.organizationId!, request.session!.userId, String(request.params.runId), parsed.data as never),
      review: () => agentTeamService.review(request.session!.organizationId!, request.session!.userId, String(request.params.runId), parsed.data as never),
      "final-review": () => agentTeamService.finalReview(request.session!.organizationId!, request.session!.userId, String(request.params.runId), parsed.data as never)
    }[action];
    response.status(201).json({ data: await serviceCall() });
  });
}

agentAdminRouter.get("/workspace/:runId", async (request, response) => {
  const workspace = request.session?.organizationId ? await agentWorkspaceService.workspace(request.session.organizationId, String(request.params.runId)) : undefined;
  if (!workspace) {
    response.status(404).json({ error: "Agent workspace not found" });
    return;
  }
  response.json({ data: workspace });
});

agentAdminRouter.get("/workspace/:runId/evidence", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentWorkspaceService.evidence(request.session.organizationId, String(request.params.runId)) : [] });
});

agentAdminRouter.get("/workspace/:runId/instructions", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentWorkspaceService.instructions(request.session.organizationId, String(request.params.runId)) : [] });
});

agentAdminRouter.get("/workspace/:runId/live", async (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const runId = String(request.params.runId);
  if (!organizationId || !actorId) {
    response.status(400).json({ error: "Organization context is required" });
    return;
  }
  agentWorkspaceService.openSession(organizationId, actorId, runId);
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Connection", "keep-alive");
  response.flushHeaders?.();
  let sent = new Set<string>();
  const write = async () => {
    const workspace = await agentWorkspaceService.workspace(organizationId, runId);
    for (const event of workspace?.liveEvents || []) {
      if (sent.has(event.eventId)) continue;
      sent.add(event.eventId);
      response.write(`id: ${event.eventId}\n`);
      response.write(`event: ${event.eventType}\n`);
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  };
  await write();
  const interval = setInterval(() => void write(), 2500);
  request.on("close", () => {
    clearInterval(interval);
    response.end();
  });
});

for (const action of ["pause", "resume", "stop", "approve-step", "reject-step", "regenerate"] as const) {
  agentAdminRouter.post(`/workspace/:runId/${action}`, requirePermission("workspace:create"), async (request, response) => {
    const parsed = workspaceControlSchema.safeParse(request.body || {});
    const organizationId = request.session?.organizationId;
    const actorId = request.session?.userId;
    if (!parsed.success || !organizationId || !actorId) {
      response.status(400).json({ error: "Invalid workspace control", issues: parsed.success ? [] : parsed.error.issues });
      return;
    }
    response.json({ data: await agentWorkspaceService.control(organizationId, actorId, String(request.params.runId), action, parsed.data.reason, parsed.data.stepId) });
  });
}

agentAdminRouter.post("/workspace/:runId/instructions", requirePermission("workspace:create"), async (request, response) => {
  const parsed = workspaceInstructionSchema.safeParse(request.body || {});
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!parsed.success || !organizationId || !actorId) {
    response.status(400).json({ error: "Invalid workspace instruction", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.status(201).json({ data: await agentWorkspaceService.addInstruction(organizationId, actorId, String(request.params.runId), parsed.data) });
});

agentAdminRouter.get("/templates", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentTemplateService.list(request.session.organizationId, true) : [] });
});

agentAdminRouter.post("/templates", requirePermission("workspace:create"), async (request, response) => {
  const parsed = templateInputSchema.safeParse(request.body);
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid template request", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.status(201).json({ data: await agentTemplateService.create(request.session.organizationId, request.session.userId, parsed.data) });
});

agentAdminRouter.get("/marketplace", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentTemplateService.marketplace(request.session.organizationId) : [] });
});

agentAdminRouter.get("/marketplace/:templateId", async (request, response) => {
  const detail = request.session?.organizationId ? await agentTemplateService.detail(request.session.organizationId, String(request.params.templateId)) : undefined;
  if (!detail || detail.status !== "published") {
    response.status(404).json({ error: "Published template not found" });
    return;
  }
  response.json({ data: detail });
});

agentAdminRouter.get("/templates/:templateId", async (request, response) => {
  const detail = request.session?.organizationId ? await agentTemplateService.detail(request.session.organizationId, String(request.params.templateId)) : undefined;
  if (!detail) {
    response.status(404).json({ error: "Template not found" });
    return;
  }
  response.json({ data: detail });
});

agentAdminRouter.patch("/templates/:templateId", requirePermission("workspace:create"), async (request, response) => {
  if (!request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Organization context is required" });
    return;
  }
  const updated = await agentTemplateService.update(request.session.organizationId, request.session.userId, String(request.params.templateId), request.body);
  if (!updated) {
    response.status(404).json({ error: "Template not found" });
    return;
  }
  response.json({ data: updated });
});

agentAdminRouter.get("/templates/:templateId/versions", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentTemplateService.versions(request.session.organizationId, String(request.params.templateId)) : [] });
});

agentAdminRouter.post("/templates/:templateId/versions", requirePermission("workspace:create"), async (request, response) => {
  const template = request.session?.organizationId ? await agentTemplateService.detail(request.session.organizationId, String(request.params.templateId)) : undefined;
  if (!template || !request.session?.userId) {
    response.status(404).json({ error: "Template not found" });
    return;
  }
  response.status(201).json({ data: await agentTemplateService.createVersion(template, request.session.userId, String(request.body?.changelog || "Manual version snapshot."), "draft") });
});

for (const action of ["archive", "clone", "publish", "unpublish", "rollback"] as const) {
  agentAdminRouter.post(`/templates/:templateId/${action}`, requirePermission("workspace:create"), async (request, response) => {
    const organizationId = request.session?.organizationId;
    const actorId = request.session?.userId;
    if (!organizationId || !actorId) {
      response.status(400).json({ error: "Organization context is required" });
      return;
    }
    const serviceCall = {
      archive: () => agentTemplateService.archive(organizationId, actorId, String(request.params.templateId)),
      clone: () => agentTemplateService.clone(organizationId, actorId, String(request.params.templateId)),
      publish: () => agentTemplateService.publish(organizationId, actorId, String(request.params.templateId)),
      unpublish: () => agentTemplateService.unpublish(organizationId, actorId, String(request.params.templateId)),
      rollback: () => agentTemplateService.rollback(organizationId, actorId, String(request.params.templateId), request.body?.versionId)
    }[action];
    const result = await serviceCall();
    if (!result) {
      response.status(404).json({ error: "Template not found" });
      return;
    }
    response.json({ data: result });
  });
}

agentAdminRouter.post("/templates/:templateId/use", requirePermission("workspace:create"), async (request, response) => {
  const parsed = templateUseSchema.safeParse(request.body);
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid template usage request", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  try {
    response.status(201).json({ data: await agentTemplateService.use(request.session.organizationId, request.session.userId, String(request.params.templateId), parsed.data.inputValues) });
  } catch (error) {
    response.status(400).json({ error: "Template usage failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

agentAdminRouter.get("/runs/:runId", async (request, response) => {
  const detail = request.session?.organizationId ? await agentAdminService.detail(request.session.organizationId, String(request.params.runId)) : undefined;
  if (!detail) {
    response.status(404).json({ error: "Agent run not found" });
    return;
  }
  response.json({ data: detail });
});

agentAdminRouter.get("/runs/:runId/tasks", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentAdminService.tasks(request.session.organizationId, String(request.params.runId)) : [] });
});

agentAdminRouter.get("/runs/:runId/files", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentAdminService.files(request.session.organizationId, String(request.params.runId)) : [] });
});

agentAdminRouter.get("/runs/:runId/validations", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentAdminService.validations(request.session.organizationId, String(request.params.runId)) : [] });
});

agentAdminRouter.get("/runs/:runId/errors", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentAdminService.errors(request.session.organizationId, String(request.params.runId)) : [] });
});

agentAdminRouter.get("/runs/:runId/logs", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentAdminService.logs(request.session.organizationId, String(request.params.runId)) : [] });
});

for (const action of ["approve", "reject", "block", "resume", "cancel"] as const) {
  agentAdminRouter.post(`/runs/:runId/${action}`, async (request, response) => {
    const parsed = agentActionSchema.safeParse(request.body || {});
    if (!parsed.success) {
      response.status(400).json({ error: "Invalid agent action", issues: parsed.error.issues });
      return;
    }
    const organizationId = request.session?.organizationId;
    const actorId = request.session?.userId;
    const result =
      organizationId && actorId
        ? await agentAdminService.action({ organizationId, actorId, runId: String(request.params.runId), action, reason: parsed.data.reason })
        : undefined;
    if (!result) {
      response.status(404).json({ error: "Agent run not found" });
      return;
    }
    response.json({ data: result });
  });
}

function emptySummary() {
  return {
    totalRuns: 0,
    activeRuns: 0,
    completedRuns: 0,
    failedOrBlockedRuns: 0,
    averageValidationSuccessRate: 0,
    recentActivity: [],
    notifications: []
  };
}
