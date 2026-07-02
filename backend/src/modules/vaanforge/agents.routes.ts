import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { store } from "../../database/in-memory-store";
import { agentActionSchema, agentAdminService } from "./agent-admin.service";
import { agentTeamService, roleSchema } from "./agent-team.service";
import { vaanForgeService } from "./vaanforge.service";

export const agentsRouter = Router();

agentsRouter.use(authMiddleware);

agentsRouter.post("/runs", requirePermission("workspace:create"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const requestedById = request.session?.userId;
  if (!organizationId || !requestedById) return response.status(400).json({ error: "Organization context is required" });
  try {
    const requirement = typeof request.body === "object" && request.body && "requirements" in request.body ? request.body.requirements : request.body;
    response.status(201).json({ data: await vaanForgeService.submit({ organizationId, requestedById, requirement }) });
  } catch (error) {
    response.status(400).json({ error: "Agent run failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

agentsRouter.get("/runs", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentAdminService.runs(request.session.organizationId) : [] });
});

agentsRouter.get("/runs/:runId", async (request, response) => {
  const detail = request.session?.organizationId ? await agentAdminService.detail(request.session.organizationId, String(request.params.runId)) : undefined;
  if (!detail) return response.status(404).json({ error: "Agent run not found" });
  response.json({ data: detail });
});

for (const action of ["pause", "resume", "cancel"] as const) {
  agentsRouter.post(`/runs/:runId/${action}`, requirePermission("workspace:create"), async (request, response) => {
    const parsed = agentActionSchema.safeParse(request.body || {});
    if (!parsed.success || !request.session?.organizationId || !request.session.userId) return response.status(400).json({ error: "Invalid agent action" });
    const mappedAction = action === "pause" ? "block" : action;
    const result = await agentAdminService.action({ organizationId: request.session.organizationId, actorId: request.session.userId, runId: String(request.params.runId), action: mappedAction, reason: parsed.data.reason });
    if (!result) return response.status(404).json({ error: "Agent run not found" });
    response.json({ data: result });
  });
}

agentsRouter.get("/runs/:runId/events", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentAdminService.logs(request.session.organizationId, String(request.params.runId)) : [] });
});

agentsRouter.get("/runs/:runId/logs", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentAdminService.logs(request.session.organizationId, String(request.params.runId)) : [] });
});

agentsRouter.get("/runs/:runId/outputs", async (request, response) => {
  const organizationId = request.session?.organizationId;
  const runId = String(request.params.runId);
  if (!organizationId) return response.json({ data: [] });
  const detail = await agentAdminService.detail(organizationId, runId);
  response.json({ data: detail ? { runId, outputs: [detail], files: await agentAdminService.files(organizationId, runId), validations: await agentAdminService.validations(organizationId, runId) } : null });
});

agentsRouter.get("/runs/:runId/handoffs", async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) return response.json({ data: [] });
  response.json({ data: store.agentHandoffs.filter((item) => item.organizationId === organizationId && item.runId === String(request.params.runId)) });
});

agentsRouter.get("/roles", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await agentTeamService.roles(request.session.organizationId) : [] });
});

agentsRouter.post("/roles", requirePermission("workspace:create"), async (request, response) => {
  const parsed = roleSchema.safeParse(request.body || {});
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) return response.status(400).json({ error: "Invalid agent role", issues: parsed.success ? [] : parsed.error.issues });
  response.status(201).json({ data: await agentTeamService.createRole(request.session.organizationId, request.session.userId, parsed.data) });
});

agentsRouter.patch("/roles/:roleId", requirePermission("workspace:create"), async (request, response) => {
  if (!request.session?.organizationId || !request.session.userId) return response.status(400).json({ error: "Organization context is required" });
  const role = await agentTeamService.updateRole(request.session.organizationId, request.session.userId, String(request.params.roleId), request.body || {});
  if (!role) return response.status(404).json({ error: "Agent role not found" });
  response.json({ data: role });
});

agentsRouter.get("/brains", async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) return response.json({ data: [] });
  await agentTeamService.roles(organizationId);
  response.json({ data: store.agentRoleConfigs.filter((item) => item.organizationId === organizationId).map((config) => ({ brainId: config.configId, ...config, systemPrompt: config.systemPrompt.slice(0, 160), secretSafe: true })) });
});

agentsRouter.get("/brains/:brainId", async (request, response) => {
  const organizationId = request.session?.organizationId;
  const brain = store.agentRoleConfigs.find((item) => item.organizationId === organizationId && item.configId === String(request.params.brainId));
  if (!brain) return response.status(404).json({ error: "Agent brain not found" });
  response.json({ data: { brainId: brain.configId, ...brain, secretSafe: true } });
});

agentsRouter.patch("/brains/:brainId", requirePermission("workspace:create"), async (request, response) => {
  const parsed = z.object({ modelProvider: z.string().optional(), systemPrompt: z.string().min(10).optional(), tools: z.array(z.string()).optional(), guardrails: z.array(z.string()).optional() }).safeParse(request.body || {});
  const organizationId = request.session?.organizationId;
  const brain = store.agentRoleConfigs.find((item) => item.organizationId === organizationId && item.configId === String(request.params.brainId));
  if (!parsed.success) return response.status(400).json({ error: "Invalid brain update", issues: parsed.error.issues });
  if (!brain) return response.status(404).json({ error: "Agent brain not found" });
  Object.assign(brain, parsed.data, { updatedAt: new Date().toISOString() });
  response.json({ data: { brainId: brain.configId, ...brain, secretSafe: true } });
});
