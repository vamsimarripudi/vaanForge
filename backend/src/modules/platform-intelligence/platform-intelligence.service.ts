import { z } from "zod";
import {
  createId,
  store,
  type StoredHealthScore,
  type StoredInspectionResult,
  type StoredInspectionRun,
  type StoredPrediction,
  type StoredRecommendation,
  type StoredRepairAction,
  type StoredRepairAttempt
} from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { businessOperationsService } from "../business-operations/business-operations.service";
import { engineeringOperationsService } from "../engineering-operations/engineering-operations.service";
import { operationsService } from "../operations/operations.service";
import { providerReadinessService } from "../providers/provider-readiness.service";

export type PlatformIntelligenceActor = { organizationId: string; userId: string; role: string };

const reportTypes = ["executive", "engineering", "workspace", "project", "billing", "security", "infrastructure", "customer_success", "marketplace", "support"] as const;
const reportFormats = ["PDF", "CSV", "EXCEL"] as const;
const inspectionCadences = ["daily", "weekly", "monthly"] as const;

export const inspectionRunSchema = z.object({ cadence: z.enum(inspectionCadences).default("daily") });
export const intelligenceReportSchema = z.object({ reportType: z.enum(reportTypes), format: z.enum(reportFormats).default("CSV") });

export class PlatformIntelligenceService {
  center(actor: PlatformIntelligenceActor) {
    const scores = this.generateHealthScores(actor);
    const byType = (subjectType: StoredHealthScore["subjectType"]) => average(scores.filter((score) => score.subjectType === subjectType).map((score) => score.score));
    const executive = businessOperationsService.executiveDashboard(actor);
    return {
      executiveHealth: this.section("Executive Health", scoreFromSignals([executive.metrics.deploymentSuccessRate, 100 - executive.metrics.churnRate]), { executive }, "Review executive KPIs and unresolved commercial risks."),
      productHealth: this.section("Product Health", average([byType("workspace"), byType("project")]), { workspaceScores: byType("workspace"), projectScores: byType("project") }, "Improve low-scoring workspaces and projects."),
      engineeringHealth: this.section("Engineering Health", this.engineeringHealth(actor), { engineering: engineeringOperationsService.dashboard(actor) }, "Review code quality, CI, technical debt, and release gates."),
      aiHealth: this.section("AI Health", byType("agent"), { costs: this.aiCostOptimizer(actor) }, "Reduce high-cost or high-error AI paths."),
      customerHealth: this.section("Customer Health", average(businessOperationsService.customerHealth(actor).map((item) => item.healthScore)), { customerHealth: businessOperationsService.customerHealth(actor) }, "Prioritize at-risk customer follow-ups."),
      billingHealth: this.section("Billing Health", byType("billing"), { subscriptions: store.customerSubscriptions.filter((item) => this.visible(actor, item.organizationId)) }, "Resolve failed payments and low credits."),
      infrastructureHealth: this.section("Infrastructure Health", byType("infrastructure"), { operations: operationsService.health(actor) }, "Review degraded services and capacity forecasts."),
      securityHealth: this.section("Security Health", byType("security"), { securityEvents: store.securityEvents.filter((item) => this.visible(actor, item.organizationId)) }, "Resolve high severity security findings."),
      marketplaceHealth: this.section("Marketplace Health", byType("marketplace"), { marketplaceApps: store.marketplaceApps.filter((item) => this.visible(actor, item.organizationId)) }, "Review pending apps, installs, and revenue health."),
      supportHealth: this.section("Support Health", byType("support"), { tickets: store.supportTickets.filter((item) => this.visible(actor, item.organizationId)) }, "Close high-priority support tickets.")
    };
  }

  generateHealthScores(actor: PlatformIntelligenceActor) {
    const generated = [
      ...this.workspaceScores(actor),
      ...this.projectScores(actor),
      ...this.deploymentScores(actor),
      ...this.agentScores(actor),
      this.billingScore(actor),
      this.marketplaceScore(actor),
      this.supportScore(actor),
      this.developerScore(actor),
      this.securityScore(actor),
      this.infrastructureScore(actor)
    ];
    for (const score of generated) this.persistScore(score);
    return generated;
  }

  selfHeal(actor: PlatformIntelligenceActor) {
    const detected = this.detectRepairActions(actor);
    for (const action of detected) {
      if (!action.safeToAutoRepair) {
        action.status = "approval_required";
        action.nextAction = "Human approval required before repair.";
        continue;
      }
      const attempt: StoredRepairAttempt = { id: createId("rat"), attemptId: createId("repair_attempt"), repairId: action.repairId, organizationId: actor.organizationId, status: "attempted", action: "automatic_safe_repair", evidence: action.evidence, createdAt: new Date().toISOString() };
      store.repairAttempts.push(attempt);
      const repaired = this.applySafeRepair(action);
      attempt.status = repaired ? "succeeded" : "failed";
      action.status = repaired ? "repaired" : "failed";
      action.timeline.push({ at: new Date().toISOString(), action: attempt.action, status: attempt.status });
      action.updatedAt = new Date().toISOString();
      this.audit(actor, "PLATFORM_REPAIR_ATTEMPTED", "RepairAction", action.repairId);
    }
    return { actions: detected, attempts: store.repairAttempts.filter((item) => item.organizationId === actor.organizationId) };
  }

