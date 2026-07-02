import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  accountService,
  accountSettingsPatchSchema,
  adminNoteSchema,
  adminTicketPatchSchema,
  aiPreferencesPatchSchema,
  announcementSchema,
  apiKeyCreateSchema,
  assignmentSchema,
  avatarSchema,
  knowledgeArticleSchema,
  notificationPatchSchema,
  profilePatchSchema,
  supportAttachmentSchema,
  supportMessageSchema,
  supportTicketSchema,
  type AccountActor
} from "./account.service";

export const profileRouter = Router();
export const accountSettingsRouter = Router();
export const apiKeysRouter = Router();
export const customerSupportRouter = Router();
export const adminSupportRouter = Router();

profileRouter.use(authMiddleware);
profileRouter.get("/", (request, response) => response.json({ data: accountService.profile(actor(request)) }));
profileRouter.patch("/", requirePermission("profile:manage"), route(profilePatchSchema, (request, body) => accountService.updateProfile(actor(request), body)));
profileRouter.post("/avatar", requirePermission("profile:manage"), route(avatarSchema, (request, body) => accountService.avatar(actor(request), body)));
profileRouter.post("/change-password", requirePermission("profile:manage"), (request, response) => response.json({ data: accountService.changePassword(actor(request)) }));
profileRouter.get("/sessions", (request, response) => response.json({ data: accountService.sessions(actor(request)) }));
profileRouter.delete("/sessions/:sessionId", requirePermission("profile:manage"), (request, response) => {
  if (request.params.sessionId !== request.session?.sessionId) return response.status(404).json({ error: "Session not found" });
  response.json({ data: { revoked: true, sessionId: request.params.sessionId } });
});
profileRouter.get("/login-history", (request, response) => response.json({ data: accountService.loginHistory(actor(request)) }));
profileRouter.get("/usage-summary", (request, response) => response.json({ data: accountService.usageSummary(actor(request)) }));
profileRouter.get("/billing-summary", (request, response) => response.json({ data: accountService.billingSummary(actor(request)) }));
profileRouter.get("/api-keys-summary", (request, response) => response.json({ data: accountService.apiKeysSummary(actor(request)) }));
profileRouter.get("/activity", (request, response) => response.json({ data: accountService.activity(actor(request)) }));

