import { z } from "zod";
import { createId, store, type StoredReleaseNote } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { lifecycleService } from "../onboarding/lifecycle.service";
import { operationsService } from "../operations/operations.service";
import { providerReadinessService } from "../providers/provider-readiness.service";
import { agentDeploymentService, deploymentActionSchema } from "../vaanforge/agent-deployment.service";

type Actor = { organizationId: string; userId: string; role: string };

const releaseStatuses = ["draft", "release_candidate", "approved", "published", "deployed", "rolled_back", "archived"] as const;
const feedbackTypes = ["bug", "feature_request", "ux_issue", "billing_issue", "documentation_issue", "integration_request"] as const;
const feedbackStatuses = ["submitted", "triaged", "planned", "in_progress", "shipped", "closed"] as const;
const alertTypes = ["api_down", "high_error_rate", "queue_stuck", "ai_provider_unavailable", "billing_webhook_failure", "payment_failure_spike", "deployment_failure", "storage_failure", "database_unavailable", "redis_unavailable", "suspicious_api_key_usage"] as const;

export const releaseLifecycleSchema = z.object({
  version: z.string().min(2),
  title: z.string().min(3),
  summary: z.string().min(8),
  changelog: z.string().min(4),
  migrationNotes: z.string().min(4),
  knownIssues: z.array(z.string().min(2)).default([]),
  rollbackNotes: z.string().min(4),
  deploymentChecklist: z.array(z.string().min(2)).min(1),
  status: z.enum(releaseStatuses).default("draft")
});

export const releasePatchSchema = releaseLifecycleSchema.partial();

export const alertRuleSchema = z.object({
  name: z.string().min(3),
  alertType: z.enum(alertTypes),
  threshold: z.number().min(0).default(1),
  enabled: z.boolean().default(true),
  severity: z.enum(["low", "medium", "high", "critical"]).default("high")
});

export const alertPatchSchema = alertRuleSchema.partial();

export const feedbackSchema = z.object({
  type: z.enum(feedbackTypes),
  title: z.string().min(4),
  description: z.string().min(8),
  workspaceId: z.string().optional()
});

export const feedbackStatusSchema = z.object({ status: z.enum(feedbackStatuses) });
export const customerNoteSchema = z.object({ note: z.string().min(4) });
export const customerTaskSchema = z.object({ title: z.string().min(4), ownerId: z.string().min(2), dueDate: z.string().min(4) });
export const postmortemSchema = z.object({
  summary: z.string().min(8),
  timeline: z.array(z.object({ at: z.string(), event: z.string().min(3) })).min(1),
  rootCause: z.string().min(4),
  impact: z.string().min(4),
  fix: z.string().min(4),
  prevention: z.string().min(4),
  owners: z.array(z.string().min(2)).min(1),
  actionItems: z.array(z.string().min(3)).min(1)
});

export class ReleaseOperationsService {
  createRelease(actor: Actor, input: z.infer<typeof releaseLifecycleSchema>) {
    const parsed = releaseLifecycleSchema.parse(input);
    const now = new Date().toISOString();
    const release: StoredReleaseNote = {
      id: createId("rel"),
      releaseId: createId("release"),
      version: parsed.version,
      title: sanitize(parsed.title),
      summary: sanitize(parsed.summary),
      status: parsed.status,
      changelog: sanitize(parsed.changelog),
      migrationNotes: sanitize(parsed.migrationNotes),
      knownIssues: parsed.knownIssues.map(sanitize),
      rollbackNotes: sanitize(parsed.rollbackNotes),
      deploymentChecklist: parsed.deploymentChecklist.map(sanitize),
      approvalHistory: [],
      createdBy: actor.userId,
      createdAt: now,
      updatedAt: now
    };
    store.releaseNotes.push(release);
    store.releaseVersions.push({ id: createId("rv"), versionId: createId("release_version"), releaseId: release.releaseId, version: release.version, migrationNotes: release.migrationNotes || "", knownIssues: release.knownIssues || [], createdAt: now });
    store.releaseChangelogItems.push({ id: createId("rci"), itemId: createId("changelog"), releaseId: release.releaseId, type: "changed", description: release.changelog || release.summary, createdAt: now });
    this.audit(actor, "RELEASE_CREATED", "Release", release.releaseId);
    return release;
  }