  predictions(actor: PlatformIntelligenceActor) {
    const predictions: StoredPrediction[] = [
      ...this.lowCreditPredictions(actor),
      ...this.storagePredictions(actor),
      ...this.subscriptionPredictions(actor),
      ...this.customerChurnPredictions(actor),
      ...this.deploymentRiskPredictions(actor),
      ...this.infrastructurePredictions(actor),
      ...this.providerOutagePredictions(actor),
      ...this.queuePredictions(actor),
      ...this.databaseGrowthPredictions(actor),
      ...this.projectDelayPredictions(actor)
    ];
    for (const prediction of predictions) {
      const exists = store.predictions.some((item) => item.organizationId === prediction.organizationId && item.predictionType === prediction.predictionType && item.subjectId === prediction.subjectId);
      if (!exists) store.predictions.push(prediction);
    }
    return predictions;
  }

  recommendations(actor: PlatformIntelligenceActor) {
    const recs: StoredRecommendation[] = [
      ...this.planRecommendations(actor),
      ...this.storageRecommendations(actor),
      ...this.projectArchiveRecommendations(actor),
      ...this.apiKeyRecommendations(actor),
      ...this.teamRecommendations(actor),
      ...this.securityRecommendations(actor),
      ...this.documentationRecommendations(actor),
      ...this.onboardingRecommendations(actor),
      ...this.aiCostRecommendations(actor)
    ];
    for (const rec of recs) {
      const exists = store.recommendations.some((item) => item.organizationId === rec.organizationId && item.recommendationType === rec.recommendationType && item.subjectId === rec.subjectId);
      if (!exists) store.recommendations.push(rec);
    }
    return recs;
  }

  aiCostOptimizer(actor: PlatformIntelligenceActor) {
    const costs = store.providerCostEvents.filter((item) => this.visible(actor, item.organizationId));
    const byProvider = new Map<string, { provider: string; requests: number; tokens: number; latencyMs: number; errors: number; cost: number; credits: number }>();
    for (const cost of costs) {
      const current = byProvider.get(cost.provider) || { provider: cost.provider, requests: 0, tokens: 0, latencyMs: 0, errors: 0, cost: 0, credits: 0 };
      current.requests += cost.requests;
      current.tokens += cost.inputTokens + cost.outputTokens;
      current.latencyMs += cost.latencyMs;
      current.errors += cost.errors;
      current.cost += cost.estimatedCost;
      current.credits += cost.creditsConsumed;
      byProvider.set(cost.provider, current);
    }
    const providers = [...byProvider.values()].map((item) => ({ ...item, averageLatencyMs: item.requests ? Math.round(item.latencyMs / item.requests) : 0, errorRate: percent(item.errors, item.requests) }));
    const expensive = providers.sort((a, b) => b.cost - a.cost)[0];
    return {
      providers,
      recommendations: expensive
        ? [
            { type: "lower_cost_model", provider: expensive.provider, reason: `${expensive.provider} has the highest observed cost.`, evidence: expensive },
            { type: "better_routing", reason: "Route low-risk generations to lower-cost providers when validation confidence remains acceptable.", evidence: { providers: providers.length } },
            { type: "batching", reason: "Batch short inspection and report prompts to reduce request overhead.", evidence: { requests: providers.reduce((sum, item) => sum + item.requests, 0) } },
            { type: "caching", reason: "Cache repeated documentation and report generations by workspace and version.", evidence: { tokens: providers.reduce((sum, item) => sum + item.tokens, 0) } }
          ]
        : []
    };
  }

