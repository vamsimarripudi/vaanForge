import assert from "node:assert/strict";
import { store } from "../database/in-memory-store";
import { operationsService } from "../modules/operations/operations.service";
import { agentTeamService } from "../modules/vaanforge/agent-team.service";

async function main() {
  const organizationId = `org-operations-${Date.now()}`;
  const superAdmin = { organizationId, userId: "super-admin", role: "Super Admin" };
  const admin = { organizationId, userId: "admin-user", role: "Admin" };

  await agentTeamService.team(organizationId);
  store.vaanForgeRuns.push({
    id: "run-store-id",
    runId: "run-ops-1",
    organizationId,
    ownerId: "super-admin",
    requestedById: "super-admin",
    source: "VFORMIX",
    status: "analyzing",
    priority: "HIGH",
    dueDate: new Date().toISOString(),
    inputRequirements: { productName: "Operations Center" },
    nextAction: "Continue planning.",
    activityHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const summary = operationsService.summary(superAdmin);
  assert.equal(summary.activeAgentRuns, 1);
  assert.ok(summary.resourceUtilization.memory);

  const fleet = operationsService.agents(superAdmin);
  assert.ok(Array.isArray(fleet.agents));
  assert.ok(fleet.agents.length >= 5);

  const products = operationsService.products(superAdmin);
  assert.ok(products.products.some((product) => product.product === "VaanForge AI"));

  const incident = operationsService.createIncident(superAdmin, {
    title: "Queue latency elevated",
    description: "Agent execution queue latency crossed the operations threshold.",
    severity: "SEV2",
    ownerId: "ops-owner",
    priority: "URGENT",
    impactedProducts: ["VaanForge AI"],
    nextAction: "Drain overloaded agents and inspect failed tasks."
  });
  assert.equal(incident.status, "open");
  const resolved = operationsService.updateIncident(superAdmin, incident.incidentId, { status: "resolved", resolution: "Queue drained.", nextAction: "Publish postmortem." });
  assert.equal(resolved?.status, "resolved");
  assert.ok(resolved?.timeline.length);

  assert.throws(() => operationsService.command(admin, { action: "emergency_stop", reason: "Emergency stop drill", confirmed: true, affectedServices: ["agent-fleet"] }), /Super Admin/);
  const command = operationsService.command(superAdmin, { action: "pause_agent_generation", reason: "Controlled incident response", confirmed: true, affectedServices: ["agent-fleet"] });
  assert.equal(command.action.status, "completed");

  const audit = operationsService.auditSearch(superAdmin, { query: "pause_agent_generation", limit: 20 });
  assert.ok(audit.some((log) => JSON.stringify(log).includes("pause_agent_generation")));

  const analytics = operationsService.analytics(superAdmin);
  assert.equal(analytics.organizationId, organizationId);
  const health = operationsService.health(superAdmin);
  assert.ok(["healthy", "degraded", "down"].includes(health.overallStatus));

  console.log("Enterprise operations command center test passed through live metrics, fleet status, product health, incidents, Super Admin controls, audit search, and analytics.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