  releases() {
    return store.releaseNotes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  release(releaseId: string) {
    const release = store.releaseNotes.find((item) => item.releaseId === releaseId);
    if (!release) throw new Error("Release not found.");
    return {
      ...release,
      versions: store.releaseVersions.filter((item) => item.releaseId === releaseId),
      changelogItems: store.releaseChangelogItems.filter((item) => item.releaseId === releaseId)
    };
  }

  updateRelease(actor: Actor, releaseId: string, input: z.infer<typeof releasePatchSchema>) {
    const release = store.releaseNotes.find((item) => item.releaseId === releaseId);
    if (!release) throw new Error("Release not found.");
    const parsed = releasePatchSchema.parse(input);
    Object.assign(release, {
      version: parsed.version ?? release.version,
      title: parsed.title ? sanitize(parsed.title) : release.title,
      summary: parsed.summary ? sanitize(parsed.summary) : release.summary,
      status: parsed.status ?? release.status,
      changelog: parsed.changelog ? sanitize(parsed.changelog) : release.changelog,
      migrationNotes: parsed.migrationNotes ? sanitize(parsed.migrationNotes) : release.migrationNotes,
      knownIssues: parsed.knownIssues ? parsed.knownIssues.map(sanitize) : release.knownIssues,
      rollbackNotes: parsed.rollbackNotes ? sanitize(parsed.rollbackNotes) : release.rollbackNotes,
      deploymentChecklist: parsed.deploymentChecklist ? parsed.deploymentChecklist.map(sanitize) : release.deploymentChecklist,
      updatedAt: new Date().toISOString()
    });
    this.audit(actor, "RELEASE_UPDATED", "Release", release.releaseId);
    return release;
  }

  approveRelease(actor: Actor, releaseId: string) {
    const release = this.updateRelease(actor, releaseId, { status: "approved" });
    release.approvalHistory = [...(release.approvalHistory || []), { at: new Date().toISOString(), actorId: actor.userId, decision: "approved" }];
    this.audit(actor, "RELEASE_APPROVED", "Release", release.releaseId);
    return release;
  }

  publishRelease(actor: Actor, releaseId: string) {
    const release = store.releaseNotes.find((item) => item.releaseId === releaseId);
    if (!release) throw new Error("Release not found.");
    if (!["approved", "published", "deployed"].includes(release.status)) throw new Error("Release must be approved before publish.");
    release.status = "published";
    release.releasedAt = new Date().toISOString();
    release.updatedAt = release.releasedAt;
    this.audit(actor, "RELEASE_PUBLISHED", "Release", release.releaseId);
    return release;
  }

  archiveRelease(actor: Actor, releaseId: string) {
    const release = this.updateRelease(actor, releaseId, { status: "archived" });
    this.audit(actor, "RELEASE_ARCHIVED", "Release", release.releaseId);
    return release;
  }

  async deploymentPreflight(actor: Actor, deploymentId: string, signature: string) {
    return agentDeploymentService.prepare(actor.organizationId, actor.userId, deploymentId, signature);
  }

  async deploymentDeploy(actor: Actor, deploymentId: string, input: z.infer<typeof deploymentActionSchema>) {
    return agentDeploymentService.deploy(actor.organizationId, actor.userId, deploymentId, input);
  }

  async deploymentVerify(actor: Actor, deploymentId: string, signature: string) {
    return agentDeploymentService.verify(actor.organizationId, actor.userId, deploymentId, signature);
  }

  async deploymentRollback(actor: Actor, deploymentId: string, input: z.infer<typeof deploymentActionSchema>) {
    const detail = await agentDeploymentService.detail(actor.organizationId, deploymentId);
    const hasRollbackMetadata = detail?.releases?.some((release: any) => release.rollbackMetadata);
    if (!hasRollbackMetadata) throw new Error("Rollback metadata is required before rollback.");
    return agentDeploymentService.rollback(actor.organizationId, actor.userId, deploymentId, input);
  }

  monitoring(actor: Actor) {
    const health = operationsService.health(actor);
    const queues = operationsService.queues(actor);
    const deployments = operationsService.deployments(actor);
    const providerReadiness = providerReadinessService.readiness();
    const webhookFailures = store.razorpayWebhookEvents.filter((event) => !event.processed || !event.signatureVerified).length;
    const errors = [...store.agentErrors.filter((item) => item.organizationId === actor.organizationId), ...store.factoryErrors.filter((item) => item.organizationId === actor.organizationId)];
    return {
      overview: {
        apiLatency: health.resources.apiLatencyMs,
        errorRate: errors.length,
        databaseHealth: health.checks.find((item) => item.service === "database")?.status ?? "unknown",
        queueHealth: queues.overallStatus,
        workerHealth: health.resources.backgroundWorkers.active >= 0 ? "healthy" : "unknown",
        aiProviderHealth: providerReadiness.totals.missingSecret ? "degraded" : "healthy",
        billingWebhookStatus: webhookFailures ? "degraded" : "healthy",
        storageStatus: health.resources.storage.generatedFiles >= 0 ? "healthy" : "unknown",
        deploymentHealth: deployments.overallStatus,
        monitoringSetup: process.env.SENTRY_DSN || process.env.ANALYTICS_WRITE_KEY ? "connected" : "setup_required"
      },
      services: health.checks,
      queues,
      errors,
      providers: providerReadiness.providers
    };
  }

  alerts(actor: Actor) {
    this.evaluateAlertRules(actor);
    return {
      rules: store.alertRules.filter((item) => item.organizationId === actor.organizationId),
      events: store.alertEvents.filter((item) => item.organizationId === actor.organizationId),
      notifications: store.alertNotifications.filter((item) => item.organizationId === actor.organizationId),
      acknowledgements: store.alertAcknowledgements.filter((item) => item.organizationId === actor.organizationId)
    };
  }

  createAlertRule(actor: Actor, input: z.infer<typeof alertRuleSchema>) {
    const parsed = alertRuleSchema.parse(input);
    const now = new Date().toISOString();
    const rule = { id: createId("alr"), ruleId: createId("alert_rule"), organizationId: actor.organizationId, ...parsed, createdBy: actor.userId, createdAt: now, updatedAt: now };
    store.alertRules.push(rule);
    this.audit(actor, "ALERT_RULE_CREATED", "AlertRule", rule.ruleId);
    return rule;
  }

  updateAlertRule(actor: Actor, ruleId: string, input: z.infer<typeof alertPatchSchema>) {
    const rule = store.alertRules.find((item) => item.organizationId === actor.organizationId && item.ruleId === ruleId);
    if (!rule) throw new Error("Alert rule not found.");
    Object.assign(rule, alertPatchSchema.parse(input), { updatedAt: new Date().toISOString() });
    this.audit(actor, "ALERT_RULE_UPDATED", "AlertRule", rule.ruleId);
    return rule;
  }

  acknowledgeAlert(actor: Actor, alertId: string, note?: string) {
    const alert = store.alertEvents.find((item) => item.organizationId === actor.organizationId && item.alertId === alertId);
    if (!alert) throw new Error("Alert not found.");
    alert.status = "acknowledged";
    alert.updatedAt = new Date().toISOString();
    const acknowledgement = { id: createId("ack"), acknowledgementId: createId("alert_ack"), alertId, organizationId: actor.organizationId, actorId: actor.userId, note: note ? sanitize(note) : undefined, createdAt: new Date().toISOString() };
    store.alertAcknowledgements.push(acknowledgement);
    this.audit(actor, "ALERT_ACKNOWLEDGED", "AlertEvent", alert.alertId);
    return { alert, acknowledgement };
  }

  resolveAlert(actor: Actor, alertId: string) {
    const alert = store.alertEvents.find((item) => item.organizationId === actor.organizationId && item.alertId === alertId);
    if (!alert) throw new Error("Alert not found.");
    alert.status = "resolved";
    alert.updatedAt = new Date().toISOString();
    this.audit(actor, "ALERT_RESOLVED", "AlertEvent", alert.alertId);
    return alert;
  }

  customerSuccessOverview(actor: Actor) {
    const accounts = this.customerSuccessAccounts(actor);
    return {
      accounts: accounts.length,
      onboardingCompleted: accounts.filter((item) => item.milestones.onboardingCompletion).length,
      firstProjectCreated: accounts.filter((item) => item.milestones.firstProjectCreated).length,
      firstDeployment: accounts.filter((item) => item.milestones.firstDeployment).length,
      churnRiskHigh: accounts.filter((item) => item.churnRisk === "high").length,
      upgradeOpportunities: accounts.filter((item) => item.upgradeOpportunity).length
    };
  }

  customerSuccessAccounts(actor: Actor) {
    return store.organizations.map((organization) => this.customerAccount(actor, organization.id)).filter((account) => actor.role === "Super Admin" || account.organizationId === actor.organizationId);
  }

  customerAccount(actor: Actor, accountId: string) {
    const organization = store.organizations.find((item) => item.id === accountId);
    if (!organization) throw new Error("Account not found.");
    const accountActor = { ...actor, organizationId: accountId };
    const analytics = lifecycleService.workspaceAnalytics(accountActor);
    const onboarding = store.onboardingProgress.find((item) => item.organizationId === accountId);
    const blueprintGenerated = store.factoryBlueprints.some((item) => item.organizationId === accountId) || store.vaanForgeOutputs.some((item) => item.runId && store.vaanForgeRuns.some((run) => run.organizationId === accountId && run.runId === item.runId));
    const firstDeployment = store.agentDeployments.some((item) => item.organizationId === accountId && ["live", "rolled_back"].includes(item.status));
    const supportTickets = store.supportTickets.filter((item) => item.organizationId === accountId);
    const planStatus = store.customerSubscriptions.find((item) => item.organizationId === accountId)?.status ?? organization.billingStatus;
    const score = this.customerHealthScore({ onboardingCompleted: onboarding?.status === "completed", projects: analytics.projects, deployments: analytics.deployments, supportTickets: supportTickets.length, planStatus });
    return {
      accountId,
      organizationId: accountId,
      name: organization.name,
      healthScore: score,
      churnRisk: score < 45 ? "high" : score < 70 ? "medium" : "low",
      upgradeOpportunity: analytics.creditsUsed > 0 && analytics.billing.planId === "free",
      milestones: {
        onboardingCompletion: onboarding?.status === "completed",
        firstProjectCreated: analytics.projects > 0,
        firstBlueprintGenerated: blueprintGenerated,
        firstDeployment
      },
      usage: analytics,
      supportTickets: supportTickets.length,
      planStatus,
      notes: store.customerSuccessNotes.filter((item) => item.accountId === accountId),
      tasks: store.customerSuccessTasks.filter((item) => item.accountId === accountId)
    };
  }

  addCustomerNote(actor: Actor, accountId: string, note: string) {
    this.customerAccount(actor, accountId);
    const item = { id: createId("csn"), noteId: createId("cs_note"), organizationId: actor.organizationId, accountId, actorId: actor.userId, note: sanitize(note), createdAt: new Date().toISOString() };
    store.customerSuccessNotes.push(item);
    this.audit(actor, "CUSTOMER_SUCCESS_NOTE", "CustomerAccount", accountId);
    return item;
  }

  addCustomerTask(actor: Actor, accountId: string, input: z.infer<typeof customerTaskSchema>) {
    this.customerAccount(actor, accountId);
    const parsed = customerTaskSchema.parse(input);
    const item = { id: createId("cst"), taskId: createId("cs_task"), organizationId: actor.organizationId, accountId, ownerId: parsed.ownerId, title: sanitize(parsed.title), dueDate: parsed.dueDate, status: "open" as const, createdAt: new Date().toISOString() };
    store.customerSuccessTasks.push(item);
    this.audit(actor, "CUSTOMER_SUCCESS_TASK", "CustomerAccount", accountId);
    return item;
  }

  createFeedback(actor: Partial<Actor>, input: z.infer<typeof feedbackSchema>) {
    const parsed = feedbackSchema.parse(input);
    const now = new Date().toISOString();
    const feedback = { id: createId("fdb"), feedbackId: createId("feedback"), organizationId: actor.organizationId, workspaceId: parsed.workspaceId, userId: actor.userId, type: parsed.type, title: sanitize(parsed.title), description: sanitize(parsed.description), status: "submitted" as const, votes: 0, createdAt: now, updatedAt: now };
    store.feedbackItems.push(feedback);
    return feedback;
  }

  feedback(actor: Partial<Actor>) {
    return store.feedbackItems.filter((item) => !actor.organizationId || item.organizationId === actor.organizationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  voteFeedback(actor: Partial<Actor>, feedbackId: string) {
    const feedback = store.feedbackItems.find((item) => item.feedbackId === feedbackId && (!actor.organizationId || item.organizationId === actor.organizationId));
    if (!feedback) throw new Error("Feedback not found.");
    const existing = store.feedbackVotes.find((item) => item.feedbackId === feedbackId && item.userId === actor.userId);
    if (!existing) {
      store.feedbackVotes.push({ id: createId("fdv"), voteId: createId("feedback_vote"), feedbackId, organizationId: actor.organizationId, userId: actor.userId, createdAt: new Date().toISOString() });
      feedback.votes += 1;
      feedback.updatedAt = new Date().toISOString();
    }
    return feedback;
  }

  updateFeedbackStatus(actor: Actor, feedbackId: string, status: z.infer<typeof feedbackStatusSchema>["status"]) {
    const feedback = store.feedbackItems.find((item) => item.feedbackId === feedbackId);
    if (!feedback) throw new Error("Feedback not found.");
    feedback.status = status;
    feedback.updatedAt = new Date().toISOString();
    this.audit(actor, "FEEDBACK_TRIAGED", "Feedback", feedback.feedbackId);
    return feedback;
  }

  postmortem(actor: Actor, incidentId: string, input: z.infer<typeof postmortemSchema>) {
    const parsed = postmortemSchema.parse(input);
    const incident = operationsService.updateIncident(actor, incidentId, {
      status: "postmortem",
      rootCause: parsed.rootCause,
      resolution: parsed.fix,
      postmortem: JSON.stringify({ summary: parsed.summary, timeline: parsed.timeline, impact: parsed.impact, fix: parsed.fix, prevention: parsed.prevention, owners: parsed.owners, actionItems: parsed.actionItems }),
      nextAction: "Track postmortem action items to completion."
    });
    if (!incident) throw new Error("Incident not found.");
    this.audit(actor, "POSTMORTEM_CREATED", "OperationsIncident", incidentId);
    return incident;
  }

  private evaluateAlertRules(actor: Actor) {
    const monitoring = this.monitoring(actor);
    for (const rule of store.alertRules.filter((item) => item.organizationId === actor.organizationId && item.enabled)) {
      const value = this.alertValue(rule.alertType, monitoring);
      if (value < rule.threshold) continue;
      const open = store.alertEvents.find((item) => item.organizationId === actor.organizationId && item.ruleId === rule.ruleId && item.status !== "resolved");
      if (open) continue;
      const now = new Date().toISOString();
      const event = { id: createId("ale"), alertId: createId("alert"), ruleId: rule.ruleId, organizationId: actor.organizationId, status: "open" as const, message: `${rule.name} threshold reached.`, evidence: { alertType: rule.alertType, value, threshold: rule.threshold }, createdAt: now, updatedAt: now };
      store.alertEvents.push(event);
      store.alertNotifications.push({ id: createId("aln"), notificationId: createId("alert_notification"), alertId: event.alertId, organizationId: actor.organizationId, channel: "in_app", status: "queued", createdAt: now });
    }
  }

  private alertValue(alertType: string, monitoring: ReturnType<ReleaseOperationsService["monitoring"]>) {
    if (alertType === "api_down") return monitoring.overview.databaseHealth === "down" ? 1 : 0;
    if (alertType === "high_error_rate") return monitoring.overview.errorRate;
    if (alertType === "queue_stuck") return monitoring.queues.failedTasks + (monitoring.queues.latencyMs > 5000 ? 1 : 0);
    if (alertType === "ai_provider_unavailable") return monitoring.overview.aiProviderHealth === "degraded" ? 1 : 0;
    if (alertType === "billing_webhook_failure") return monitoring.overview.billingWebhookStatus === "degraded" ? 1 : 0;
    if (alertType === "deployment_failure") return monitoring.overview.deploymentHealth === "degraded" ? 1 : 0;
    if (alertType === "storage_failure") return monitoring.overview.storageStatus === "unknown" ? 1 : 0;
    return 0;
  }

  private customerHealthScore(input: { onboardingCompleted: boolean; projects: number; deployments: number; supportTickets: number; planStatus: string }) {
    let score = 35;
    if (input.onboardingCompleted) score += 20;
    if (input.projects > 0) score += 15;
    if (input.deployments > 0) score += 15;
    if (["active", "ACTIVE", "TRIAL"].includes(input.planStatus)) score += 10;
    score -= Math.min(20, input.supportTickets * 5);
    return Math.max(0, Math.min(100, score));
  }

  private audit(actor: Actor, action: string, entityType: string, entityId: string) {
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: "SECURITY_ACTION", entityType, entityId, metadata: { readinessAction: action } });
  }
}

function sanitize(value: string) {
  return value.replace(/secret|token|password|api[_ -]?key/gi, "[masked]");
}

export const releaseOperationsService = new ReleaseOperationsService();