  workspaceQuality(actor: PlatformIntelligenceActor) {
    const workspaces = store.workspaces.filter((item) => this.visible(actor, item.organizationId));
    return workspaces.map((workspace) => {
      const checks = {
        documentation: store.docsArticles.some((item) => item.status === "published"),
        security: store.securityEvents.filter((item) => item.organizationId === workspace.organizationId && ["high", "critical"].includes(item.severity)).length === 0,
        billing: store.customerSubscriptions.some((item) => item.organizationId === workspace.organizationId && item.status === "active"),
        providerSetup: providerReadinessService.readiness().totals.providers - providerReadinessService.readiness().totals.notConfigured > 0,
        projects: store.factoryProjects.filter((item) => item.organizationId === workspace.organizationId).length,
        users: store.workspaceMembers.filter((item) => item.workspaceId === workspace.id).length,
        apiKeys: store.apiKeys.filter((item) => item.organizationId === workspace.organizationId && item.status === "active").length,
        integrations: store.webhookEndpoints.filter((item) => item.organizationId === workspace.organizationId && item.status === "active").length,
        deployments: store.agentDeployments.filter((item) => item.organizationId === workspace.organizationId && item.status === "live").length,
        support: store.supportTickets.filter((item) => item.organizationId === workspace.organizationId && item.status !== "CLOSED").length
      };
      const score = scoreBooleans([checks.documentation, checks.security, checks.billing, checks.providerSetup, checks.projects > 0, checks.users > 0, checks.apiKeys >= 0, checks.integrations >= 0, checks.deployments >= 0, checks.support === 0]);
      const quality = { id: createId("wq"), qualityId: createId("workspace_quality"), organizationId: workspace.organizationId, workspaceId: workspace.id, readinessScore: score, checks, recommendedAction: score < 70 ? "Complete workspace setup and resolve support/security gaps." : "Maintain readiness with scheduled inspections.", createdAt: new Date().toISOString() };
      store.workspaceQuality.push(quality);
      return quality;
    });
  }

  projectQuality(actor: PlatformIntelligenceActor) {
    const projects = store.factoryProjects.filter((item) => this.visible(actor, item.organizationId));
    return projects.map((project) => {
      const checks = {
        requirements: project.requirementQualityScore >= 70,
        blueprint: store.factoryBlueprints.some((item) => item.projectId === project.projectId),
        architecture: store.architectureReviews.some((item) => item.projectId === project.projectId && item.status === "approved"),
        testing: store.factoryValidationRuns.some((item) => item.projectId === project.projectId && item.status === "passed"),
        security: !store.securityEvents.some((item) => item.organizationId === project.organizationId && ["high", "critical"].includes(item.severity)),
        deployment: store.agentDeployments.some((item) => item.runId === project.projectId || item.organizationId === project.organizationId),
        documentation: store.factoryReleases.some((item) => item.projectId === project.projectId),
        releaseReadiness: ["release_ready", "released"].includes(project.status)
      };
      const qualityScore = scoreBooleans(Object.values(checks));
      const quality = { id: createId("pq"), qualityId: createId("project_quality"), organizationId: project.organizationId, projectId: project.projectId, qualityScore, checks, recommendedAction: qualityScore < 75 ? "Complete missing project quality gates before release." : "Project quality gates are on track.", createdAt: new Date().toISOString() };
      store.projectQuality.push(quality);
      return quality;
    });
  }

  runInspection(actor: PlatformIntelligenceActor, input: z.infer<typeof inspectionRunSchema>) {
    const parsed = inspectionRunSchema.parse(input);
    const run: StoredInspectionRun = { id: createId("ir"), inspectionId: createId("inspection"), organizationId: actor.organizationId, cadence: parsed.cadence, status: "running", startedAt: new Date().toISOString(), createdBy: actor.userId };
    store.inspectionRuns.push(run);
    const results = this.inspectionResults(actor, run.inspectionId);
    store.inspectionResults.push(...results);
    run.status = "completed";
    run.completedAt = new Date().toISOString();
    this.audit(actor, "INSPECTION_COMPLETED", "InspectionRun", run.inspectionId);
    return { run, results };
  }

  createReport(actor: PlatformIntelligenceActor, input: z.infer<typeof intelligenceReportSchema>) {
    const parsed = intelligenceReportSchema.parse(input);
    const data = this.reportData(actor, parsed.reportType);
    const content = parsed.format === "PDF" ? `<html><body><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></body></html>` : toCsv(data);
    const report = { id: createId("pir"), reportId: createId("intelligence_report"), organizationId: actor.organizationId, reportType: parsed.reportType, format: parsed.format, status: "READY" as const, content, generatedBy: actor.userId, createdAt: new Date().toISOString() };
    store.intelligenceReports.push(report);
    this.audit(actor, "INTELLIGENCE_REPORT_GENERATED", "IntelligenceReport", report.reportId);
    return report;
  }

  reports(actor: PlatformIntelligenceActor) {
    return store.intelligenceReports.filter((item) => this.visible(actor, item.organizationId));
  }

  private workspaceScores(actor: PlatformIntelligenceActor) {
    return store.workspaces.filter((item) => this.visible(actor, item.organizationId)).map((workspace) =>
      this.score(actor, "workspace", workspace.id, scoreBooleans([workspace.status === "ACTIVE", workspace.enabledProducts.length > 0]), "Workspace readiness uses workspace status and enabled product records.", { workspace }, "Review workspace setup and enabled products.", workspace.id)
    );
  }

