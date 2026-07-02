import assert from "node:assert/strict";
import { createId, store } from "../database/in-memory-store";
import { platformIntelligenceService } from "../modules/platform-intelligence/platform-intelligence.service";

async function main() {
  const organizationId = `org-intelligence-${Date.now()}`;
  const actor = { organizationId, userId: "intel-admin", role: "Super Admin" };
  const now = new Date().toISOString();
  const workspaceId = `wks-${organizationId}`;
  const projectId = "project_intelligence";

  store.organizations.push({ id: organizationId, name: "Platform Intelligence Org", suiteType: "VAANFORGE" as any, activePlan: "professional", billingStatus: "ACTIVE" as any, createdAt: now });
  store.workspaces.push({ id: workspaceId, organizationId, suiteType: "VAANFORGE" as any, name: "Intelligence Workspace", enabledProducts: ["VAANFORGE" as any], status: "ACTIVE", createdAt: now });
  store.workspaceMembers.push({ id: createId("wm"), memberId: "member-intel", workspaceId, organizationId, userId: actor.userId, roleId: "admin", status: "active", invitedBy: actor.userId, joinedAt: now, createdAt: now, updatedAt: now } as any);
  store.factoryProjects.push({ id: createId("fp"), projectId, organizationId, ownerId: actor.userId, name: "Intelligence Project", productType: "saas", targetPlatform: "web", businessGoal: "Build intelligence", status: "building", priority: "HIGH", dueDate: now, complexityLevel: "enterprise", deploymentTarget: "docker", recommendedPlan: "professional", requirementQualityScore: 85, complexityScore: 45, buildSize: "large", nextAction: "Validate", activityHistory: [], createdAt: now, updatedAt: now });
  store.engineeringProjects.push({ id: createId("ep"), engineeringProjectId: "eng_intel", organizationId, projectId, projectOwnerId: actor.userId, techLeadId: actor.userId, productOwnerId: actor.userId, priority: "HIGH", status: "active", architectureVersion: "v1", releaseVersion: "v1.0.0", documentationStatus: "draft", securityStatus: "reviewing", riskScore: 75, completionPercent: 30, dependencies: [], technicalDebtScore: 40, createdBy: actor.userId, createdAt: now, updatedAt: now });
  store.factoryValidationRuns.push({ id: createId("fv"), validationId: "build_intel", projectId, organizationId, validationType: "build", status: "passed", evidence: {}, createdAt: now, updatedAt: now });
  store.architectureReviews.push({ id: createId("ar"), reviewId: "arch_intel", organizationId, projectId, architectureVersion: "v1", reviewerId: actor.userId, status: "approved", findings: [], evidence: {}, nextAction: "Monitor", createdAt: now, updatedAt: now });
  store.agentExecutionRuns.push({ id: createId("aer"), executionId: "exec_intel", phaseOneRunId: "run_intel", organizationId, ownerId: actor.userId, requestedById: actor.userId, status: "completed", priority: "HIGH", dueDate: now, approvedBlueprint: {}, taskGraph: {}, nextAction: "Monitor", activityHistory: [], createdAt: now, updatedAt: now });
  store.agentDeployments.push({ id: createId("dep"), deploymentId: "dep_intel_failed", runId: projectId, organizationId, ownerId: actor.userId, status: "failed", targetId: "target", releaseId: "rel", environment: "production", priority: "HIGH", dueDate: now, confirmedProduction: true, nextAction: "Rollback", activityHistory: [], createdAt: now, updatedAt: now });
  store.supportTickets.push({ id: createId("ticket"), organizationId, subject: "Urgent issue", priority: "HIGH", status: "OPEN", createdAt: now });
  store.securityEvents.push({ id: createId("se"), eventId: "sec_intel", organizationId, severity: "high", category: "api_key", message: "API key risk detected", evidence: { key: "masked" }, status: "open", riskScore: 80, createdAt: now });
  store.customerSubscriptions.push({ id: createId("sub"), subscriptionId: "sub_intel", organizationId, customerId: actor.userId, planId: "professional", billingCycle: "MONTHLY", status: "past_due", currentPeriodStart: now, currentPeriodEnd: now, renewalDate: now, cancelAtPeriodEnd: false, retryCount: 1, ownerId: actor.userId, priority: "HIGH", dueDate: now, nextAction: "Retry payment", activityHistory: [], createdAt: now, updatedAt: now });
  store.customerCreditWallets.push({ id: createId("wallet"), walletId: "wallet_intel", organizationId, customerId: actor.userId, balance: 120, reserved: 0, lifetimeCredits: 500, lifetimeDebits: 380, createdAt: now, updatedAt: now });
  store.customerUsageEvents.push({ id: createId("cue"), eventId: "storage_intel", organizationId, customerId: actor.userId, workspaceId, userId: actor.userId, metric: "storage_mb", quantity: 100 * 1024, unit: "mb", planId: "professional", creditsUsed: 0, source: "test", idempotencyKey: "storage-intel", status: "accepted", metadata: {}, createdAt: now });
  store.providerCostEvents.push({ id: createId("pce"), eventId: "cost_intel", organizationId, provider: "openai", requests: 20, inputTokens: 4000, outputTokens: 2000, latencyMs: 2000, errors: 2, estimatedCost: 800, creditsConsumed: 600, projectId, agentId: "agent_intel", createdAt: now });
  store.cloudJobs.push({ id: createId("job"), jobId: "job_failed_intel", organizationId, jobType: "build", status: "failed", ownerId: actor.userId, priority: "HIGH", dueDate: now, validationEvidence: {}, nextAction: "Retry", activityHistory: [], createdAt: now, updatedAt: now });
  store.cloudMessages.push({ id: createId("msg"), messageId: "email_failed_intel", organizationId, channel: "email", recipient: "user@example.com", status: "failed", provider: "ses", traceId: "trace", nextAction: "Retry", createdAt: now, updatedAt: now });
  store.developerApps.push({ id: createId("devapp"), appId: "app_intel", developerId: "dev_intel", organizationId, name: "Intel App", redirectUris: [], status: "active", createdAt: now, updatedAt: now } as any);
  store.apiKeys.push({ id: createId("key"), keyId: "key_expired_intel", developerId: "dev_intel", appId: "app_intel", organizationId, name: "Old key", keyHash: "hash", prefix: "vf_old", scopes: ["read"], status: "active", expiresAt: new Date(Date.now() - 86400000).toISOString(), ipAllowlist: [], createdAt: now, updatedAt: now });
  store.webhookEndpoints.push({ id: createId("wh"), webhookId: "webhook_failed_intel", developerId: "dev_intel", appId: "app_intel", organizationId, url: "https://example.com/webhook", events: ["test"], signingSecretHash: "hash", status: "failed", retryPolicy: {}, failureCount: 3, createdAt: now, updatedAt: now });
  store.cloudStorageObjects.push({ id: createId("cso"), objectId: "object_large_intel", organizationId, workspaceId, bucket: "uploads", key: "large.bin", objectType: "upload", sizeBytes: 80 * 1024 * 1024, contentType: "application/octet-stream", encrypted: true, version: 1, lifecyclePolicy: "standard", ownerId: actor.userId, createdAt: now, updatedAt: now });
  store.databaseMetrics.push({ id: createId("dbm"), metricId: "db_growth_intel", organizationId, metricName: "storage_growth", value: 90, unit: "percent", evidence: { growth: "high" }, createdAt: now });

  const center = platformIntelligenceService.center(actor);
  assert.equal(center.executiveHealth.score >= 0, true);
  assert.equal(Array.isArray(center.securityHealth.evidence.securityEvents), true);

  const healthScores = platformIntelligenceService.generateHealthScores(actor);
  assert.equal(healthScores.some((score) => score.subjectType === "workspace"), true);
  assert.equal(healthScores.every((score) => score.evidence), true);

  const repairs = platformIntelligenceService.selfHeal(actor);
  assert.equal(repairs.actions.some((action) => action.issueType === "failed_job" && action.status === "repaired"), true);
  assert.equal(store.cloudJobs.find((job) => job.jobId === "job_failed_intel")?.status, "queued");
  assert.equal(store.cloudMessages.find((message) => message.messageId === "email_failed_intel")?.status, "retrying");
  assert.equal(repairs.actions.some((action) => action.issueType === "broken_webhook" && action.status === "approval_required"), true);

  const predictions = platformIntelligenceService.predictions(actor);
  assert.equal(predictions.some((prediction) => prediction.predictionType === "low_credits"), true);
  assert.equal(predictions.some((prediction) => prediction.predictionType === "project_completion_delay"), true);

  const recommendations = platformIntelligenceService.recommendations(actor);
  assert.equal(recommendations.some((item) => item.recommendationType === "upgrade_plan"), true);
  assert.equal(recommendations.every((item) => item.evidence), true);

  const optimizer = platformIntelligenceService.aiCostOptimizer(actor);
  assert.equal(optimizer.providers[0].provider, "openai");
  assert.equal(optimizer.recommendations.some((item) => item.type === "lower_cost_model"), true);

  assert.equal(platformIntelligenceService.workspaceQuality(actor)[0].readinessScore > 0, true);
  assert.equal(platformIntelligenceService.projectQuality(actor)[0].qualityScore > 0, true);

  const inspection = platformIntelligenceService.runInspection(actor, { cadence: "daily" });
  assert.equal(inspection.run.status, "completed");
  assert.equal(inspection.results.some((item) => item.checkType === "failed_jobs"), true);
  assert.equal(inspection.results.some((item) => item.checkType === "large_files" && item.status === "warning"), true);

  const report = platformIntelligenceService.createReport(actor, { reportType: "executive", format: "CSV" });
  assert.equal(report.status, "READY");
  assert.equal(report.content.includes("score"), true);
  assert.equal(platformIntelligenceService.reports(actor).length, 1);

  console.log("Platform intelligence test passed for health scores, recommendations, repairs, predictions, inspections, quality, cost optimization, and reports.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
