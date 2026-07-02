import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createId, store, type StoredApiKey, type StoredSupportTicket } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { billingService } from "../billing/billing.service";
import { settingsService } from "../settings/settings.service";

export type AccountActor = {
  userId: string;
  organizationId: string;
  role?: string;
  sessionId?: string;
};

const accountFeatureSettings = new Map<string, Record<string, unknown>>();

export const profilePatchSchema = z.object({
  displayName: z.string().min(2).max(120).optional(),
  title: z.string().max(120).optional(),
  timezone: z.string().max(80).optional(),
  locale: z.string().max(20).optional()
});

export const avatarSchema = z.object({
  fileName: z.string().min(1).max(180),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  sizeBytes: z.number().int().positive().max(2_000_000),
  storageKey: z.string().min(8).max(240)
});

export const apiKeyCreateSchema = z.object({
  name: z.string().min(2).max(120),
  scopes: z.array(z.string().min(2).max(80)).min(1).max(20),
  environment: z.enum(["test", "live"]).default("test"),
  expiresAt: z.string().datetime().optional()
});

export const supportTicketSchema = z.object({
  subject: z.string().min(4).max(160),
  category: z.enum(["General", "Technical", "Billing", "Subscription", "Payments", "Bug", "Feature Request", "Deployment", "Security", "API", "Marketplace", "Developer", "Account", "AI Generation", "Performance"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  projectId: z.string().optional(),
  message: z.string().min(1).max(5000)
});

export const supportMessageSchema = z.object({
  message: z.string().min(1).max(5000)
});

export const supportAttachmentSchema = z.object({
  fileName: z.string().min(1).max(180),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "application/pdf", "text/plain"]),
  sizeBytes: z.number().int().positive().max(10_000_000),
  storageKey: z.string().min(8).max(240)
});

export const adminTicketPatchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional()
});

export const adminNoteSchema = z.object({
  note: z.string().min(1).max(5000)
});

export const assignmentSchema = z.object({
  assigneeId: z.string().min(1)
});

export const knowledgeArticleSchema = z.object({
  title: z.string().min(3).max(160),
  slug: z.string().min(3).max(160).regex(/^[a-z0-9-]+$/),
  body: z.string().min(1).max(10000),
  category: z.string().min(2).max(80),
  status: z.enum(["draft", "published", "archived"]).default("draft")
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(160),
  body: z.string().min(1).max(5000),
  status: z.enum(["draft", "published", "archived"]).default("draft")
});

export const accountSettingsPatchSchema = z.object({
  themeMode: z.enum(["light", "dark", "system"]).optional(),
  billingEmail: z.string().email().optional(),
  notificationEmail: z.boolean().optional(),
  notificationSms: z.boolean().optional()
});

export const aiPreferencesPatchSchema = z.object({
  defaultTone: z.enum(["concise", "balanced", "detailed"]).default("balanced"),
  approvalMode: z.enum(["manual", "milestone", "strict"]).default("milestone"),
  allowMemory: z.boolean().default(true)
});

export const notificationPatchSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  product: z.boolean().default(true),
  billing: z.boolean().default(true),
  security: z.boolean().default(true)
});

