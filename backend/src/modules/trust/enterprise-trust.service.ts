import { z } from "zod";
import { createId, store, type StoredApiKeySecuritySetting, type StoredSecurityReport } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";

export interface TrustActor {
  organizationId: string;
  userId: string;
  role: string;
  workspaceId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

export const auditExportSchema = z.object({
  format: z.enum(["csv", "json"]).default("json"),
  actor: z.string().optional(),
  action: z.string().optional(),
  target: z.string().optional(),
  result: z.string().optional(),
  riskLevel: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional()
});

export const apiKeySecuritySchema = z.object({
  scopes: z.array(z.string().min(2)).optional(),
  ipAllowlist: z.array(z.string().min(3)).optional(),
  replayProtection: z.boolean().optional(),
  perMinuteLimit: z.number().int().min(1).max(10000).optional(),
  status: z.enum(["active", "restricted", "revoked"]).optional()
});

export const legalAcceptSchema = z.object({
  policySlug: z.enum(["terms-of-use", "privacy-policy", "payment-policy", "refund-policy", "data-usage-policy", "cookie-policy", "api-terms", "marketplace-publisher-terms", "partner-terms"]),
  version: z.number().int().positive().optional(),
  pageId: z.string().optional()
});

export const deleteDecisionSchema = z.object({
  status: z.enum(["completed", "rejected", "pending"]),
  note: z.string().min(2).max(1000).optional()
});

export const promptScanSchema = z.object({
  sourceType: z.enum(["project_prompt", "uploaded_doc", "marketplace_template", "support_ticket", "knowledge_base", "memory_entry", "agent_handoff"]),
  sourceId: z.string().optional(),
  content: z.string().min(1).max(25000)
});

export const secretScanSchema = z.object({
  sourceType: z.enum(["generated_file", "uploaded_file", "documentation", "memory_entry", "agent_output", "support_attachment"]),
  sourceId: z.string().optional(),
  content: z.string().min(1).max(25000)
});

export const reportSchema = z.object({
  reportType: z.enum(["security_posture", "audit_summary", "api_key_usage_risk", "provider_readiness", "tenant_isolation", "billing_security"])
});

export class EnterpriseTrustService {
  adminSecurityOverview(actor: TrustActor) {
    const events = this.securityEvents(actor);
    const failedLogins = store.loginHistory.filter((entry) => entry.outcome === "failed").length;
    const revokedKeys = store.apiKeys.filter((key) => key.organizationId === actor.organizationId && key.status === "revoked").length;
    const riskyPrompts = store.promptRiskEvents.filter((event) => event.organizationId === actor.organizationId && event.status !== "allowed").length;
    return {
      posture: events.some((event) => event.severity === "critical") ? "critical_review_required" : events.some((event) => event.severity === "high") ? "elevated" : "monitored",
      securityEvents: events.length,
      failedLogins,
      revokedApiKeys: revokedKeys,
      riskyPrompts,
      secretScanBlocks: store.secretScanEvents.filter((event) => event.organizationId === actor.organizationId && event.action === "blocked").length,
      readinessNotCertification: true,
      nextAction: events.length ? "Review high-severity security events and resolve open findings." : "Continue monitoring and keep audit exports enabled."
    };
  }

