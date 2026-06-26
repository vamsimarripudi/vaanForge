import assert from "node:assert/strict";
import { enterpriseService } from "../modules/enterprise/enterprise.service";

async function main() {
  const orgA = `org-enterprise-a-${Date.now()}`;
  const orgB = `org-enterprise-b-${Date.now()}`;
  const actorA = { organizationId: orgA, userId: "customer-a", role: "Customer" };
  const actorB = { organizationId: orgB, userId: "customer-b", role: "Customer" };

  const pricing = enterpriseService.publicPricing();
  assert.ok(pricing.length >= 6);
  assert.ok(pricing.every((plan) => !("razorpayKeySecret" in plan)));

  const workspaceA = enterpriseService.workspace(actorA);
  const workspaceB = enterpriseService.workspace(actorB);
  assert.notEqual(workspaceA.workspaceId, workspaceB.workspaceId);
  assert.equal(workspaceA.organizationId, orgA);

  const updated = enterpriseService.updateWorkspace(actorA, { name: "Enterprise Builder", ssoReady: true, retentionDays: 365 });
  assert.equal(updated.name, "Enterprise Builder");

  const team = enterpriseService.team(actorA);
  assert.ok(team.roles.length >= 2);
  const invite = enterpriseService.invite(actorA, { email: "teammate@example.com", roleId: team.roles[0].roleId });
  assert.equal(invite.status, "pending");

  const exportRequest = enterpriseService.exportData(actorA, { exportScope: ["profile", "projects", "billing"] });
  assert.equal(exportRequest.status, "open");
  const deleteRequest = enterpriseService.deleteRequest(actorA, { reason: "Customer requested account data deletion after export." });
  assert.equal(deleteRequest.status, "open");

  const auditLogs = enterpriseService.auditLogs(actorA);
  assert.ok(auditLogs.some((log) => log.action === "workspace.initialized"));
  assert.equal(enterpriseService.auditLogs(actorB).some((log) => log.organizationId === orgA), false);

  const security = enterpriseService.securityReport(orgA);
  assert.ok(Array.isArray(security.checks));
  assert.ok(security.checks.every((check) => check.evidence));
  const compliance = enterpriseService.complianceReport(orgA);
  assert.ok(compliance.records.some((record) => record.recordType === "export"));
  const reliability = enterpriseService.reliabilityReport(orgA);
  assert.ok(reliability.checks.some((check) => check.checkName === "backup_strategy"));
  const launch = enterpriseService.launchReadiness(orgA);
  assert.equal(launch.launchAllowed, false);
  assert.ok(launch.checks.some((check) => check.category === "reliability" && check.status === "failed"));

  console.log("Enterprise launch test passed through public pricing safety, tenant isolation, workspace/team controls, data requests, audit logs, and evidence-backed readiness reports.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
