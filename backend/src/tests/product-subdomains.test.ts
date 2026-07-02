import assert from "node:assert/strict";
import { store } from "../database/in-memory-store";
import { factoryService } from "../modules/factory/factory.service";
import { agentTeamService } from "../modules/vaanforge/agent-team.service";
import { vaanForgeService } from "../modules/vaanforge/vaanforge.service";
import { developerPlatformService } from "../modules/developer-platform/developer-platform.service";

async function main() {
  const organizationId = `org-product-subdomains-${Date.now()}`;
  const userId = `user-product-${Date.now()}`;
  const actor = { organizationId, userId, role: "Admin" };

  store.organizations.push({ id: organizationId, name: "Product Subdomain Test", suiteType: "VMETRON_SUITE", activePlan: "free", billingStatus: "TRIAL", createdAt: new Date().toISOString() });
  store.users.push({ id: userId, name: "Product User", email: `${userId}@example.com`, passwordHash: "hash", role: "Admin", organizationId, createdAt: new Date().toISOString() });

  const factoryProject = factoryService.create(actor, {
    name: "Factory Parity",
    productType: "SaaS",
    targetPlatform: "Web",
    businessGoal: "Build an auditable software factory workflow.",
    priority: "HIGH",
    complexityLevel: "standard",
    deploymentTarget: "KRAVIA Cloud"
  })!;
  assert.equal(factoryProject.status, "intake");

  factoryService.submitIntake(actor, factoryProject.projectId, {
    userRoles: ["Admin"],
    coreFeatures: ["Project dashboard", "Approval workflow"],
    integrations: [],
    budgetLevel: "standard",
    dataEntities: ["Project"],
    complianceNeeds: ["Audit logs"]
  });
  const blueprint = factoryService.generateBlueprint(actor, factoryProject.projectId);
  assert.ok(blueprint.prd.includes("Factory Parity"));
  assert.throws(() => factoryService.startBuild(actor, factoryProject.projectId), /Design approval is required/);
  factoryService.approveBlueprint(actor, factoryProject.projectId);
  factoryService.generateDesign(actor, factoryProject.projectId);
  factoryService.approveDesign(actor, factoryProject.projectId);
  const built = factoryService.startBuild(actor, factoryProject.projectId)!;
  assert.ok(built.taskGraph);
  assert.ok(built.files.length);
  assert.ok(built.qa.validations.length);

  const run = await vaanForgeService.submit({
    organizationId,
    requestedById: userId,
    requirement: {
      productName: "Agent Parity",
      productSlug: "agent-parity",
      ownerId: userId,
      priority: "HIGH",
      dueDate: new Date().toISOString(),
      businessContext: {
        problemStatement: "Validate persisted agent run parity for VaanForge subdomains.",
        targetUsers: ["Admin"],
        goals: ["Validate agent run parity"],
        successMetrics: ["Run and handoff records persist"]
      },
      scope: {
        coreFeatures: [{ name: "Agent run", description: "Create and review a persisted agent run.", priority: "HIGH", acceptanceCriteria: ["Run is stored"] }],
        outOfScope: []
      },
      constraints: {
        approvedArchitecture: "VaanForge modular backend",
        designSystem: "VaanForge product shell",
        routing: ["/agents/runs"],
        permissions: ["workspace:create", "audit:read"]
      },
      integrations: []
    }
  });
  assert.ok(run, "Agent run must be created");
  const roles = await agentTeamService.roles(organizationId);
  assert.ok(roles.some((role) => role.name === "Requirement Agent"));
  await agentTeamService.assign(organizationId, userId, run.runId, { roleIds: [roles[0].roleId, roles[1].roleId], ownerId: userId });
  await agentTeamService.handoff(organizationId, userId, run.runId, { fromRoleId: roles[0].roleId, toRoleId: roles[1].roleId, summary: "Requirements reviewed.", evidence: { runId: run.runId }, nextAction: "Continue architecture review." });
  assert.equal(store.agentHandoffs.some((handoff) => handoff.runId === run.runId), true);

  const app = developerPlatformService.createApp(actor, { name: "Parity App", description: "Developer portal parity test.", redirectUris: ["https://app.vaanforge.com/callback"], scopes: ["agent:read"] })!;
  const key = developerPlatformService.createKey(actor, { name: "Parity Key", appId: app.appId, scopes: ["agent:read"], ipAllowlist: [] });
  assert.notEqual(store.apiKeys.find((item) => item.keyId === key.key.keyId)?.keyHash, key.secret);
  const webhook = developerPlatformService.createWebhook(actor, { appId: app.appId, url: "https://example.com/webhook", events: ["workspace.event"], retryPolicy: { maxAttempts: 3 } });
  const test = developerPlatformService.testWebhook(actor, webhook.webhook.webhookId);
  assert.equal(test?.delivered, true);
  assert.ok(developerPlatformService.logs(actor).length >= 1);

  console.log("Product subdomain test passed for app projects, factory workflow locks, agent lifecycle, handoffs, developer keys, webhooks, usage, and logs.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