  securityEvents(actor: TrustActor) {
    return store.securityEvents.filter((event) => event.organizationId === actor.organizationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  risk(actor: TrustActor) {
    this.refreshRiskScores(actor);
    return store.securityRiskScores.filter((score) => score.organizationId === actor.organizationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  sessions(actor: TrustActor) {
    const users = store.users.filter((user) => user.organizationId === actor.organizationId).map((user) => user.id);
    return store.loginHistory
      .filter((entry) => users.includes(entry.userId))
      .slice(-50)
      .reverse()
      .map((entry) => ({
        sessionId: entry.sessionId,
        userId: entry.userId,
        success: entry.outcome === "success",
        ip: entry.ipAddress,
        userAgent: entry.userAgent,
        createdAt: entry.createdAt,
        risk: entry.outcome === "success" ? "low" : "medium"
      }));
  }

  apiKeys(actor: TrustActor) {
    return store.apiKeys
      .filter((key) => key.organizationId === actor.organizationId)
      .map((key) => ({
        keyId: key.keyId,
        name: key.name,
        prefix: key.prefix,
        scopes: key.scopes,
        status: key.status,
        lastUsedAt: key.lastUsedAt,
        security: this.ensureApiKeySecurity(actor, key.keyId)
      }));
  }

  dataExportRequests(actor: TrustActor) {
    return store.dataExportRequests.filter((request) => request.organizationId === actor.organizationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  dataDeleteRequests(actor: TrustActor) {
    return store.dataDeleteRequests.filter((request) => request.organizationId === actor.organizationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  decideDeleteRequest(actor: TrustActor, requestId: string, input: z.infer<typeof deleteDecisionSchema>) {
    const request = store.dataDeleteRequests.find((item) => item.organizationId === actor.organizationId && item.requestId === requestId);
    if (!request) throw new Error("Delete request not found.");
    request.status = input.status;
    request.nextAction = input.status === "completed" ? "Deletion workflow completed and recorded." : input.status === "rejected" ? "Customer should be notified with the review reason." : "Admin review remains pending.";
    request.updatedAt = new Date().toISOString();
    request.activityHistory.push({ at: request.updatedAt, actorId: actor.userId, action: "ADMIN_DECISION", status: input.status, note: input.note });
    this.audit(actor, "SECURITY_ACTION", "DataDeleteRequest", request.requestId, { status: input.status });
    return request;
  }

  acceptPolicy(actor: TrustActor, input: z.infer<typeof legalAcceptSchema>) {
    const page = input.pageId
      ? store.legalPages.find((item) => item.pageId === input.pageId)
      : store.legalPages.find((item) => item.slug === input.policySlug);
    const log = {
      id: createId("pal"),
      acceptanceId: createId("policy_acceptance"),
      pageId: page?.pageId || input.pageId || input.policySlug,
      userId: actor.userId,
      organizationId: actor.organizationId,
      workspaceId: actor.workspaceId,
      policySlug: input.policySlug,
      version: input.version || page?.version || 1,
      ip: actor.ip,
      userAgent: actor.userAgent,
      acceptedAt: new Date().toISOString()
    };
    store.legalAcceptanceLogs.push(log);
    this.audit(actor, "LEGAL_ACTION", "PolicyAcceptance", log.acceptanceId, { policySlug: input.policySlug, version: log.version });
    return log;
  }

  acceptanceHistory(actor: TrustActor) {
    return store.legalAcceptanceLogs.filter((log) => log.organizationId === actor.organizationId && log.userId === actor.userId).sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));
  }

  allAcceptanceLogs(actor: TrustActor) {
    return store.legalAcceptanceLogs.filter((log) => log.organizationId === actor.organizationId).sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));
  }

  auditLogs(actor: TrustActor, filters: Record<string, unknown> = {}) {
    const action = typeof filters.action === "string" ? (filters.action as any) : undefined;
    return auditService
      .list({ organizationId: actor.organizationId, action })
      .filter((entry) => (filters.actor ? entry.actorId === filters.actor : true))
      .filter((entry) => (filters.target ? entry.entityType === filters.target || entry.entityId === filters.target : true))
      .filter((entry) => (filters.result ? entry.result === filters.result : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  exportAuditLogs(actor: TrustActor, input: z.infer<typeof auditExportSchema>) {
    const logs = this.auditLogs(actor, input);
    const content =
      input.format === "csv"
        ? ["id,actorId,action,entityType,entityId,result,createdAt", ...logs.map((entry) => [entry.id, entry.actorId, entry.action, entry.entityType, entry.entityId || "", entry.result || "", entry.createdAt].map(csv).join(","))].join("\n")
        : JSON.stringify(logs, null, 2);
    const item = {
      id: createId("aex"),
      exportId: createId("audit_export"),
      organizationId: actor.organizationId,
      requestedById: actor.userId,
      format: input.format,
      filters: input,
      status: "completed" as const,
      recordCount: logs.length,
      content,
      createdAt: new Date().toISOString()
    };
    store.auditExports.push(item);
    this.audit(actor, "SECURITY_ACTION", "AuditExport", item.exportId, { format: input.format, recordCount: logs.length });
    return item;
  }

  auditExports(actor: TrustActor) {
    return store.auditExports.filter((item) => item.organizationId === actor.organizationId).map((item) => ({ ...item, content: `[${item.format} export stored]` }));
  }

  apiKeySecurity(actor: TrustActor, keyId: string) {
    return this.ensureApiKeySecurity(actor, keyId);
  }

  updateApiKeySecurity(actor: TrustActor, keyId: string, input: z.infer<typeof apiKeySecuritySchema>) {
    const key = this.requireApiKey(actor, keyId);
    const setting = this.ensureApiKeySecurity(actor, keyId);
    Object.assign(setting, {
      scopes: input.scopes || setting.scopes,
      ipAllowlist: input.ipAllowlist || setting.ipAllowlist,
      replayProtection: input.replayProtection ?? setting.replayProtection,
      perMinuteLimit: input.perMinuteLimit || setting.perMinuteLimit,
      status: input.status || setting.status,
      updatedById: actor.userId,
      updatedAt: new Date().toISOString()
    });
    if (input.scopes) key.scopes = input.scopes;
    if (input.ipAllowlist) key.ipAllowlist = input.ipAllowlist;
    if (input.status === "revoked") key.status = "revoked";
    key.updatedAt = setting.updatedAt;
    this.audit(actor, "SECURITY_ACTION", "ApiKeySecuritySetting", setting.settingId, { keyId, fields: Object.keys(input) });
    return setting;
  }

  revokeApiKey(actor: TrustActor, keyId: string) {
    return this.updateApiKeySecurity(actor, keyId, { status: "revoked" });
  }

  enforceApiKeyScope(actor: TrustActor, keyId: string, requiredScope: string, ip?: string) {
    const key = this.requireApiKey(actor, keyId);
    const setting = this.ensureApiKeySecurity(actor, keyId);
    const allowed = key.status === "active" && setting.status !== "revoked" && key.scopes.includes(requiredScope) && (!setting.ipAllowlist.length || (ip ? setting.ipAllowlist.includes(ip) : false));
    if (!allowed) {
      this.recordSecurityEvent(actor, "high", "api_key_abuse", "API key request blocked by scope or IP policy.", { keyId, requiredScope, ip: ip || "missing" }, 82);
    }
    return { allowed, keyId, requiredScope, reason: allowed ? "allowed" : "scope_or_ip_policy_blocked" };
  }

  detectWebhookReplay(actor: TrustActor, providerEventId: string) {
    const duplicates = store.razorpayWebhookEvents.filter((event) => event.providerEventId === providerEventId);
    const replayed = duplicates.length > 1;
    if (replayed) this.recordSecurityEvent(actor, "high", "webhook_replay", "Webhook replay attempt detected from duplicate provider event ID.", { providerEventId }, 88);
    return { providerEventId, replayed, occurrences: duplicates.length };
  }

  scanPrompt(actor: TrustActor, input: z.infer<typeof promptScanSchema>) {
    const signals = promptSignals(input.content);
    const riskScore = Math.min(100, signals.length * 28 + (/ignore previous|system prompt/i.test(input.content) ? 22 : 0));
    const severity = severityFor(riskScore);
    const status: "allowed" | "quarantined" | "review_required" = riskScore >= 70 ? "quarantined" : riskScore >= 40 ? "review_required" : "allowed";
    const event = {
      id: createId("pre"),
      eventId: createId("prompt_risk"),
      organizationId: actor.organizationId,
      workspaceId: actor.workspaceId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      riskScore,
      severity,
      detectedSignals: signals,
      status,
      sanitizedPreview: sanitizePreview(input.content),
      createdById: actor.userId,
      createdAt: new Date().toISOString()
    };
    store.promptRiskEvents.push(event);
    if (status !== "allowed") this.recordSecurityEvent(actor, severity, "prompt_injection", "Prompt input requires security review before agent use.", { eventId: event.eventId, signals }, riskScore);
    return event;
  }

  scanSecrets(actor: TrustActor, input: z.infer<typeof secretScanSchema>) {
    const detectedTypes = secretSignals(input.content);
    const confidence: "low" | "medium" | "high" = detectedTypes.some((type) => ["private_key", "provider_key", "jwt"].includes(type)) ? "high" : detectedTypes.length ? "medium" : "low";
    const action: "allowed" | "redacted" | "blocked" = confidence === "high" ? "blocked" : confidence === "medium" ? "redacted" : "allowed";
    const event = {
      id: createId("sse"),
      eventId: createId("secret_scan"),
      organizationId: actor.organizationId,
      workspaceId: actor.workspaceId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      confidence,
      detectedTypes,
      action,
      redactedPreview: redactSecrets(input.content).slice(0, 500),
      createdById: actor.userId,
      createdAt: new Date().toISOString()
    };
    store.secretScanEvents.push(event);
    if (action !== "allowed") this.recordSecurityEvent(actor, action === "blocked" ? "critical" : "high", "secret_exposure", "Secret scan found sensitive material.", { eventId: event.eventId, detectedTypes }, action === "blocked" ? 96 : 74);
    return event;
  }

  securityReports(actor: TrustActor) {
    return store.securityReports.filter((report) => report.organizationId === actor.organizationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  generateSecurityReport(actor: TrustActor, input: z.infer<typeof reportSchema>) {
    const report: StoredSecurityReport = {
      id: createId("srp"),
      reportId: createId("security_report"),
      organizationId: actor.organizationId,
      reportType: input.reportType,
      status: "readiness",
      summary: reportSummary(input.reportType),
      evidence: this.reportEvidence(actor, input.reportType),
      generatedById: actor.userId,
      createdAt: new Date().toISOString()
    };
    store.securityReports.push(report);
    this.audit(actor, "SECURITY_ACTION", "SecurityReport", report.reportId, { reportType: report.reportType, status: report.status });
    return report;
  }

  recordSecurityEvent(actor: TrustActor, severity: "low" | "medium" | "high" | "critical", category: string, message: string, evidence: Record<string, unknown>, riskScore?: number) {
    const event = {
      id: createId("sev"),
      eventId: createId("security_event"),
      organizationId: actor.organizationId,
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      severity,
      category,
      message,
      evidence,
      status: "open" as const,
      riskScore,
      requestId: actor.requestId,
      createdAt: new Date().toISOString()
    };
    store.securityEvents.push(event);
    this.audit(actor, "SECURITY_ACTION", "SecurityEvent", event.eventId, { severity, category, riskScore });
    return event;
  }

  private refreshRiskScores(actor: TrustActor) {
    const subjects = [
      { subjectType: "api_key" as const, subjectId: "api_keys", score: Math.min(100, store.apiKeys.filter((key) => key.organizationId === actor.organizationId && key.status === "active").length * 12), signals: ["active_api_keys"] },
      { subjectType: "prompt" as const, subjectId: "prompt_inputs", score: Math.min(100, store.promptRiskEvents.filter((event) => event.organizationId === actor.organizationId && event.status !== "allowed").length * 35), signals: ["prompt_risk_events"] },
      { subjectType: "secret" as const, subjectId: "secret_scans", score: Math.min(100, store.secretScanEvents.filter((event) => event.organizationId === actor.organizationId && event.action !== "allowed").length * 45), signals: ["secret_scan_findings"] }
    ];
    for (const subject of subjects) {
      const existing = store.securityRiskScores.find((item) => item.organizationId === actor.organizationId && item.subjectId === subject.subjectId);
      const level = severityFor(subject.score);
      const payload = {
        score: subject.score,
        level,
        signals: subject.signals,
        nextAction: subject.score >= 70 ? "Review and resolve security findings." : "Continue monitoring.",
        createdAt: new Date().toISOString()
      };
      if (existing) Object.assign(existing, payload);
      else store.securityRiskScores.push({ id: createId("risk"), riskId: createId("security_risk"), organizationId: actor.organizationId, ...subject, ...payload });
    }
  }

  private ensureApiKeySecurity(actor: TrustActor, keyId: string): StoredApiKeySecuritySetting {
    const key = this.requireApiKey(actor, keyId);
    let setting = store.apiKeySecuritySettings.find((item) => item.organizationId === actor.organizationId && item.keyId === keyId);
    if (!setting) {
      const now = new Date().toISOString();
      setting = {
        id: createId("akss"),
        settingId: createId("api_key_security"),
        keyId,
        organizationId: actor.organizationId,
        scopes: key.scopes,
        ipAllowlist: key.ipAllowlist,
        replayProtection: true,
        perMinuteLimit: 120,
        status: key.status === "revoked" ? "revoked" : "active",
        updatedById: actor.userId,
        createdAt: now,
        updatedAt: now
      };
      store.apiKeySecuritySettings.push(setting);
    }
    return setting;
  }

  private requireApiKey(actor: TrustActor, keyId: string) {
    const key = store.apiKeys.find((item) => item.organizationId === actor.organizationId && item.keyId === keyId);
    if (!key) throw new Error("API key not found.");
    return key;
  }

  private reportEvidence(actor: TrustActor, reportType: StoredSecurityReport["reportType"]) {
    return {
      reportType,
      generatedFromRealRecords: true,
      certificationClaimed: false,
      securityEvents: this.securityEvents(actor).length,
      auditLogs: this.auditLogs(actor).length,
      apiKeys: store.apiKeys.filter((key) => key.organizationId === actor.organizationId).length,
      providerReadinessChecks: store.providerHealthChecks.length,
      promptRiskEvents: store.promptRiskEvents.filter((event) => event.organizationId === actor.organizationId).length,
      secretScanEvents: store.secretScanEvents.filter((event) => event.organizationId === actor.organizationId).length
    };
  }

  private audit(actor: TrustActor, action: "LEGAL_ACTION" | "SECURITY_ACTION", entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
    auditService.record({
      actorId: actor.userId,
      organizationId: actor.organizationId,
      workspaceId: actor.workspaceId,
      action,
      entityType,
      entityId,
      result: "success",
      metadata,
      requestId: actor.requestId,
      ipAddress: actor.ip,
      userAgent: actor.userAgent
    });
  }
}

export const enterpriseTrustService = new EnterpriseTrustService();

function severityFor(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function promptSignals(content: string) {
  const checks: Array<[string, RegExp]> = [
    ["instruction_override", /ignore (all )?(previous|above) instructions/i],
    ["system_prompt_extraction", /system prompt|developer message|hidden instructions/i],
    ["tool_exfiltration", /send.*(secret|token|api key)|exfiltrate|leak/i],
    ["role_confusion", /you are now|act as an admin|bypass/i]
  ];
  return checks.filter(([, pattern]) => pattern.test(content)).map(([name]) => name);
}

function secretSignals(content: string) {
  const checks: Array<[string, RegExp]> = [
    ["private_key", /-----BEGIN (RSA |EC |OPENSSH |)?PRIVATE KEY-----/],
    ["provider_key", /\b(sk-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/],
    ["jwt", /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/],
    ["cloud_secret", /\b(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})\b/],
    ["generic_secret", /(password|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9_./+=-]{16,}/i]
  ];
  return checks.filter(([, pattern]) => pattern.test(content)).map(([name]) => name);
}

function sanitizePreview(content: string) {
  return redactSecrets(content).replace(/\s+/g, " ").slice(0, 500);
}

function redactSecrets(content: string) {
  return content
    .replace(/-----BEGIN (RSA |EC |OPENSSH |)?PRIVATE KEY-----[\s\S]+?-----END (RSA |EC |OPENSSH |)?PRIVATE KEY-----/g, "[redacted-private-key]")
    .replace(/\b(sk-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/g, "[redacted-provider-key]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted-jwt]")
    .replace(/\b(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})\b/g, "[redacted-cloud-key]")
    .replace(/(password|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9_./+=-]{16,}/gi, "$1=[redacted]");
}

function csv(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function reportSummary(reportType: StoredSecurityReport["reportType"]) {
  const labels = {
    security_posture: "Security posture readiness report generated from security events, scans, API keys, and audits.",
    audit_summary: "Audit summary generated from recorded admin and security actions.",
    api_key_usage_risk: "API key usage risk report generated from key settings and usage logs.",
    provider_readiness: "Provider readiness report generated from provider health checks without exposing secrets.",
    tenant_isolation: "Tenant isolation readiness report generated from organization-scoped records.",
    billing_security: "Billing security report generated from payment, invoice, and webhook records."
  };
  return labels[reportType];
}