accountSettingsRouter.use(authMiddleware);
accountSettingsRouter.get("/account", async (request, response) => response.json({ data: await accountService.settingsAccount(actor(request)) }));
accountSettingsRouter.patch("/account", requirePermission("settings:manage"), route(accountSettingsPatchSchema, (request, body) => accountService.patchSettingsAccount(actor(request), body)));
accountSettingsRouter.get("/workspace", (request, response) => response.json({ data: accountService.workspace(actor(request)) }));
accountSettingsRouter.patch("/workspace", requirePermission("settings:manage"), route(z.object({ name: z.string().min(2).max(120).optional() }), (request, body) => accountService.updateWorkspace(actor(request), body)));
accountSettingsRouter.get("/team", (request, response) => response.json({ data: accountService.team(actor(request)) }));
accountSettingsRouter.post("/team/invite", requirePermission("settings:manage"), route(z.object({ email: z.string().email(), role: z.string().optional() }), (request, body) => accountService.inviteTeam(actor(request), body)));
accountSettingsRouter.patch("/team/:memberId", requirePermission("settings:manage"), route(z.object({ role: z.string().min(2).optional() }), (request, body) => accountService.updateTeamMember(actor(request), String(request.params.memberId), body)));
accountSettingsRouter.delete("/team/:memberId", requirePermission("settings:manage"), (request, response) => withError(response, () => accountService.removeTeamMember(actor(request), String(request.params.memberId))));
accountSettingsRouter.get("/billing", (request, response) => response.json({ data: accountService.billingSummary(actor(request)) }));
accountSettingsRouter.get("/usage", (request, response) => response.json({ data: accountService.usageSummary(actor(request)) }));
accountSettingsRouter.get("/limits", (request, response) => response.json({ data: accountService.usageSummary(actor(request)).limits }));
accountSettingsRouter.get("/invoices", (request, response) => response.json({ data: accountService.billingSummary(actor(request)).invoices }));
accountSettingsRouter.get("/api-keys", (request, response) => response.json({ data: accountService.apiKeys(actor(request)) }));
accountSettingsRouter.get("/ai-preferences", (request, response) => response.json({ data: accountService.aiPreferences(actor(request)) }));
accountSettingsRouter.patch("/ai-preferences", requirePermission("settings:manage"), route(aiPreferencesPatchSchema, (request, body) => accountService.updateAiPreferences(actor(request), body)));
accountSettingsRouter.get("/notifications", (request, response) => response.json({ data: accountService.notificationPreferences(actor(request)) }));
accountSettingsRouter.patch("/notifications", requirePermission("settings:manage"), route(notificationPatchSchema, (request, body) => accountService.updateNotificationPreferences(actor(request), body)));
accountSettingsRouter.get("/security", (request, response) => response.json({ data: accountService.securitySettings(actor(request)) }));
accountSettingsRouter.patch("/security", requirePermission("settings:manage"), route(z.record(z.unknown()), (request, body) => accountService.updateSecuritySettings(actor(request), body)));
accountSettingsRouter.get("/data-privacy", (request, response) => response.json({ data: accountService.dataPrivacy(actor(request)) }));
accountSettingsRouter.post("/data-privacy/export", requirePermission("settings:manage"), (request, response) => response.status(202).json({ data: accountService.requestDataExport(actor(request)) }));
accountSettingsRouter.post("/data-privacy/delete-request", requirePermission("settings:manage"), route(z.object({ reason: z.string().min(2).max(500).optional() }), (request, body) => accountService.requestDataDeletion(actor(request), body.reason), 202));
accountSettingsRouter.get("/integrations", (request, response) => response.json({ data: accountService.integrations(actor(request)) }));
accountSettingsRouter.patch("/integrations", requirePermission("settings:manage"), route(z.record(z.unknown()), (request, body) => accountService.updateIntegrations(actor(request), body)));

apiKeysRouter.use(authMiddleware);
apiKeysRouter.get("/", (request, response) => response.json({ data: accountService.apiKeys(actor(request)) }));
apiKeysRouter.post("/", requirePermission("api-keys:manage"), route(apiKeyCreateSchema, (request, body) => accountService.createApiKey(actor(request), body), 201));
apiKeysRouter.get("/:keyId", (request, response) => withError(response, () => accountService.apiKey(actor(request), String(request.params.keyId))));
apiKeysRouter.post("/:keyId/rotate", requirePermission("api-keys:manage"), (request, response) => withError(response, () => accountService.rotateApiKey(actor(request), String(request.params.keyId)), 201));
apiKeysRouter.delete("/:keyId", requirePermission("api-keys:manage"), (request, response) => withError(response, () => accountService.revokeApiKey(actor(request), String(request.params.keyId))));
apiKeysRouter.get("/:keyId/usage", (request, response) => withError(response, () => accountService.apiKeyUsage(actor(request), String(request.params.keyId))));

customerSupportRouter.use(authMiddleware);
customerSupportRouter.post("/tickets", requirePermission("support:create"), route(supportTicketSchema, (request, body) => accountService.createTicket(actor(request), body), 201));
customerSupportRouter.get("/tickets", (request, response) => response.json({ data: accountService.customerTickets(actor(request)) }));
customerSupportRouter.get("/tickets/:ticketId", (request, response) => withError(response, () => accountService.ticket(actor(request), String(request.params.ticketId), false)));
customerSupportRouter.post("/tickets/:ticketId/messages", requirePermission("support:create"), route(supportMessageSchema, (request, body) => accountService.addTicketMessage(actor(request), String(request.params.ticketId), body), 201));
customerSupportRouter.post("/tickets/:ticketId/attachments", requirePermission("support:create"), route(supportAttachmentSchema, (request, body) => accountService.addAttachment(actor(request), String(request.params.ticketId), body), 201));
customerSupportRouter.post("/tickets/:ticketId/close", requirePermission("support:create"), (request, response) => withError(response, () => accountService.updateTicketStatus(actor(request), String(request.params.ticketId), "CLOSED")));
customerSupportRouter.post("/tickets/:ticketId/reopen", requirePermission("support:create"), (request, response) => withError(response, () => accountService.updateTicketStatus(actor(request), String(request.params.ticketId), "OPEN")));
customerSupportRouter.get("/announcements", (request, response) => response.json({ data: accountService.announcements(actor(request)) }));
customerSupportRouter.get("/kb", (request, response) => response.json({ data: accountService.articles(actor(request)) }));
customerSupportRouter.get("/kb/:articleSlug", (request, response) => response.json({ data: accountService.article(actor(request), String(request.params.articleSlug)) || null }));
customerSupportRouter.get("/status", (request, response) => response.json({ data: accountService.supportStatus(actor(request)) }));
customerSupportRouter.post("/feedback", requirePermission("support:create"), route(z.object({ message: z.string().min(1).max(3000) }), (request, body) => accountService.createFeedback(actor(request), body.message), 202));