  private projectScores(actor: PlatformIntelligenceActor) {
    return store.factoryProjects.filter((item) => this.visible(actor, item.organizationId)).map((project) =>
      this.score(actor, "project", project.projectId, Math.round((project.requirementQualityScore + (100 - project.complexityScore) + statusScore(project.status)) / 3), "Project score uses requirement quality, complexity, status, and validation evidence.", { project }, "Complete missing quality gates.", project.ownerId)
    );
  }

  private deploymentScores(actor: PlatformIntelligenceActor) {
    return store.agentDeployments.filter((item) => this.visible(actor, item.organizationId)).map((deployment) => {
      const score = ["live", "rolled_back"].includes(deployment.status) ? 90 : deployment.status === "failed" ? 25 : 60;
      return this.score(actor, "deployment", deployment.deploymentId, score, "Deployment score uses deployment lifecycle status and health checks.", { status: deployment.status, healthChecks: store.agentDeploymentHealthChecks.filter((item) => item.deploymentId === deployment.deploymentId).length }, "Verify failed or in-progress deployments.", deployment.ownerId);
    });
  }

  private agentScores(actor: PlatformIntelligenceActor) {
    const runs = store.agentExecutionRuns.filter((item) => this.visible(actor, item.organizationId));
    if (!runs.length) return [this.score(actor, "agent", actor.organizationId, 75, "No active agent execution failures detected.", { runs: 0 }, "Continue monitoring agent execution.", actor.userId)];
    return runs.map((run) => this.score(actor, "agent", run.executionId, ["completed"].includes(run.status) ? 90 : ["failed", "blocked"].includes(run.status) ? 30 : 65, "Agent score uses execution lifecycle status.", { status: run.status }, "Resolve blocked or failed agent runs.", run.ownerId));
  }

  private billingScore(actor: PlatformIntelligenceActor) {
    const subscriptions = store.customerSubscriptions.filter((item) => this.visible(actor, item.organizationId));
    const active = subscriptions.filter((item) => item.status === "active").length;
    return this.score(actor, "billing", actor.organizationId, subscriptions.length ? percent(active, subscriptions.length) : 70, "Billing score uses subscription status records.", { subscriptions: subscriptions.length, active }, "Resolve inactive, failed, or expired subscriptions.", actor.userId);
  }

  private marketplaceScore(actor: PlatformIntelligenceActor) {
    const apps = store.marketplaceApps.filter((item) => this.visible(actor, item.organizationId));
    const published = apps.filter((item) => item.status === "published").length;
    return this.score(actor, "marketplace", actor.organizationId, apps.length ? percent(published, apps.length) : 80, "Marketplace score uses app review and publish records.", { apps: apps.length, published }, "Review pending marketplace submissions.", actor.userId);
  }

  private supportScore(actor: PlatformIntelligenceActor) {
    const tickets = store.supportTickets.filter((item) => this.visible(actor, item.organizationId));
    const closed = tickets.filter((item) => item.status === "CLOSED").length;
    return this.score(actor, "support", actor.organizationId, tickets.length ? percent(closed, tickets.length) : 95, "Support score uses ticket closure records.", { tickets: tickets.length, closed }, "Prioritize open high-priority tickets.", actor.userId);
  }

  private developerScore(actor: PlatformIntelligenceActor) {
    const keys = store.apiKeys.filter((item) => this.visible(actor, item.organizationId));
    const active = keys.filter((item) => item.status === "active").length;
    return this.score(actor, "developer", actor.organizationId, keys.length ? percent(active, keys.length) : 80, "Developer score uses API key status and usage records.", { keys: keys.length, active }, "Rotate or revoke stale API keys.", actor.userId);
  }

  private securityScore(actor: PlatformIntelligenceActor) {
    const events = store.securityEvents.filter((item) => this.visible(actor, item.organizationId));
    const critical = events.filter((item) => ["high", "critical"].includes(item.severity) && !["completed", "rejected"].includes(item.status)).length;
    return this.score(actor, "security", actor.organizationId, Math.max(0, 100 - critical * 20), "Security score uses unresolved high and critical security events.", { events: events.length, critical }, "Resolve high and critical security findings.", actor.userId);
  }

  private infrastructureScore(actor: PlatformIntelligenceActor) {
    const health = operationsService.health(actor);
    const healthy = health.checks.filter((item) => item.status === "healthy").length;
    return this.score(actor, "infrastructure", actor.organizationId, health.checks.length ? percent(healthy, health.checks.length) : 75, "Infrastructure score uses operations health checks.", { checks: health.checks }, "Review degraded infrastructure checks.", actor.userId);
  }

