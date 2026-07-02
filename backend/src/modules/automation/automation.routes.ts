import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { auditService } from "../audit/audit.service";
import { automationService } from "./automation.service";

export const automationRouter = Router();

const triggerSchema = z.enum(["LEAD_CREATED", "TICKET_CREATED", "RENEWAL_DUE", "REPORT_READY", "TASK_OVERDUE", "DEPLOYMENT_SUCCEEDED", "BLUEPRINT_APPROVED", "CREDITS_LOW", "PAYMENT_FAILED", "AI_FINISHED"]);
const actionSchema = z.enum(["CREATE_TASK", "SEND_NOTIFICATION", "QUEUE_REPORT", "REQUEST_APPROVAL", "SEND_EMAIL", "CALL_WEBHOOK"]);
const statusSchema = z.enum(["DRAFT", "ACTIVE", "PAUSED"]);

automationRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await automationService.summary(organizationId) : { rules: 0, active: 0, paused: 0, approvalRequired: 0 } });
});

automationRouter.get("/rules", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await automationService.list(organizationId) : [] });
});

automationRouter.get("/operating-system", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await automationService.operatingSystem(organizationId)
      : {
          triggers: [],
          actions: [],
          conditions: [],
          approvalRules: [],
          followUpAutomation: [],
          renewalReminders: [],
          reportGeneration: [],
          taskCreation: [],
          templates: []
        }
  });
});

automationRouter.post("/rules", authMiddleware, requirePermission("settings:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ name: z.string().min(2), trigger: triggerSchema, action: actionSchema, status: statusSchema.default("DRAFT"), approvalRequired: z.boolean().default(true) }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid automation rule request" });
    return;
  }
  const rule = await automationService.createRule({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "AUTOMATION_CHANGED", entityType: "AutomationRule", entityId: rule.id, metadata: { ...rule } });
  response.status(201).json({ data: rule });
});
