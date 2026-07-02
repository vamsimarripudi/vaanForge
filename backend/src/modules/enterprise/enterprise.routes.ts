import { Router } from "express";
import type { Request } from "express";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import { dataDeleteSchema, dataExportSchema, enterpriseService, inviteSchema, memberPatchSchema, workspacePatchSchema } from "./enterprise.service";

export const publicRouter = Router();
export const builderEnterpriseRouter = Router();
export const agentEnterpriseAdminRouter = Router();

publicRouter.use(rateLimitMiddleware(120, 60));
publicRouter.get("/pricing", (_request, response) => {
  response.json({ data: enterpriseService.publicPricing() });
});

builderEnterpriseRouter.use(authMiddleware, rateLimitMiddleware(120, 60));

builderEnterpriseRouter.get("/workspace", authMiddleware, (request, response) => {
  response.json({ data: enterpriseService.workspace(actor(request)) });
});

builderEnterpriseRouter.patch("/workspace", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = workspacePatchSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid workspace update", issues: parsed.error.issues });
  response.json({ data: enterpriseService.updateWorkspace(actor(request), parsed.data) });
});

builderEnterpriseRouter.get("/team", authMiddleware, (request, response) => {
  response.json({ data: enterpriseService.team(actor(request)) });
});

builderEnterpriseRouter.post("/team/invite", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = inviteSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid team invite", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: enterpriseService.invite(actor(request), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Team invite failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

builderEnterpriseRouter.patch("/team/:memberId", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = memberPatchSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid member update", issues: parsed.error.issues });
  const member = enterpriseService.updateMember(actor(request), String(request.params.memberId), parsed.data);
  if (!member) response.status(404).json({ error: "Workspace member not found" });
  else response.json({ data: member });
});

builderEnterpriseRouter.delete("/team/:memberId", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const member = enterpriseService.deleteMember(actor(request), String(request.params.memberId));
  if (!member) response.status(404).json({ error: "Workspace member not found" });
  else response.json({ data: member });
});

builderEnterpriseRouter.get("/security/audit-logs", authMiddleware, (request, response) => {
  response.json({ data: enterpriseService.auditLogs(actor(request)) });
});

builderEnterpriseRouter.get("/usage/reports", authMiddleware, (request, response) => {
  response.json({ data: enterpriseService.usageReports(actor(request)) });
});

builderEnterpriseRouter.post("/data/export", authMiddleware, requirePermission("reports:export"), (request, response) => {
  const parsed = dataExportSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid data export request", issues: parsed.error.issues });
  response.status(201).json({ data: enterpriseService.exportData(actor(request), parsed.data) });
});

builderEnterpriseRouter.post("/data/delete-request", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = dataDeleteSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid data delete request", issues: parsed.error.issues });
  response.status(201).json({ data: enterpriseService.deleteRequest(actor(request), parsed.data) });
});

agentEnterpriseAdminRouter.use(authMiddleware, requirePermission("audit:read"));
agentEnterpriseAdminRouter.get("/security/report", authMiddleware, requirePermission("audit:read"), (request, response) => response.json({ data: enterpriseService.securityReport(request.session!.organizationId!) }));
agentEnterpriseAdminRouter.get("/reliability/report", authMiddleware, requirePermission("audit:read"), (request, response) => response.json({ data: enterpriseService.reliabilityReport(request.session!.organizationId!) }));
agentEnterpriseAdminRouter.get("/compliance/report", authMiddleware, requirePermission("audit:read"), (request, response) => response.json({ data: enterpriseService.complianceReport(request.session!.organizationId!) }));
agentEnterpriseAdminRouter.get("/launch-readiness", authMiddleware, requirePermission("audit:read"), (request, response) => response.json({ data: enterpriseService.launchReadiness(request.session!.organizationId!) }));

function actor(request: Request) {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}
