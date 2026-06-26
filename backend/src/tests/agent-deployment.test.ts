import assert from "node:assert/strict";
import { agentDeploymentService } from "../modules/vaanforge/agent-deployment.service";
import { vaanForgeService } from "../modules/vaanforge/vaanforge.service";

async function main() {
  const organizationId = `org-agent-deployment-${Date.now()}`;
  const actorId = "founder-user";
  process.env.VMNEXUS_DEPLOY_TOKEN = "local-test-token";
  const run = await vaanForgeService.submit({
    organizationId,
    requestedById: actorId,
    requirement: {
      productName: "Deployment Agent",
      productSlug: `deployment-agent-${Date.now()}`,
      source: "VFORMIX",
      ownerId: actorId,
      priority: "HIGH",
      dueDate: "2026-10-01",
      businessContext: {
        problemStatement: "Admins need safe deployment readiness, release, health, and rollback workflows.",
        targetUsers: ["Admin", "DevOps"],
        goals: ["Prepare release", "Verify health", "Rollback safely"],
        successMetrics: ["Readiness blocks missing config", "Health check recorded"]
      },
      scope: {
        coreFeatures: [
          {
            name: "Deployment pipeline",
            description: "Prepare, deploy, verify, monitor, and roll back releases safely.",
            priority: "HIGH",
            acceptanceCriteria: ["Deployment never proceeds when readiness fails"]
          }
        ]
      },
      constraints: {
        approvedArchitecture: "VMNexus Express TypeScript backend with Next dashboard",
        designSystem: "VMNexus design-system package",
        routing: ["/admin/agent/deployments", "/api/admin/agent/deployments"],
        permissions: ["audit:read", "workspace:create"]
      }
    }
  });
  assert.ok(run && "runId" in run);
  const runId = "runId" in run ? run.runId : "";

  const blocked = await agentDeploymentService.create(organizationId, actorId, {
    runId,
    targetType: "DOCKER_SERVER",
    targetName: "Missing Env Docker",
    environment: "staging",
    ownerId: actorId,
    priority: "HIGH",
    requiredEnvVars: ["MISSING_DEPLOY_TOKEN"],
    config: { migrationsApplied: true, databaseUrl: "postgres://local", healthCheckUrl: "local://agent-run" },
    confirmedProduction: false
  });
  const blockedSignature = agentDeploymentService.signature(actorId, blocked.deploymentId, "prepare");
  const blockedPrepared = await agentDeploymentService.prepare(organizationId, actorId, blocked.deploymentId, blockedSignature);
  assert.equal(blockedPrepared.status, "failed");
  assert.ok(blockedPrepared.checks.some((check) => check.checkName === "environment_variables" && check.status === "failed"));

  const deployment = await agentDeploymentService.create(organizationId, actorId, {
    runId,
    targetType: "DOCKER_SERVER",
    targetName: "Docker Server",
    environment: "staging",
    ownerId: actorId,
    priority: "HIGH",
    requiredEnvVars: ["VMNEXUS_DEPLOY_TOKEN"],
    config: { migrationsApplied: true, databaseUrl: "postgres://local", healthCheckUrl: "local://agent-run", deployToken: "should-be-masked" },
    confirmedProduction: false
  });
  assert.equal(JSON.stringify(deployment.target).includes("should-be-masked"), false);

  const prepareSignature = agentDeploymentService.signature(actorId, deployment.deploymentId, "prepare");
  const ready = await agentDeploymentService.prepare(organizationId, actorId, deployment.deploymentId, prepareSignature);
  assert.equal(ready.status, "ready");
  assert.ok(ready.checks.every((check) => check.status === "passed"));

  const deploySignature = agentDeploymentService.signature(actorId, deployment.deploymentId, "deploy");
  const deploying = await agentDeploymentService.deploy(organizationId, actorId, deployment.deploymentId, { signature: deploySignature });
  assert.equal(deploying.status, "verifying");

  const verifySignature = agentDeploymentService.signature(actorId, deployment.deploymentId, "verify");
  const live = await agentDeploymentService.verify(organizationId, actorId, deployment.deploymentId, verifySignature);
  assert.equal(live.status, "live");
  assert.ok(live.healthChecks.some((check) => check.status === "healthy"));

  const rollbackSignature = agentDeploymentService.signature(actorId, deployment.deploymentId, "rollback");
  const rolledBack = await agentDeploymentService.rollback(organizationId, actorId, deployment.deploymentId, { signature: rollbackSignature, reason: "Rollback drill" });
  assert.equal(rolledBack.status, "rolled_back");
  assert.ok(rolledBack.rollbacks.length);

  console.log("Agent deployment test passed through readiness blocking, signed deploy, health verification, secret masking, and rollback.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
