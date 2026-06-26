import { Router, type Request } from "express";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import { auditSearchSchema, commandSchema, incidentCreateSchema, incidentPatchSchema, operationsService } from "./operations.service";

export const operationsRouter = Router();

operationsRouter.use(authMiddleware, requirePermission("audit:read"), rateLimitMiddleware(90, 60));

operationsRouter.get("/summary", (request, response) => {
  response.json({ data: operationsService.summary(actor(request)) });
});

operationsRouter.get("/agents", (request, response) => {
  response.json({ data: operationsService.agents(actor(request)) });
});

operationsRouter.post("/agents/:agentId/:action", (request, response) => {
  const action = String(request.params.action);
  const command = action === "enable" ? "enable_agent" : action === "disable" ? "disable_agent" : action === "restart" ? "restart_agent" : action === "drain" ? "drain_agent" : undefined;
  if (!command) return response.status(400).json({ error: "Unsupported agent command" });
  try {
    response.json({ data: operationsService.command(actor(request), { action: command, targetId: String(request.params.agentId), reason: String(request.body?.reason || `${command} requested.`), confirmed: Boolean(request.body?.confirmed), affectedServices: ["agent-fleet"] }) });
  } catch (error) {
    response.status(400).json({ error: "Agent command failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

operationsRouter.get("/products", (request, response) => {
  response.json({ data: operationsService.products(actor(request)) });
});

operationsRouter.get("/incidents", (request, response) => {
  response.json({ data: operationsService.incidents(actor(request)) });
});

operationsRouter.post("/incidents", (request, response) => {
  const parsed = incidentCreateSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid incident", issues: parsed.error.issues });
  response.status(201).json({ data: operationsService.createIncident(actor(request), parsed.data) });
});

operationsRouter.get("/incidents/:incidentId", (request, response) => {
  const incident = operationsService.incidents(actor(request)).find((item) => item.incidentId === request.params.incidentId);
  if (!incident) response.status(404).json({ error: "Incident not found" });
  else response.json({ data: incident });
});

operationsRouter.patch("/incidents/:incidentId", (request, response) => {
  const parsed = incidentPatchSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid incident update", issues: parsed.error.issues });
  const incident = operationsService.updateIncident(actor(request), String(request.params.incidentId), parsed.data);
  if (!incident) response.status(404).json({ error: "Incident not found" });
  else response.json({ data: incident });
});

operationsRouter.get("/audit", (request, response) => {
  const parsed = auditSearchSchema.safeParse(request.query || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid audit search", issues: parsed.error.issues });
  response.json({ data: operationsService.auditSearch(actor(request), parsed.data) });
});

operationsRouter.get("/analytics", (request, response) => {
  response.json({ data: operationsService.analytics(actor(request)) });
});

operationsRouter.get("/health", (request, response) => {
  response.json({ data: operationsService.health(actor(request)) });
});

operationsRouter.get("/queues", (request, response) => {
  response.json({ data: operationsService.queues(actor(request)) });
});

operationsRouter.get("/deployments", (request, response) => {
  response.json({ data: operationsService.deployments(actor(request)) });
});

operationsRouter.get("/settings", (request, response) => {
  response.json({ data: operationsService.settings(actor(request)) });
});

operationsRouter.post("/command", requirePermission("settings:manage"), (request, response) => {
  const parsed = commandSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid operations command", issues: parsed.error.issues });
  try {
    response.json({ data: operationsService.command(actor(request), parsed.data) });
  } catch (error) {
    response.status(403).json({ error: "Operations command rejected", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

operationsRouter.post("/maintenance", requirePermission("settings:manage"), (request, response) => {
  const parsed = commandSchema.safeParse({ ...(request.body || {}), action: request.body?.action || "scheduled_maintenance" });
  if (!parsed.success) return response.status(400).json({ error: "Invalid maintenance command", issues: parsed.error.issues });
  response.json({ data: operationsService.command(actor(request), parsed.data) });
});

operationsRouter.post("/emergency", requirePermission("settings:manage"), (request, response) => {
  const parsed = commandSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid emergency command", issues: parsed.error.issues });
  try {
    response.json({ data: operationsService.command(actor(request), parsed.data) });
  } catch (error) {
    response.status(403).json({ error: "Emergency command rejected", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

operationsRouter.post("/resume", requirePermission("settings:manage"), (request, response) => {
  const parsed = commandSchema.safeParse({ ...(request.body || {}), action: "resume_services" });
  if (!parsed.success) return response.status(400).json({ error: "Invalid resume command", issues: parsed.error.issues });
  try {
    response.json({ data: operationsService.command(actor(request), parsed.data) });
  } catch (error) {
    response.status(403).json({ error: "Resume command rejected", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

function actor(request: Request) {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}