export class AccountService {
  profile(actor: AccountActor) {
    const user = this.requireUser(actor.userId);
    const profile = this.ensureProfile(actor);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      profile
    };
  }

  updateProfile(actor: AccountActor, input: z.infer<typeof profilePatchSchema>) {
    const patch = profilePatchSchema.parse(input);
    const profile = this.ensureProfile(actor);
    Object.assign(profile, patch, { updatedAt: new Date().toISOString() });
    this.audit(actor, "PROFILE_UPDATED", "UserProfile", profile.id, { fields: Object.keys(patch) });
    return this.profile(actor);
  }

  avatar(actor: AccountActor, input: z.infer<typeof avatarSchema>) {
    const parsed = avatarSchema.parse(input);
    const profile = this.ensureProfile(actor);
    profile.avatarStorageKey = parsed.storageKey;
    profile.updatedAt = new Date().toISOString();
    this.audit(actor, "PROFILE_AVATAR_UPDATED", "UserProfile", profile.id, { fileName: parsed.fileName, mimeType: parsed.mimeType, sizeBytes: parsed.sizeBytes });
    return { avatarStorageKey: profile.avatarStorageKey, profile };
  }

  changePassword(actor: AccountActor) {
    this.audit(actor, "PROFILE_PASSWORD_CHANGE_REQUESTED", "User", actor.userId, { mode: "delegated_to_auth_reset" });
    return { accepted: true, nextAction: "Use the authenticated password reset flow to complete the password change." };
  }

  sessions(actor: AccountActor) {
    return [{ sessionId: actor.sessionId, userId: actor.userId, organizationId: actor.organizationId, current: true, status: "active" }];
  }

  loginHistory(actor: AccountActor) {
    return store.loginHistory.filter((item) => item.userId === actor.userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  usageSummary(actor: AccountActor) {
    return billingService.usage(actor.organizationId, actor.userId);
  }

  billingSummary(actor: AccountActor) {
    return {
      plans: billingService.plans(actor.organizationId),
      subscription: store.customerSubscriptions.find((item) => item.organizationId === actor.organizationId && item.customerId === actor.userId) || null,
      invoices: billingService.invoices(actor.organizationId, actor.userId),
      credits: billingService.credits(actor.organizationId, actor.userId)
    };
  }

  activity(actor: AccountActor) {
    return store.workspaceAuditLogs
      .filter((item) => item.organizationId === actor.organizationId && item.actorId === actor.userId)
      .sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 50);
  }

  settingsAccount(actor: AccountActor) {
    return settingsService.get(actor.organizationId);
  }

  async patchSettingsAccount(actor: AccountActor, input: z.infer<typeof accountSettingsPatchSchema>) {
    const current = await settingsService.get(actor.organizationId);
    const parsed = accountSettingsPatchSchema.parse(input);
    const updated = await settingsService.update({ ...current, ...parsed, organizationId: actor.organizationId });
    this.audit(actor, "SETTINGS_ACCOUNT_UPDATED", "OrganizationSettings", actor.organizationId, { fields: Object.keys(parsed) });
    return updated;
  }

  workspace(actor: AccountActor) {
    const workspace = store.workspaces.find((item) => item.organizationId === actor.organizationId);
    return workspace || null;
  }

  updateWorkspace(actor: AccountActor, input: { name?: string }) {
    const workspace = store.workspaces.find((item) => item.organizationId === actor.organizationId);
    if (!workspace) throw new Error("Workspace not found.");
    if (input.name) workspace.name = input.name;
    this.audit(actor, "WORKSPACE_SETTINGS_UPDATED", "Workspace", workspace.id, { fields: Object.keys(input) });
    return workspace;
  }

  team(actor: AccountActor) {
    return store.users.filter((item) => item.organizationId === actor.organizationId).map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role }));
  }

  inviteTeam(actor: AccountActor, input: { email: string; role?: string }) {
    const invite = { id: createId("invite"), organizationId: actor.organizationId, email: input.email, role: input.role || "Viewer", status: "pending", createdAt: new Date().toISOString() };
    this.audit(actor, "TEAM_INVITE_CREATED", "WorkspaceInvite", invite.id, { email: invite.email, role: invite.role });
    return invite;
  }

  updateTeamMember(actor: AccountActor, memberId: string, input: { role?: string }) {
    const user = store.users.find((item) => item.organizationId === actor.organizationId && item.id === memberId);
    if (!user) throw new Error("Team member not found.");
    if (input.role) user.role = input.role as typeof user.role;
    this.audit(actor, "TEAM_MEMBER_UPDATED", "User", user.id, { fields: Object.keys(input) });
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  removeTeamMember(actor: AccountActor, memberId: string) {
    const user = store.users.find((item) => item.organizationId === actor.organizationId && item.id === memberId);
    if (!user) throw new Error("Team member not found.");
    user.organizationId = undefined;
    this.audit(actor, "TEAM_MEMBER_REMOVED", "User", user.id);
    return { memberId, removedAt: new Date().toISOString() };
  }

  aiPreferences(actor: AccountActor) {
    return this.memorySetting(actor, "ai_preferences", { defaultTone: "balanced", approvalMode: "milestone", allowMemory: true });
  }

  updateAiPreferences(actor: AccountActor, input: z.infer<typeof aiPreferencesPatchSchema>) {
    const parsed = aiPreferencesPatchSchema.parse(input);
    const setting = this.writeMemorySetting(actor, "ai_preferences", parsed);
    this.audit(actor, "AI_PREFERENCES_UPDATED", "Settings", actor.organizationId, { fields: Object.keys(parsed) });
    return setting;
  }

  notificationPreferences(actor: AccountActor) {
    return this.memorySetting(actor, "notification_preferences", { email: true, sms: false, product: true, billing: true, security: true });
  }

  updateNotificationPreferences(actor: AccountActor, input: z.infer<typeof notificationPatchSchema>) {
    const parsed = notificationPatchSchema.parse(input);
    const setting = this.writeMemorySetting(actor, "notification_preferences", parsed);
    this.audit(actor, "NOTIFICATION_PREFERENCES_UPDATED", "Settings", actor.organizationId, { fields: Object.keys(parsed) });
    return setting;
  }

  securitySettings(actor: AccountActor) {
    return this.memorySetting(actor, "security_settings", { mfaReady: true, sessionTimeoutMinutes: 480, adminStrictMode: true });
  }

  updateSecuritySettings(actor: AccountActor, input: Record<string, unknown>) {
    const setting = this.writeMemorySetting(actor, "security_settings", input);
    this.audit(actor, "SECURITY_SETTINGS_UPDATED", "Settings", actor.organizationId, { fields: Object.keys(input) });
    return setting;
  }

  dataPrivacy(actor: AccountActor) {
    return { exportAvailable: true, deleteRequestAvailable: true, retentionDays: 365, nextAction: "Request export or deletion from this settings page." };
  }

  requestDataExport(actor: AccountActor) {
    const now = new Date().toISOString();
    const request = {
      id: createId("der"),
      requestId: createId("data_export"),
      organizationId: actor.organizationId,
      requestedById: actor.userId,
      status: "pending" as const,
      exportScope: ["profile", "projects", "billing", "audit"],
      dueDate: dueInDays(7),
      nextAction: "Export package will be generated after privacy review.",
      activityHistory: [{ at: now, actorId: actor.userId, action: "REQUESTED" }],
      createdAt: now,
      updatedAt: now
    };
    store.dataExportRequests.push(request);
    this.audit(actor, "DATA_EXPORT_REQUESTED", "DataExportRequest", request.requestId);
    return request;
  }

  requestDataDeletion(actor: AccountActor, reason = "Requested from settings") {
    const now = new Date().toISOString();
    const request = {
      id: createId("ddr"),
      requestId: createId("data_delete"),
      organizationId: actor.organizationId,
      requestedById: actor.userId,
      status: "pending" as const,
      reason,
      dueDate: dueInDays(14),
      nextAction: "Admin review required before deletion.",
      activityHistory: [{ at: now, actorId: actor.userId, action: "REQUESTED" }],
      createdAt: now,
      updatedAt: now
    };
    store.dataDeleteRequests.push(request);
    this.audit(actor, "DATA_DELETE_REQUESTED", "DataDeleteRequest", request.requestId);
    return request;
  }

  integrations(actor: AccountActor) {
    return this.memorySetting(actor, "integrations", { razorpay: "configured_by_backend", webhooks: "signature_required", storage: "signed_url_required" });
  }

  updateIntegrations(actor: AccountActor, input: Record<string, unknown>) {
    const setting = this.writeMemorySetting(actor, "integrations", input);
    this.audit(actor, "INTEGRATIONS_UPDATED", "Settings", actor.organizationId, { fields: Object.keys(input) });
    return setting;
  }

  createApiKey(actor: AccountActor, input: z.infer<typeof apiKeyCreateSchema>) {
    const parsed = apiKeyCreateSchema.parse(input);
    const secret = `vf_${parsed.environment}_${randomBytes(24).toString("hex")}`;
    const now = new Date().toISOString();
    const key: StoredApiKey = {
      id: createId("ak"),
      keyId: createId("key"),
      developerId: actor.userId,
      organizationId: actor.organizationId,
      name: parsed.name,
      keyHash: hashSecret(secret),
      prefix: secret.slice(0, 14),
      scopes: parsed.scopes,
      status: "active",
      expiresAt: parsed.expiresAt,
      ipAllowlist: [],
      createdAt: now,
      updatedAt: now
    };
    store.apiKeys.push(key);
    this.audit(actor, "API_KEY_CREATED", "ApiKey", key.keyId, { prefix: key.prefix, scopes: key.scopes, environment: parsed.environment });
    return { key: redactKey(key), secret };
  }

  apiKeys(actor: AccountActor) {
    return store.apiKeys.filter((item) => item.organizationId === actor.organizationId && item.developerId === actor.userId).map(redactKey);
  }

  apiKey(actor: AccountActor, keyId: string) {
    const key = this.requireApiKey(actor, keyId);
    return redactKey(key);
  }

  rotateApiKey(actor: AccountActor, keyId: string) {
    const key = this.requireApiKey(actor, keyId);
    key.status = "rotated";
    key.updatedAt = new Date().toISOString();
    const rotated = this.createApiKey(actor, { name: `${key.name} rotation`, scopes: key.scopes, environment: "live", expiresAt: key.expiresAt });
    const newKey = store.apiKeys.find((item) => item.keyId === rotated.key.keyId);
    if (newKey) newKey.rotatedFromKeyId = key.keyId;
    this.audit(actor, "API_KEY_ROTATED", "ApiKey", key.keyId, { newKeyId: rotated.key.keyId });
    return rotated;
  }

  revokeApiKey(actor: AccountActor, keyId: string) {
    const key = this.requireApiKey(actor, keyId);
    key.status = "revoked";
    key.updatedAt = new Date().toISOString();
    this.audit(actor, "API_KEY_REVOKED", "ApiKey", key.keyId, { prefix: key.prefix });
    return redactKey(key);
  }

  apiKeyUsage(actor: AccountActor, keyId: string) {
    this.requireApiKey(actor, keyId);
    return store.apiUsageLogs.filter((item) => item.organizationId === actor.organizationId && item.keyId === keyId);
  }

  apiKeysSummary(actor: AccountActor) {
    const keys = this.apiKeys(actor);
    return { total: keys.length, active: keys.filter((item) => item.status === "active").length, revoked: keys.filter((item) => item.status === "revoked").length, keys };
  }

  createTicket(actor: AccountActor, input: z.infer<typeof supportTicketSchema>) {
    const parsed = supportTicketSchema.parse(input);
    const now = new Date().toISOString();
    const ticket: StoredSupportTicket = {
      id: createId("tkt"),
      organizationId: actor.organizationId,
      customerId: actor.userId,
      subject: parsed.subject,
      priority: parsed.priority,
      status: "OPEN",
      createdAt: now
    };
    store.supportTickets.push(ticket);
    store.ticketMessages.push({ id: createId("msg"), ticketId: ticket.id, authorId: actor.userId, message: parsed.message, internal: false, createdAt: now });
    this.audit(actor, "SUPPORT_TICKET_CREATED", "SupportTicket", ticket.id, { category: parsed.category, priority: parsed.priority, projectId: parsed.projectId });
    return this.ticket(actor, ticket.id, false);
  }

  createFeedback(actor: AccountActor, message: string) {
    return this.createTicket(actor, {
      subject: "Customer feedback",
      category: "General",
      priority: "LOW",
      message
    });
  }

  customerTickets(actor: AccountActor) {
    return store.supportTickets
      .filter((item) => item.organizationId === actor.organizationId && item.customerId === actor.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  ticket(actor: AccountActor, ticketId: string, includeInternal: boolean) {
    const ticket = this.requireTicket(actor, ticketId, includeInternal);
    const messages = store.ticketMessages.filter((item) => item.ticketId === ticket.id && (includeInternal || !item.internal));
    const attachments = store.supportAttachments.filter((item) => item.ticketId === ticket.id);
    const internalNotes = includeInternal ? store.supportInternalNotes.filter((item) => item.ticketId === ticket.id) : undefined;
    return { ticket, messages, attachments, internalNotes };
  }

  addTicketMessage(actor: AccountActor, ticketId: string, input: z.infer<typeof supportMessageSchema>, internal = false) {
    const ticket = this.requireTicket(actor, ticketId, internal);
    const parsed = supportMessageSchema.parse(input);
    const message = { id: createId("msg"), ticketId: ticket.id, authorId: actor.userId, message: parsed.message, internal, createdAt: new Date().toISOString() };
    store.ticketMessages.push(message);
    this.audit(actor, internal ? "SUPPORT_INTERNAL_NOTE_ADDED" : "SUPPORT_MESSAGE_ADDED", "SupportTicket", ticket.id, { internal });
    return message;
  }

  addAttachment(actor: AccountActor, ticketId: string, input: z.infer<typeof supportAttachmentSchema>) {
    const ticket = this.requireTicket(actor, ticketId, false);
    const parsed = supportAttachmentSchema.parse(input);
    const attachment = { id: createId("sat"), attachmentId: createId("support_attachment"), ticketId: ticket.id, organizationId: actor.organizationId, createdBy: actor.userId, createdAt: new Date().toISOString(), ...parsed };
    store.supportAttachments.push(attachment);
    this.audit(actor, "SUPPORT_ATTACHMENT_ADDED", "SupportTicket", ticket.id, { fileName: attachment.fileName, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes });
    return attachment;
  }

  updateTicketStatus(actor: AccountActor, ticketId: string, status: StoredSupportTicket["status"]) {
    const ticket = this.requireTicket(actor, ticketId, true);
    ticket.status = status;
    this.audit(actor, "SUPPORT_TICKET_STATUS_CHANGED", "SupportTicket", ticket.id, { status });
    return ticket;
  }

  adminTickets(actor: AccountActor) {
    return store.supportTickets.filter((item) => item.organizationId === actor.organizationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  adminDashboard(actor: AccountActor) {
    const tickets = this.adminTickets(actor);
    return {
      total: tickets.length,
      open: tickets.filter((item) => item.status === "OPEN").length,
      urgent: tickets.filter((item) => item.priority === "URGENT").length,
      closed: tickets.filter((item) => item.status === "CLOSED" || item.status === "RESOLVED").length,
      nextAction: tickets.some((item) => item.priority === "URGENT") ? "Review urgent tickets first." : "Review open tickets by oldest activity."
    };
  }

  patchAdminTicket(actor: AccountActor, ticketId: string, input: z.infer<typeof adminTicketPatchSchema>) {
    const ticket = this.requireTicket(actor, ticketId, true);
    const parsed = adminTicketPatchSchema.parse(input);
    Object.assign(ticket, parsed);
    this.audit(actor, "ADMIN_SUPPORT_TICKET_UPDATED", "SupportTicket", ticket.id, parsed);
    return ticket;
  }

  assignTicket(actor: AccountActor, ticketId: string, input: z.infer<typeof assignmentSchema>) {
    const ticket = this.requireTicket(actor, ticketId, true);
    const parsed = assignmentSchema.parse(input);
    const assignment = { ticketId: ticket.id, assigneeId: parsed.assigneeId, assignedBy: actor.userId, createdAt: new Date().toISOString() };
    this.audit(actor, "SUPPORT_TICKET_ASSIGNED", "SupportTicket", ticket.id, assignment);
    return assignment;
  }

  internalNote(actor: AccountActor, ticketId: string, input: z.infer<typeof adminNoteSchema>) {
    const ticket = this.requireTicket(actor, ticketId, true);
    const parsed = adminNoteSchema.parse(input);
    const note = { id: createId("sin"), noteId: createId("support_note"), ticketId: ticket.id, organizationId: actor.organizationId, authorId: actor.userId, note: parsed.note, createdAt: new Date().toISOString() };
    store.supportInternalNotes.push(note);
    store.ticketMessages.push({ id: createId("msg"), ticketId: ticket.id, authorId: actor.userId, message: parsed.note, internal: true, createdAt: note.createdAt });
    this.audit(actor, "SUPPORT_INTERNAL_NOTE_ADDED", "SupportTicket", ticket.id, { noteId: note.noteId });
    return note;
  }

  announcements(actor: AccountActor) {
    return store.supportAnnouncements.filter((item) => item.organizationId === actor.organizationId && item.status === "published");
  }

  createAnnouncement(actor: AccountActor, input: z.infer<typeof announcementSchema>) {
    const parsed = announcementSchema.parse(input);
    const now = new Date().toISOString();
    const announcement = { id: createId("san"), announcementId: createId("support_announcement"), organizationId: actor.organizationId, createdBy: actor.userId, createdAt: now, updatedAt: now, ...parsed };
    store.supportAnnouncements.push(announcement);
    this.audit(actor, "SUPPORT_ANNOUNCEMENT_CREATED", "SupportAnnouncement", announcement.announcementId, { status: announcement.status });
    return announcement;
  }

  patchAnnouncement(actor: AccountActor, announcementId: string, input: Partial<z.infer<typeof announcementSchema>>) {
    const announcement = store.supportAnnouncements.find((item) => item.organizationId === actor.organizationId && (item.id === announcementId || item.announcementId === announcementId));
    if (!announcement) throw new Error("Announcement not found.");
    const patch = announcementSchema.partial().parse(input);
    Object.assign(announcement, patch, { updatedAt: new Date().toISOString() });
    this.audit(actor, "SUPPORT_ANNOUNCEMENT_UPDATED", "SupportAnnouncement", announcement.announcementId, { fields: Object.keys(patch) });
    return announcement;
  }

  articles(actor: AccountActor) {
    return store.knowledgeArticles.filter((item) => item.organizationId === actor.organizationId && item.status === "published");
  }

  article(actor: AccountActor, slug: string) {
    return this.articles(actor).find((item) => item.slug === slug);
  }

  createArticle(actor: AccountActor, input: z.infer<typeof knowledgeArticleSchema>) {
    const parsed = knowledgeArticleSchema.parse(input);
    const now = new Date().toISOString();
    const article = { id: createId("kba"), articleId: createId("knowledge_article"), organizationId: actor.organizationId, createdBy: actor.userId, createdAt: now, updatedAt: now, ...parsed };
    store.knowledgeArticles.push(article);
    this.audit(actor, "SUPPORT_KB_ARTICLE_CREATED", "KnowledgeArticle", article.articleId, { slug: article.slug, status: article.status });
    return article;
  }

  patchArticle(actor: AccountActor, articleId: string, input: Partial<z.infer<typeof knowledgeArticleSchema>>) {
    const article = store.knowledgeArticles.find((item) => item.organizationId === actor.organizationId && (item.id === articleId || item.articleId === articleId));
    if (!article) throw new Error("Knowledge article not found.");
    const patch = knowledgeArticleSchema.partial().parse(input);
    Object.assign(article, patch, { updatedAt: new Date().toISOString() });
    this.audit(actor, "SUPPORT_KB_ARTICLE_UPDATED", "KnowledgeArticle", article.articleId, { fields: Object.keys(patch) });
    return article;
  }

  supportStatus(actor: AccountActor) {
    const summary = this.adminDashboard(actor);
    return { status: summary.urgent ? "degraded_support_load" : "operational", supportQueue: summary };
  }

  private ensureProfile(actor: AccountActor) {
    const user = this.requireUser(actor.userId);
    let profile = store.userProfiles.find((item) => item.userId === actor.userId);
    if (!profile) {
      const now = new Date().toISOString();
      profile = { id: createId("upr"), userId: actor.userId, organizationId: actor.organizationId, displayName: user.name, timezone: "Asia/Kolkata", locale: "en-IN", createdAt: now, updatedAt: now };
      store.userProfiles.push(profile);
    }
    return profile;
  }

  private requireUser(userId: string) {
    const user = store.users.find((item) => item.id === userId);
    if (!user) throw new Error("User not found.");
    return user;
  }

  private requireApiKey(actor: AccountActor, keyId: string) {
    const key = store.apiKeys.find((item) => item.organizationId === actor.organizationId && item.developerId === actor.userId && item.keyId === keyId);
    if (!key) throw new Error("API key not found.");
    return key;
  }

  private requireTicket(actor: AccountActor, ticketId: string, admin: boolean) {
    const ticket = store.supportTickets.find((item) => item.organizationId === actor.organizationId && item.id === ticketId && (admin || item.customerId === actor.userId));
    if (!ticket) throw new Error("Support ticket not found.");
    return ticket;
  }

  private memorySetting(actor: AccountActor, key: string, fallback: Record<string, unknown>) {
    const saved = accountFeatureSettings.get(settingKey(actor, key));
    return { organizationId: actor.organizationId, key, value: saved || fallback, updatedAt: new Date().toISOString() };
  }

  private writeMemorySetting(actor: AccountActor, key: string, value: Record<string, unknown>) {
    accountFeatureSettings.set(settingKey(actor, key), value);
    return { organizationId: actor.organizationId, key, value, updatedAt: new Date().toISOString() };
  }

  private audit(actor: AccountActor, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: auditBucket(action), entityType, entityId, metadata: { ...metadata, action } });
  }
}

function auditBucket(action: string) {
  if (action.includes("API_KEY") || action.includes("PASSWORD") || action.includes("SECURITY")) return "SECURITY_ACTION" as const;
  if (action.includes("BILLING") || action.includes("PLAN") || action.includes("INVOICE")) return "BILLING_ACTION" as const;
  return "SETTINGS_CHANGED" as const;
}

function settingKey(actor: AccountActor, key: string) {
  return `${actor.organizationId}:${actor.userId}:${key}`;
}

function dueInDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function redactKey(key: StoredApiKey) {
  return {
    id: key.id,
    keyId: key.keyId,
    name: key.name,
    prefix: key.prefix,
    scopes: key.scopes,
    status: key.status,
    lastUsedAt: key.lastUsedAt,
    expiresAt: key.expiresAt,
    createdAt: key.createdAt,
    updatedAt: key.updatedAt
  };
}

export function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function safeHashEqual(secret: string, hash: string) {
  const actual = Buffer.from(hashSecret(secret));
  const expected = Buffer.from(hash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const accountService = new AccountService();