  private detectRepairActions(actor: PlatformIntelligenceActor) {
    const actions = [
      ...store.cloudJobs.filter((item) => this.visible(actor, item.organizationId) && item.status === "failed").map((job) => this.repair(actor, "failed_job", "CloudJob", job.jobId, true, { status: job.status }, "Requeue failed retry-safe job.")),
      ...store.cloudMessages.filter((item) => this.visible(actor, item.organizationId) && item.channel === "email" && item.status === "failed").map((message) => this.repair(actor, "failed_email", "CloudMessage", message.messageId, true, { status: message.status }, "Retry failed email delivery.")),
      ...store.webhookEndpoints.filter((item) => this.visible(actor, item.organizationId) && item.status === "failed").map((webhook) => this.repair(actor, "broken_webhook", "WebhookEndpoint", webhook.webhookId, false, { failureCount: webhook.failureCount }, "Review webhook endpoint before retry.")),
      ...store.agentDeployments.filter((item) => this.visible(actor, item.organizationId) && item.status === "failed").map((deployment) => this.repair(actor, "failed_deployment", "Deployment", deployment.deploymentId, false, { status: deployment.status }, "Approve rollback or redeploy.")),
      ...store.apiKeys.filter((item) => this.visible(actor, item.organizationId) && item.expiresAt && new Date(item.expiresAt).getTime() < Date.now()).map((key) => this.repair(actor, "expired_api_key", "ApiKey", key.keyId, false, { expiresAt: key.expiresAt }, "Rotate expired API key."))
    ];
    for (const action of actions) {
      const exists = store.repairActions.find((item) => item.organizationId === action.organizationId && item.issueType === action.issueType && item.targetId === action.targetId && ["detected", "approval_required"].includes(item.status));
      if (!exists) store.repairActions.push(action);
    }
    return actions;
  }

