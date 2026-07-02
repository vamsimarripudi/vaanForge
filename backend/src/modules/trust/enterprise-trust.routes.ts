import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  apiKeySecuritySchema,
  auditExportSchema,
  deleteDecisionSchema,
  enterpriseTrustService,
  legalAcceptSchema,
  promptScanSchema,
  reportSchema,
  secretScanSchema,
  type TrustActor
} from "./enterprise-trust.service";

export const adminSecurityCenterRouter = Router();
export const adminPrivacyRouter = Router();
export const legalAcceptanceRouter = Router();
export const adminLegalAcceptanceRouter = Router();
export const auditLogsRouter = Router();
export const adminAuditExportsRouter = Router();
export const developerApiKeySecurityRouter = Router();

adminSecurityCenterRouter.use(authMiddleware);
adminSecurityCenterRouter.get("/overview", requirePermission("audit:read"), (request, response) => ok(response, enterpriseTrustService.adminSecurityOverview(actor(request))));
adminSecurityCenterRouter.get("/events", requirePermission("audit:read"), (request, response) => ok(response, enterpriseTrustService.securityEvents(actor(request))));
adminSecurityCenterRouter.get("/risk", requirePermission("audit:read"), (request, response) => ok(response, enterpriseTrustService.risk(actor(request))));
adminSecurityCenterRouter.get("/sessions", requirePermission("audit:read"), (request, response) => ok(response, enterpriseTrustService.sessions(actor(request))));
adminSecurityCenterRouter.get("/api-keys", requirePermission("audit:read"), (request, response) => ok(response, enterpriseTrustService.apiKeys(actor(request))));
adminSecurityCenterRouter.get("/audit", requirePermission("audit:read"), (request, response) => ok(response, enterpriseTrustService.auditLogs(actor(request), request.query)));
adminSecurityCenterRouter.get("/reports", requirePermission("audit:read"), (request, response) => ok(response, enterpriseTrustService.securityReports(actor(request))));
adminSecurityCenterRouter.post("/reports/generate", requirePermission("settings:manage"), route(reportSchema, (request, body) => enterpriseTrustService.generateSecurityReport(actor(request), body), 201));
adminSecurityCenterRouter.post("/prompt-scan", requirePermission("settings:manage"), route(promptScanSchema, (request, body) => enterpriseTrustService.scanPrompt(actor(request), body), 201));
adminSecurityCenterRouter.post("/secret-scan", requirePermission("settings:manage"), route(secretScanSchema, (request, body) => enterpriseTrustService.scanSecrets(actor(request), body), 201));

adminPrivacyRouter.use(authMiddleware);
adminPrivacyRouter.get("/export-requests", requirePermission("audit:read"), (request, response) => ok(response, enterpriseTrustService.dataExportRequests(actor(request))));
adminPrivacyRouter.get("/delete-requests", requirePermission("audit:read"), (request, response) => ok(response, enterpriseTrustService.dataDeleteRequests(actor(request))));
adminPrivacyRouter.patch("/delete-requests/:requestId", requirePermission("settings:manage"), route(deleteDecisionSchema, (request, body) => enterpriseTrustService.decideDeleteRequest(actor(request), String(request.params.requestId), body)));

legalAcceptanceRouter.use(authMiddleware);
legalAcceptanceRouter.post("/accept", requirePermission("profile:manage"), route(legalAcceptSchema, (request, body) => enterpriseTrustService.acceptPolicy(actor(request), body), 201));
legalAcceptanceRouter.get("/acceptance-history", (request, response) => ok(response, enterpriseTrustService.acceptanceHistory(actor(request))));

adminLegalAcceptanceRouter.use(authMiddleware);
adminLegalAcceptanceRouter.get("/acceptance-logs", requirePermission("legal:manage"), (request, response) => ok(response, enterpriseTrustService.allAcceptanceLogs(actor(request))));

auditLogsRouter.use(authMiddleware);
auditLogsRouter.get("/", requirePermission("audit:read"), (request, response) => ok(response, enterpriseTrustService.auditLogs(actor(request), request.query)));
auditLogsRouter.post("/export", requirePermission("reports:export"), route(auditExportSchema, (request, body) => enterpriseTrustService.exportAuditLogs(actor(request), body), 201));

adminAuditExportsRouter.use(authMiddleware);
adminAuditExportsRouter.get("/", requirePermission("audit:read"), (request, response) => ok(response, enterpriseTrustService.auditExports(actor(request))));

developerApiKeySecurityRouter.use(authMiddleware);
developerApiKeySecurityRouter.get("/api-keys/:keyId/security", requirePermission("api-keys:manage"), (request, response) => handle(response, () => enterpriseTrustService.apiKeySecurity(actor(request), String(request.params.keyId))));
developerApiKeySecurityRouter.patch("/api-keys/:keyId/security", requirePermission("api-keys:manage"), route(apiKeySecuritySchema, (request, body) => enterpriseTrustService.updateApiKeySecurity(actor(request), String(request.params.keyId), body)));
developerApiKeySecurityRouter.post("/api-keys/:keyId/revoke", requirePermission("api-keys:manage"), (request, response) => handle(response, () => enterpriseTrustService.revokeApiKey(actor(request), String(request.params.keyId))));

function route<T extends z.ZodTypeAny>(schema: T, handler: (request: Request, body: z.infer<T>) => unknown, status = 200) {
  return (request: Request, response: Response) => {
    const parsed = schema.safeParse(request.body || {});
    if (!parsed.success) {
      response.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the highlighted fields.",
          fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])),
          recoverable: true,
          nextAction: "fix_fields"
        },
        requestId: request.requestId
      });
      return;
    }
    handle(response, () => handler(request, parsed.data), status);
  };
}

function handle(response: Response, handler: () => unknown, status = 200) {
  try {
    response.status(status).json({ data: handler() });
  } catch (error) {
    response.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: error instanceof Error ? error.message : "Resource not found.",
        recoverable: true,
        nextAction: "refresh_and_retry"
      }
    });
  }
}

function ok(response: Response, data: unknown) {
  response.json({ data });
}

function actor(request: Request): TrustActor {
  return {
    organizationId: request.session!.organizationId!,
    workspaceId: request.session!.organizationId,
    userId: request.session!.userId,
    role: request.session!.role,
    requestId: request.requestId,
    ip: request.ip,
    userAgent: request.header("user-agent")
  };
}
