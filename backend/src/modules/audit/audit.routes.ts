import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { auditService } from "./audit.service";

export const auditRouter = Router();

const auditSchema = z.object({
  actorId: z.string(),
  organizationId: z.string(),
  action: z.enum([
    "AUTH_LOGIN",
    "AUTH_LOGOUT",
    "PASSWORD_RESET",
    "FINANCE_ACTION",
    "LEGAL_ACTION",
    "SECURITY_ACTION",
    "BILLING_ACTION",
    "ENTITLEMENT_CHECK",
    "WORKSPACE_CREATED",
    "PERMISSION_CHECK",
    "SETTINGS_CHANGED",
    "AUTOMATION_CHANGED",
    "FILE_UPLOADED",
    "VAANFORGE_AGENT_RUN"
  ]),
  entityType: z.string(),
  entityId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

auditRouter.get("/", authMiddleware, requirePermission("audit:read"), (request, response) => {
  response.json({ data: auditService.list({ organizationId: request.session?.organizationId }) });
});

auditRouter.get("/summary", authMiddleware, requirePermission("audit:read"), (request, response) => {
  response.json({ data: auditService.summary(request.session?.organizationId) });
});

auditRouter.post("/", authMiddleware, requirePermission("audit:read"), (request, response) => {
  const parsed = auditSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid audit entry", issues: parsed.error.issues });
    return;
  }
  response.status(201).json({
    data: auditService.record({
      ...parsed.data,
      requestId: request.headers["x-request-id"]?.toString(),
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"]
    })
  });
});