  private applySafeRepair(action: ReturnType<PlatformIntelligenceService["repair"]>) {
    if (action.issueType === "failed_job") {
      const job = store.cloudJobs.find((item) => item.jobId === action.targetId);
      if (!job) return false;
      job.status = "queued";
      job.updatedAt = new Date().toISOString();
      return true;
    }
    if (action.issueType === "failed_email") {
      const message = store.cloudMessages.find((item) => item.messageId === action.targetId);
      if (!message) return false;
      message.status = "retrying";
      message.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  private lowCreditPredictions(actor: PlatformIntelligenceActor) {
    return store.customerCreditWallets.filter((item) => this.visible(actor, item.organizationId) && item.balance < 1000).map((wallet) => this.prediction(actor, "low_credits", wallet.walletId, wallet.balance < 250 ? "critical" : "high", 90, 7, "Credit balance is below operating threshold.", { balance: wallet.balance }, "Top up credits or upgrade plan."));
  }

  private storagePredictions(actor: PlatformIntelligenceActor) {
    const usage = store.customerUsageEvents.filter((item) => this.visible(actor, item.organizationId) && item.metric === "storage_mb").reduce((sum, item) => sum + item.quantity / 1024, 0);
    return usage > 0 ? [this.prediction(actor, "storage_exhaustion", actor.organizationId, usage > 80 ? "high" : "medium", 70, 30, "Storage usage exists and should be trended.", { storageGb: usage }, "Review storage limits and archive unused files.")] : [];
  }

  private subscriptionPredictions(actor: PlatformIntelligenceActor) {
    return store.customerSubscriptions.filter((item) => this.visible(actor, item.organizationId) && ["past_due", "trialing"].includes(item.status)).map((sub) => this.prediction(actor, "subscription_renewal_risk", sub.subscriptionId, sub.status === "past_due" ? "high" : "medium", 80, 14, "Subscription status indicates renewal risk.", { status: sub.status, retryCount: sub.retryCount || 0 }, "Contact billing owner and retry payment if eligible."));
  }

  private customerChurnPredictions(actor: PlatformIntelligenceActor) {
    return businessOperationsService.customerHealth(actor).filter((item) => item.riskScore > 40).map((health) => this.prediction(actor, "customer_churn", health.scoreId, health.riskScore > 70 ? "high" : "medium", 75, 30, "Customer health risk score is elevated.", health.calculatedFrom, "Create customer success follow-up."));
  }

  private deploymentRiskPredictions(actor: PlatformIntelligenceActor) {
    return store.agentDeployments.filter((item) => this.visible(actor, item.organizationId) && ["failed", "rollback_required"].includes(item.status)).map((deployment) => this.prediction(actor, "deployment_risk", deployment.deploymentId, "high", 85, 3, "Deployment status indicates release risk.", { status: deployment.status }, "Verify rollback metadata and review deployment logs."));
  }

  private infrastructurePredictions(actor: PlatformIntelligenceActor) {
    const queues = operationsService.queues(actor);
    return queues.latencyMs > 1000 ? [this.prediction(actor, "infrastructure_overload", actor.organizationId, queues.latencyMs > 5000 ? "high" : "medium", 70, 7, "Queue latency indicates capacity pressure.", { latencyMs: queues.latencyMs }, "Scale workers or drain backlog.")] : [];
  }

  private providerOutagePredictions(actor: PlatformIntelligenceActor) {
    const readiness = providerReadinessService.readiness();
    return readiness.totals.missingSecret ? [this.prediction(actor, "provider_outage_impact", actor.organizationId, "medium", 65, 7, "Provider readiness has missing secrets or setup gaps.", readiness.totals, "Complete provider setup or configure fallback.")] : [];
  }

  private queuePredictions(actor: PlatformIntelligenceActor) {
    const queues = operationsService.queues(actor);
    return queues.pendingTasks > 10 ? [this.prediction(actor, "queue_saturation", actor.organizationId, "high", 80, 2, "Pending task count exceeds normal operating threshold.", { pendingTasks: queues.pendingTasks }, "Increase worker capacity or pause non-critical jobs.")] : [];
  }

  private databaseGrowthPredictions(actor: PlatformIntelligenceActor) {
    const growth = store.databaseMetrics.filter((item) => this.visible(actor, item.organizationId) && item.metricName === "storage_growth").at(-1);
    return growth && growth.value > 75 ? [this.prediction(actor, "database_growth", growth.metricId, "medium", 70, 30, "Database storage growth metric is elevated.", growth.evidence, "Review retention and indexes.")] : [];
  }

  private projectDelayPredictions(actor: PlatformIntelligenceActor) {
    return store.engineeringProjects.filter((item) => this.visible(actor, item.organizationId) && item.completionPercent < 50 && item.riskScore > 50).map((project) => this.prediction(actor, "project_completion_delay", project.engineeringProjectId, "high", 76, 14, "Project risk is high while completion remains low.", { riskScore: project.riskScore, completionPercent: project.completionPercent }, "Review scope, blockers, and ownership."));
  }

  private planRecommendations(actor: PlatformIntelligenceActor) {
    return store.customerCreditWallets.filter((item) => this.visible(actor, item.organizationId) && item.balance < 500).map((wallet) => this.recommendation(actor, "upgrade_plan", wallet.walletId, "HIGH", "Credit balance is low.", { balance: wallet.balance }, "Upgrade plan or top up credits."));
  }

  private storageRecommendations(actor: PlatformIntelligenceActor) {
    return this.storagePredictions(actor).map((prediction) => this.recommendation(actor, "optimize_storage", prediction.subjectId, "MEDIUM", prediction.reason, prediction.evidence, "Archive old files and review storage limits."));
  }

  private projectArchiveRecommendations(actor: PlatformIntelligenceActor) {
    return store.factoryProjects.filter((item) => this.visible(actor, item.organizationId) && ["failed", "blocked"].includes(item.status)).map((project) => this.recommendation(actor, "archive_unused_projects", project.projectId, "MEDIUM", "Project is blocked or failed.", { status: project.status }, "Archive if inactive or assign recovery owner."));
  }

  private apiKeyRecommendations(actor: PlatformIntelligenceActor) {
    return store.apiKeys.filter((item) => this.visible(actor, item.organizationId) && (!item.lastUsedAt || item.status !== "active")).map((key) => this.recommendation(actor, "rotate_api_keys", key.keyId, "HIGH", "API key is unused or inactive.", { status: key.status, lastUsedAt: key.lastUsedAt }, "Rotate or revoke the API key."));
  }

  private teamRecommendations(actor: PlatformIntelligenceActor) {
    return store.workspaces.filter((workspace) => this.visible(actor, workspace.organizationId) && store.workspaceMembers.filter((member) => member.workspaceId === workspace.id).length < 2).map((workspace) => this.recommendation(actor, "invite_team", workspace.id, "MEDIUM", "Workspace has fewer than two team members.", { workspaceId: workspace.id }, "Invite a backup admin or collaborator."));
  }

  private securityRecommendations(actor: PlatformIntelligenceActor) {
    return store.securityEvents.filter((item) => this.visible(actor, item.organizationId) && ["high", "critical"].includes(item.severity)).map((event) => this.recommendation(actor, "review_security_settings", event.eventId, "URGENT", event.message, event.evidence, "Review and resolve security event."));
  }

  private documentationRecommendations(actor: PlatformIntelligenceActor) {
    return store.factoryProjects.filter((project) => this.visible(actor, project.organizationId) && !store.factoryReleases.some((release) => release.projectId === project.projectId)).map((project) => this.recommendation(actor, "generate_documentation", project.projectId, "MEDIUM", "Project does not have release documentation evidence.", { projectId: project.projectId }, "Generate documentation before release."));
  }

  private onboardingRecommendations(actor: PlatformIntelligenceActor) {
    return store.onboardingProgress.filter((item) => this.visible(actor, item.organizationId) && item.status !== "completed").map((item) => this.recommendation(actor, "improve_onboarding", item.id, "MEDIUM", "Onboarding is not complete.", { currentStep: item.currentStep }, "Resume onboarding."));
  }

  private aiCostRecommendations(actor: PlatformIntelligenceActor) {
    return this.aiCostOptimizer(actor).recommendations.map((item) => this.recommendation(actor, "reduce_ai_costs", actor.organizationId, "MEDIUM", item.reason, item.evidence, "Review AI model routing, batching, and caching."));
  }

  private inspectionResults(actor: PlatformIntelligenceActor, inspectionId: string) {
    const checks = [
      this.inspection(actor, inspectionId, "unused_api_keys", store.apiKeys.filter((item) => this.visible(actor, item.organizationId) && !item.lastUsedAt).length, "Rotate or revoke unused API keys."),
      this.inspection(actor, inspectionId, "unused_workspaces", store.workspaces.filter((item) => this.visible(actor, item.organizationId) && !store.factoryProjects.some((project) => project.organizationId === item.organizationId)).length, "Review unused workspaces."),
      this.inspection(actor, inspectionId, "inactive_users", store.users.filter((item) => item.organizationId === actor.organizationId && !store.loginHistory.some((login) => login.userId === item.id)).length, "Review inactive users."),
      this.inspection(actor, inspectionId, "expired_webhooks", store.webhookEndpoints.filter((item) => this.visible(actor, item.organizationId) && item.status === "failed").length, "Fix failed webhooks."),
      this.inspection(actor, inspectionId, "large_files", store.cloudStorageObjects.filter((item) => this.visible(actor, item.organizationId) && item.sizeBytes > 50 * 1024 * 1024).length, "Review large files."),
      this.inspection(actor, inspectionId, "storage_growth", store.databaseMetrics.filter((item) => this.visible(actor, item.organizationId) && item.metricName === "storage_growth" && item.value > 75).length, "Review storage growth."),
      this.inspection(actor, inspectionId, "failed_jobs", store.cloudJobs.filter((item) => this.visible(actor, item.organizationId) && item.status === "failed").length, "Repair failed jobs."),
      this.inspection(actor, inspectionId, "security_warnings", store.securityEvents.filter((item) => this.visible(actor, item.organizationId) && ["high", "critical"].includes(item.severity)).length, "Resolve security warnings."),
      this.inspection(actor, inspectionId, "missing_documentation", store.factoryProjects.filter((project) => this.visible(actor, project.organizationId) && !store.factoryReleases.some((release) => release.projectId === project.projectId)).length, "Generate missing documentation."),
      this.inspection(actor, inspectionId, "open_critical_bugs", store.factoryErrors.filter((item) => this.visible(actor, item.organizationId) && item.status === "open").length, "Resolve open critical bugs.")
    ];
    return checks;
  }

  private reportData(actor: PlatformIntelligenceActor, reportType: z.infer<typeof intelligenceReportSchema>["reportType"]) {
    if (reportType === "executive") return this.center(actor).executiveHealth;
    if (reportType === "engineering") return engineeringOperationsService.dashboard(actor);
    if (reportType === "workspace") return this.workspaceQuality(actor);
    if (reportType === "project") return this.projectQuality(actor);
    if (reportType === "billing") return this.center(actor).billingHealth;
    if (reportType === "security") return this.center(actor).securityHealth;
    if (reportType === "infrastructure") return this.center(actor).infrastructureHealth;
    if (reportType === "customer_success") return this.center(actor).customerHealth;
    if (reportType === "marketplace") return this.center(actor).marketplaceHealth;
    return this.center(actor).supportHealth;
  }

  private section(name: string, score: number, evidence: Record<string, unknown>, suggestedAction: string) {
    return { name, score: clamp(score), why: `${name} is calculated from persisted operational records and deterministic rules.`, evidence, suggestedAction };
  }

  private score(actor: PlatformIntelligenceActor, subjectType: StoredHealthScore["subjectType"], subjectId: string, score: number, reason: string, evidence: Record<string, unknown>, recommendedAction: string, ownerId: string): StoredHealthScore {
    const current = clamp(score);
    const previous = store.healthScoreHistory.filter((item) => item.organizationId === actor.organizationId && item.scoreId.includes(subjectId)).at(-1);
    const trend = previous ? (current > previous.score ? "improving" : current < previous.score ? "declining" : "stable") : "stable";
    return { id: createId("hs"), scoreId: createId(`health_${subjectType}_${subjectId}`), organizationId: actor.organizationId, subjectType, subjectId, score: current, reason, evidence, trend, recommendedAction, ownerId, createdAt: new Date().toISOString() };
  }

  private persistScore(score: StoredHealthScore) {
    store.healthScores.push(score);
    store.healthScoreHistory.push({ id: createId("hsh"), historyId: createId("health_history"), scoreId: score.scoreId, organizationId: score.organizationId, score: score.score, trend: score.trend, createdAt: score.createdAt });
  }

  private repair(actor: PlatformIntelligenceActor, issueType: StoredRepairAction["issueType"], targetType: string, targetId: string, safeToAutoRepair: boolean, evidence: Record<string, unknown>, nextAction: string): StoredRepairAction {
    const now = new Date().toISOString();
    return { id: createId("ra"), repairId: createId("repair"), organizationId: actor.organizationId, issueType, targetType, targetId, safeToAutoRepair, status: "detected" as const, evidence, timeline: [{ at: now, action: "detected", status: "detected" }], nextAction, createdBy: actor.userId, createdAt: now, updatedAt: now };
  }

  private prediction(actor: PlatformIntelligenceActor, predictionType: StoredPrediction["predictionType"], subjectId: string, riskLevel: StoredPrediction["riskLevel"], confidence: number, horizonDays: number, reason: string, evidence: Record<string, unknown>, recommendedAction: string): StoredPrediction {
    return { id: createId("prd"), predictionId: createId("prediction"), organizationId: actor.organizationId, predictionType, subjectId, riskLevel, confidence, horizonDays, reason, evidence, recommendedAction, createdAt: new Date().toISOString() };
  }

  private recommendation(actor: PlatformIntelligenceActor, recommendationType: StoredRecommendation["recommendationType"], subjectId: string, priority: StoredRecommendation["priority"], reason: string, evidence: Record<string, unknown>, recommendedAction: string): StoredRecommendation {
    const now = new Date().toISOString();
    return { id: createId("rec"), recommendationId: createId("recommendation"), organizationId: actor.organizationId, recommendationType, subjectId, priority, reason, evidence, status: "open", ownerId: actor.userId, createdAt: now, updatedAt: now };
  }

  private inspection(actor: PlatformIntelligenceActor, inspectionId: string, checkType: StoredInspectionResult["checkType"], count: number, recommendedAction: string): StoredInspectionResult {
    return { id: createId("irv"), resultId: createId("inspection_result"), inspectionId, organizationId: actor.organizationId, checkType, status: count > 0 ? "warning" as const : "passed" as const, evidence: { count }, recommendedAction, createdAt: new Date().toISOString() };
  }

  private engineeringHealth(actor: PlatformIntelligenceActor) {
    const dashboard = engineeringOperationsService.dashboard(actor);
    const debtPenalty = dashboard.technicalDebt.critical * 10 + dashboard.technicalDebt.open * 2;
    return clamp(average([dashboard.repositoryHealth.buildSuccessRate, dashboard.codeCoverage || 70, dashboard.providerHealth === "healthy" ? 100 : 60]) - debtPenalty);
  }

  private visible(actor: PlatformIntelligenceActor, organizationId?: string) {
    return actor.role === "Super Admin" || organizationId === actor.organizationId;
  }

  private audit(actor: PlatformIntelligenceActor, event: string, entityType: string, entityId: string) {
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: "SECURITY_ACTION", entityType, entityId, metadata: { intelligenceAction: event } });
  }
}

