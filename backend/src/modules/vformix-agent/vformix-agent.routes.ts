import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import {
  vformixAgentConfigSchema,
  vformixAgentService,
  vformixFieldMappingSchema,
  vformixRunSchema,
  vformixTriggerSchema,
  vformixWebhookSchema
} from "./vformix-agent.service";

export const vformixAgentAdminRouter = Router();
export const vformixAgentInternalRouter = Router();

vformixAgentAdminRouter.use(authMiddleware, requirePermission("audit:read"));

vformixAgentAdminRouter.get("/forms/:formId/agent", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await vformixAgentService.getConfig(request.session.organizationId, String(request.params.formId)) : undefined });
});

vformixAgentAdminRouter.patch("/forms/:formId/agent", requirePermission("workspace:create"), async (request, response) => {
  const parsed = vformixAgentConfigSchema.safeParse(request.body);
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid VFormix agent config", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.json({ data: await vformixAgentService.updateConfig(request.session.organizationId, request.session.userId, String(request.params.formId), parsed.data) });
});

vformixAgentAdminRouter.get("/forms/:formId/agent/mapping", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await vformixAgentService.getMapping(request.session.organizationId, String(request.params.formId)) : [] });
});

vformixAgentAdminRouter.patch("/forms/:formId/agent/mapping", requirePermission("workspace:create"), async (request, response) => {
  const parsed = vformixFieldMappingSchema.safeParse(request.body);
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid VFormix field mapping", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.json({ data: await vformixAgentService.updateMapping(request.session.organizationId, request.session.userId, String(request.params.formId), parsed.data) });
});

vformixAgentAdminRouter.get("/forms/:formId/agent/triggers", async (request, response) => {
  response.json({ data: request.session?.organizationId ? await vformixAgentService.getTriggers(request.session.organizationId, String(request.params.formId)) : [] });
});

vformixAgentAdminRouter.patch("/forms/:formId/agent/triggers", requirePermission("workspace:create"), async (request, response) => {
  const parsed = vformixTriggerSchema.safeParse(request.body);
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid VFormix trigger rules", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.json({ data: await vformixAgentService.updateTriggers(request.session.organizationId, request.session.userId, String(request.params.formId), parsed.data) });
});

vformixAgentAdminRouter.post("/submissions/:submissionId/agent/run", requirePermission("workspace:create"), async (request, response) => {
  const parsed = vformixRunSchema.safeParse(request.body || {});
  if (!parsed.success || !request.session?.organizationId || !request.session.userId) {
    response.status(400).json({ error: "Invalid VFormix agent run request", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  const formId = parsed.data.formId || String(request.body?.rawSubmission?.formId || "manual-form");
  const rawSubmission = parsed.data.rawSubmission || request.body || {};
  response.status(201).json({
    data: await vformixAgentService.runFromSubmission({
      organizationId: request.session.organizationId,
      actorId: request.session.userId,
      formId,
      submissionId: String(request.params.submissionId),
      rawSubmission,
      triggerType: parsed.data.triggerType,
      allowDuplicate: parsed.data.allowDuplicate,
      startCodingAfterBlueprint: parsed.data.startCodingAfterBlueprint
    })
  });
});

vformixAgentAdminRouter.get("/submissions/:submissionId/agent/status", async (request, response) => {
  const status = request.session?.organizationId ? await vformixAgentService.status(request.session.organizationId, String(request.params.submissionId)) : undefined;
  if (!status) {
    response.status(404).json({ error: "VFormix submission agent status not found" });
    return;
  }
  response.json({ data: status });
});

vformixAgentInternalRouter.post("/agent/webhook", async (request, response) => {
  if (!vformixAgentService.verifyWebhookToken(request.header("x-vformix-agent-token"))) {
    vformixAgentService.logWebhook({ eventType: String(request.body?.eventType || "unknown"), status: "rejected", reason: "Invalid webhook token" });
    response.status(401).json({ error: "Invalid webhook token" });
    return;
  }
  const parsed = vformixWebhookSchema.safeParse(request.body);
  if (!parsed.success) {
    vformixAgentService.logWebhook({ eventType: String(request.body?.eventType || "unknown"), status: "failed", reason: "Invalid webhook payload" });
    response.status(400).json({ error: "Invalid webhook payload", issues: parsed.error.issues });
    return;
  }
  try {
    const link = await vformixAgentService.runFromSubmission({
      organizationId: parsed.data.organizationId,
      actorId: "vformix-webhook",
      formId: parsed.data.formId,
      submissionId: parsed.data.submissionId,
      rawSubmission: parsed.data.rawSubmission,
      triggerType: "submission"
    });
    vformixAgentService.logWebhook({ organizationId: parsed.data.organizationId, formId: parsed.data.formId, submissionId: parsed.data.submissionId, eventType: parsed.data.eventType, status: "accepted" });
    response.status(202).json({ data: link });
  } catch (error) {
    vformixAgentService.logWebhook({ organizationId: parsed.data.organizationId, formId: parsed.data.formId, submissionId: parsed.data.submissionId, eventType: parsed.data.eventType, status: "failed", reason: error instanceof Error ? error.message : "Unknown webhook error" });
    response.status(400).json({ error: "VFormix webhook failed", message: error instanceof Error ? error.message : "Unknown webhook error" });
  }
});