adminSupportRouter.use(authMiddleware);
adminSupportRouter.get("/dashboard", requirePermission("support:manage"), (request, response) => response.json({ data: accountService.adminDashboard(actor(request)) }));
adminSupportRouter.get("/tickets", requirePermission("support:manage"), (request, response) => response.json({ data: accountService.adminTickets(actor(request)) }));
adminSupportRouter.get("/tickets/:ticketId", requirePermission("support:manage"), (request, response) => withError(response, () => accountService.ticket(actor(request), String(request.params.ticketId), true)));
adminSupportRouter.patch("/tickets/:ticketId", requirePermission("support:manage"), route(adminTicketPatchSchema, (request, body) => accountService.patchAdminTicket(actor(request), String(request.params.ticketId), body)));
adminSupportRouter.post("/tickets/:ticketId/assign", requirePermission("support:manage"), route(assignmentSchema, (request, body) => accountService.assignTicket(actor(request), String(request.params.ticketId), body)));
adminSupportRouter.post("/tickets/:ticketId/escalate", requirePermission("support:manage"), (request, response) => withError(response, () => accountService.patchAdminTicket(actor(request), String(request.params.ticketId), { priority: "URGENT", status: "IN_PROGRESS" })));
adminSupportRouter.post("/tickets/:ticketId/internal-note", requirePermission("support:manage"), route(adminNoteSchema, (request, body) => accountService.internalNote(actor(request), String(request.params.ticketId), body), 201));
adminSupportRouter.post("/kb", requirePermission("support:manage"), route(knowledgeArticleSchema, (request, body) => accountService.createArticle(actor(request), body), 201));
adminSupportRouter.patch("/kb/:id", requirePermission("support:manage"), route(knowledgeArticleSchema.partial(), (request, body) => accountService.patchArticle(actor(request), String(request.params.id), body)));
adminSupportRouter.post("/announcements", requirePermission("support:manage"), route(announcementSchema, (request, body) => accountService.createAnnouncement(actor(request), body), 201));
adminSupportRouter.patch("/announcements/:id", requirePermission("support:manage"), route(announcementSchema.partial(), (request, body) => accountService.patchAnnouncement(actor(request), String(request.params.id), body)));
adminSupportRouter.get("/reports", requirePermission("support:manage"), (request, response) => response.json({ data: accountService.adminDashboard(actor(request)) }));

function actor(request: any): AccountActor {
  if (!request.session?.organizationId) throw new Error("Workspace is required.");
  return { userId: request.session.userId, organizationId: request.session.organizationId, role: request.session.role, sessionId: request.session.sessionId };
}

function route<T extends z.ZodTypeAny>(schema: T, handler: (request: any, body: z.infer<T>) => unknown | Promise<unknown>, status = 200) {
  return async (request: any, response: any) => {
    const parsed = schema.safeParse(request.body || {});
    if (!parsed.success) return response.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    try {
      response.status(status).json({ data: await handler(request, parsed.data) });
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : "Request failed" });
    }
  };
}

function withError(response: any, handler: () => unknown, status = 200) {
  try {
    response.status(status).json({ data: handler() });
  } catch (error) {
    response.status(404).json({ error: error instanceof Error ? error.message : "Not found" });
  }
}