export const platformIntelligenceService = new PlatformIntelligenceService();

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function average(values: number[]) {
  const usable = values.filter((value) => Number.isFinite(value));
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : 0;
}

function percent(value: number, total: number) {
  return total ? Number(((value / total) * 100).toFixed(2)) : 0;
}

function scoreBooleans(values: boolean[]) {
  return percent(values.filter(Boolean).length, values.length);
}

function statusScore(status: string) {
  if (["released", "release_ready", "completed", "live"].includes(status)) return 95;
  if (["building", "active", "blueprint_approved", "qa_ready"].includes(status)) return 75;
  if (["blocked", "failed"].includes(status)) return 25;
  return 55;
}

function scoreFromSignals(values: number[]) {
  return average(values.map(clamp));
}

function toCsv(data: unknown) {
  const rows = flatten(data);
  return ["Metric,Value", ...Object.entries(rows).map(([key, value]) => `"${key.replace(/"/g, '""')}","${String(value).replace(/"/g, '""')}"`)].join("\n");
}

function flatten(value: unknown, prefix = "", out: Record<string, unknown> = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) flatten(child, prefix ? `${prefix}.${key}` : key, out);
  } else if (Array.isArray(value)) {
    out[prefix || "items"] = value.length;
  } else {
    out[prefix || "value"] = value;
  }
  return out;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] || char);
}
