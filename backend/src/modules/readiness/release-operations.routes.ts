import { Router, type Request } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import { deploymentActionSchema } from "../vaanforge/agent-deployment.service";
import {
  alertPatchSchema,
  alertRuleSchema,
  customerNoteSchema,
  customerTaskSchema,
  feedbackSchema,
  feedbackStatusSchema,
  postmortemSchema,
  releaseLifecycleSchema,
  releaseOperationsService,
  releasePatchSchema
} from "./release-operations.service";

export const releaseLifecycleRouter = Router();
export const deploymentSafetyRouter = Router();
export const monitoringRouter = Router();
export const alertsRouter = Router();
export const customerSuccessRouter = Router();
export const feedbackRouter = Router();
export const adminFeedbackRouter = Router();
export const adminIncidentsRouter = Router();

releaseLifecycleRouter.post("/", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = releaseLifecycleSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid release", issues: parsed.error.issues });
  response.status(201).json({ data: releaseOperationsService.createRelease(actor(request), parsed.data) });
});

releaseLifecycleRouter.patch("/:releaseId", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = releasePatchSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid release update", issues: parsed.error.issues });
  try {
    response.json({ data: releaseOperationsService.updateRelease(actor(request), String(request.params.releaseId), parsed.data) });
  } catch (error) {
    response.status(404).json({ error: "Release update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

releaseLifecycleRouter.post("/:releaseId/approve", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  try {
    response.json({ data: releaseOperationsService.approveRelease(actor(request), String(request.params.releaseId)) });
  } catch (error) {
    response.status(404).json({ error: "Release approval failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

releaseLifecycleRouter.post("/:releaseId/publish", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  try {
    response.json({ data: releaseOperationsService.publishRelease(actor(request), String(request.params.releaseId)) });
  } catch (error) {
    response.status(400).json({ error: "Release publish failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

releaseLifecycleRouter.post("/:releaseId/archive", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  try {
    response.json({ data: releaseOperationsService.archiveRelease(actor(request), String(request.params.releaseId)) });
  } catch (error) {
    response.status(404).json({ error: "Release archive failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

deploymentSafetyRouter.use(authMiddleware, requirePermission("workspace:create"), rateLimitMiddleware(90, 60));
deploymentSafetyRouter.post("/:deploymentId/preflight", async (request, response) => {
  const parsed = z.object({ signature: z.string().min(8) }).safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid deployment preflight", issues: parsed.error.issues });
  try {
    response.json({ data: await releaseOperationsService.deploymentPreflight(actor(request), String(request.params.deploymentId), parsed.data.signature) });
  } catch (error) {
    response.status(400).json({ error: "Deployment preflight failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

for (const action of ["deploy", "verify", "rollback"] as const) {
  deploymentSafetyRouter.post(`/:deploymentId/${action}`, async (request, response) => {
    const parsed = deploymentActionSchema.safeParse(request.body || {});
    if (!parsed.success) return response.status(400).json({ error: `Invalid deployment ${action}`, issues: parsed.error.issues });
    try {
      const act = actor(request);
      const deploymentId = String(request.params.deploymentId);
      const data =
        action === "deploy"
          ? await releaseOperationsService.deploymentDeploy(act, deploymentId, parsed.data)
          : action === "verify"
            ? await releaseOperationsService.deploymentVerify(act, deploymentId, parsed.data.signature)
            : await releaseOperationsService.deploymentRollback(act, deploymentId, parsed.data);
      response.json({ data });
    } catch (error) {
      response.status(400).json({ error: `Deployment ${action} failed`, message: error instanceof Error ? error.message : "Unknown error" });
    }
  });
}

monitoringRouter.use(authMiddleware, requirePermission("audit:read"), rateLimitMiddleware(120, 60));
monitoringRouter.get("/overview", (request, response) => response.json({ data: releaseOperationsService.monitoring(actor(request)).overview }));
monitoringRouter.get("/services", (request, response) => response.json({ data: releaseOperationsService.monitoring(actor(request)).services }));
monitoringRouter.get("/queues", (request, response) => response.json({ data: releaseOperationsService.monitoring(actor(request)).queues }));
monitoringRouter.get("/errors", (request, response) => response.json({ data: releaseOperationsService.monitoring(actor(request)).errors }));
monitoringRouter.get("/providers", (request, response) => response.json({ data: releaseOperationsService.monitoring(actor(request)).providers }));

alertsRouter.use(authMiddleware, requirePermission("settings:manage"), rateLimitMiddleware(90, 60));
alertsRouter.get("/", (request, response) => response.json({ data: releaseOperationsService.alerts(actor(request)) }));
alertsRouter.post("/rules", (request, response) => {
  const parsed = alertRuleSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid alert rule", issues: parsed.error.issues });
  response.status(201).json({ data: releaseOperationsService.createAlertRule(actor(request), parsed.data) });
});
alertsRouter.patch("/rules/:ruleId", (request, response) => {
  const parsed = alertPatchSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid alert rule update", issues: parsed.error.issues });
  try {
    response.json({ data: releaseOperationsService.updateAlertRule(actor(request), String(request.params.ruleId), parsed.data) });
  } catch (error) {
    response.status(404).json({ error: "Alert rule update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
alertsRouter.post("/:alertId/acknowledge", (request, response) => {
  try {
    response.json({ data: releaseOperationsService.acknowledgeAlert(actor(request), String(request.params.alertId), request.body?.note ? String(request.body.note) : undefined) });
  } catch (error) {
    response.status(404).json({ error: "Alert acknowledgement failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
alertsRouter.post("/:alertId/resolve", (request, response) => {
  try {
    response.json({ data: releaseOperationsService.resolveAlert(actor(request), String(request.params.alertId)) });
  } catch (error) {
    response.status(404).json({ error: "Alert resolve failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

customerSuccessRouter.use(authMiddleware, requirePermission("audit:read"), rateLimitMiddleware(90, 60));
customerSuccessRouter.get("/overview", (request, response) => response.json({ data: releaseOperationsService.customerSuccessOverview(actor(request)) }));
customerSuccessRouter.get("/accounts", (request, response) => response.json({ data: releaseOperationsService.customerSuccessAccounts(actor(request)) }));
customerSuccessRouter.get("/accounts/:accountId", (request, response) => {
  try {
    response.json({ data: releaseOperationsService.customerAccount(actor(request), String(request.params.accountId)) });
  } catch (error) {
    response.status(404).json({ error: "Customer account not found", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
customerSuccessRouter.post("/accounts/:accountId/note", requirePermission("settings:manage"), (request, response) => {
  const parsed = customerNoteSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid customer success note", issues: parsed.error.issues });
  response.status(201).json({ data: releaseOperationsService.addCustomerNote(actor(request), String(request.params.accountId), parsed.data.note) });
});
customerSuccessRouter.post("/accounts/:accountId/task", requirePermission("settings:manage"), (request, response) => {
  const parsed = customerTaskSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid customer success task", issues: parsed.error.issues });
  response.status(201).json({ data: releaseOperationsService.addCustomerTask(actor(request), String(request.params.accountId), parsed.data) });
});

feedbackRouter.use(authMiddleware, rateLimitMiddleware(120, 60));
feedbackRouter.post("/", requirePermission("support:create"), (request, response) => {
  const parsed = feedbackSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid feedback", issues: parsed.error.issues });
  response.status(201).json({ data: releaseOperationsService.createFeedback(optionalActor(request), parsed.data) });
});
feedbackRouter.get("/", (request, response) => response.json({ data: releaseOperationsService.feedback(optionalActor(request)) }));
feedbackRouter.post("/:feedbackId/vote", requirePermission("profile:manage"), (request, response) => {
  try {
    response.json({ data: releaseOperationsService.voteFeedback(optionalActor(request), String(request.params.feedbackId)) });
  } catch (error) {
    response.status(404).json({ error: "Feedback vote failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

adminFeedbackRouter.post("/:feedbackId/status", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = feedbackStatusSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid feedback status", issues: parsed.error.issues });
  try {
    response.json({ data: releaseOperationsService.updateFeedbackStatus(actor(request), String(request.params.feedbackId), parsed.data.status) });
  } catch (error) {
    response.status(404).json({ error: "Feedback status update failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

adminIncidentsRouter.post("/:incidentId/postmortem", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = postmortemSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid postmortem", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: releaseOperationsService.postmortem(actor(request), String(request.params.incidentId), parsed.data) });
  } catch (error) {
    response.status(404).json({ error: "Postmortem creation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

function actor(request: Request) {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}

function optionalActor(request: Request) {
  return { organizationId: request.session?.organizationId, userId: request.session?.userId, role: request.session?.role };
}
