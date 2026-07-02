import assert from "node:assert/strict";
import { createId, store } from "../database/in-memory-store";
import { lifecycleService } from "../modules/onboarding/lifecycle.service";
import { operationsService } from "../modules/operations/operations.service";
import { releaseOperationsService } from "../modules/readiness/release-operations.service";
import { agentDeploymentService } from "../modules/vaanforge/agent-deployment.service";
import { vaanForgeService } from "../modules/vaanforge/vaanforge.service";

async function main() {
  const organizationId = `org-release-ops-${Date.now()}`;
  const actor = { organizationId, userId: "ops-admin", role: "Super Admin" };
  process.env.VMNEXUS_DEPLOY_TOKEN = "local-test-token";

  store.organizations.push({ id: organizationId, name: "Release Ops Org", suiteType: "VAANFORGE" as any, activePlan: "professional", billingStatus: "ACTIVE" as any, createdAt: new Date().toISOString() });
  store.workspaces.push({ id: "wks_release_ops", organizationId, suiteType: "VAANFORGE" as any, name: "Release Ops", enabledProducts: ["VAANFORGE" as any], status: "ACTIVE", createdAt: new Date().toISOString() });
  lifecycleService.complete({ ...actor, workspaceId: "wks_release_ops" });

  const release = releaseOperationsService.createRelease(actor, {
    version: "v1.0.0-rc9",
    title: "Release readiness",
    summary: "Release candidate with deployment safety and customer success readiness.",
    changelog: "Added release, monitoring, alerting, feedback, and postmortem workflows.",
    migrationNotes: "No destructive migrations.",
    knownIssues: ["External monitoring provider may require setup."],
    rollbackNotes: "Rollback to previous artifact and verify health checks.",
    deploymentChecklist: ["Preflight passed", "Rollback metadata present", "Health endpoint verified"],
    status: "draft"
  });
  assert.equal(release.status, "draft");
  assert.equal(releaseOperationsService.approveRelease(actor, release.releaseId).status, "approved");
  assert.equal(releaseOperationsService.publishRelease(actor, release.releaseId).status, "published");
  assert.equal(releaseOperationsService.archiveRelease(actor, release.releaseId).status, "archived");

  const run = await vaanForgeService.submit({
    organizationId,
    requestedById: actor.userId,
    requirement: {
      productName: "Release Ops",
      productSlug: `release-ops-${Date.now()}`,
      source: "BUILDER_PORTAL",
      ownerId: actor.userId,
      priority: "HIGH",
      dueDate: "2026-10-01",
      businessContext: {
        problemStatement: "Operators need safe release and deployment controls.",
        targetUsers: ["Admin"],
        goals: ["Preflight", "Deploy", "Rollback"],
        successMetrics: ["Unsafe deployment blocked"]
      },
      scope: {
        coreFeatures: [{ name: "Deployment safety", description: "Block unsafe deployments.", priority: "HIGH", acceptanceCriteria: ["Preflight blocks missing env"] }]
      },
      constraints: {
        approvedArchitecture: "Express TypeScript backend",
        designSystem: "VaanForge",
        routing: ["/admin/releases"],
        permissions: ["workspace:create"]
      }
    }
  });
  assert.ok(run && "runId" in run);
  const runId = run.runId;

  const blocked = await agentDeploymentService.create(organizationId, actor.userId, {
    runId,
    targetType: "DOCKER_SERVER",
    targetName: "Blocked target",
    environment: "staging",
    ownerId: actor.userId,
    priority: "HIGH",
    requiredEnvVars: ["MISSING_RELEASE_OPS_TOKEN"],
    config: { migrationsApplied: true, databaseUrl: "postgres://local", healthCheckUrl: "local://agent-run" },
    confirmedProduction: false
  });
  const blockedPreflight = await releaseOperationsService.deploymentPreflight(actor, blocked.deploymentId, agentDeploymentService.signature(actor.userId, blocked.deploymentId, "prepare"));
  assert.equal(blockedPreflight.status, "failed");

  const deployment = await agentDeploymentService.create(organizationId, actor.userId, {
    runId,
    targetType: "DOCKER_SERVER",
    targetName: "Safe target",
    environment: "staging",
    ownerId: actor.userId,
    priority: "HIGH",
    requiredEnvVars: ["VMNEXUS_DEPLOY_TOKEN"],
    config: { migrationsApplied: true, databaseUrl: "postgres://local", healthCheckUrl: "local://agent-run", rollbackArtifact: "artifact_previous" },
    confirmedProduction: false
  });
  const preflight = await releaseOperationsService.deploymentPreflight(actor, deployment.deploymentId, agentDeploymentService.signature(actor.userId, deployment.deploymentId, "prepare"));
  assert.equal(preflight.status, "ready");
  const deployed = await releaseOperationsService.deploymentDeploy(actor, deployment.deploymentId, { signature: agentDeploymentService.signature(actor.userId, deployment.deploymentId, "deploy") });
  assert.equal(deployed.status, "verifying");
  const verified = await releaseOperationsService.deploymentVerify(actor, deployment.deploymentId, agentDeploymentService.signature(actor.userId, deployment.deploymentId, "verify"));
  assert.equal(verified.status, "live");
  const rolledBack = await releaseOperationsService.deploymentRollback(actor, deployment.deploymentId, { signature: agentDeploymentService.signature(actor.userId, deployment.deploymentId, "rollback"), reason: "Rollback readiness drill" });
  assert.equal(rolledBack.status, "rolled_back");
  assert.ok(rolledBack.rollbacks.length);

  store.agentErrors.push({ id: createId("err"), errorId: createId("agent_error"), executionId: runId, organizationId, source: "qa", line: 12, reason: "Synthetic test failure evidence", fixAttempt: "Create alert", status: "open", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const monitoring = releaseOperationsService.monitoring(actor);
  assert.equal(monitoring.overview.errorRate >= 1, true);
  assert.notEqual(monitoring.overview.monitoringSetup, "fake");

  const rule = releaseOperationsService.createAlertRule(actor, { name: "High error rate", alertType: "high_error_rate", threshold: 1, enabled: true, severity: "high" });
  assert.equal(rule.enabled, true);
  const alerts = releaseOperationsService.alerts(actor);
  const alert = alerts.events.find((item) => item.ruleId === rule.ruleId);
  assert.ok(alert);
  assert.equal(releaseOperationsService.acknowledgeAlert(actor, alert!.alertId, "Investigating").alert.status, "acknowledged");
  assert.equal(releaseOperationsService.resolveAlert(actor, alert!.alertId).status, "resolved");

  const customer = releaseOperationsService.customerAccount(actor, organizationId);
  assert.equal(customer.healthScore > 0, true);
  assert.equal(releaseOperationsService.addCustomerNote(actor, organizationId, "Customer is ready for beta onboarding.").accountId, organizationId);
  assert.equal(releaseOperationsService.addCustomerTask(actor, organizationId, { title: "Schedule launch review", ownerId: actor.userId, dueDate: "2026-10-02" }).status, "open");

  const feedback = releaseOperationsService.createFeedback(actor, { type: "feature_request", title: "Release approval notes", description: "Expose release approval history in admin." });
  assert.equal(feedback.status, "submitted");
  assert.equal(releaseOperationsService.voteFeedback(actor, feedback.feedbackId).votes, 1);
  assert.equal(releaseOperationsService.updateFeedbackStatus(actor, feedback.feedbackId, "planned").status, "planned");

  const incident = releaseOperationsService.postmortem(actor, createIncident(actor).incidentId, {
    summary: "Deployment verification detected a health regression.",
    timeline: [{ at: new Date().toISOString(), event: "Regression detected" }],
    rootCause: "Misconfigured health check route.",
    impact: "Deployment delayed before customer exposure.",
    fix: "Corrected health check route and reran verify.",
    prevention: "Add preflight route validation.",
    owners: [actor.userId],
    actionItems: ["Add health route contract test"]
  });
  assert.equal(incident.status, "postmortem");

  console.log("Release operations readiness test passed for releases, preflight blocking, rollback metadata, monitoring, alerts, customer success, feedback, and postmortems.");
}

function createIncident(actor: { organizationId: string; userId: string; role: string }) {
  return operationsService.createIncident(actor, {
    title: "Deployment verification regression",
    description: "Deployment health verification failed during release readiness.",
    severity: "SEV2",
    ownerId: actor.userId,
    priority: "HIGH",
    impactedProducts: ["VaanForge"],
    nextAction: "Create postmortem after mitigation."
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
