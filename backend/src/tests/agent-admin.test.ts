import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { agentAdminService } from "../modules/vaanforge/agent-admin.service";
import { vaanForgeExecutionService } from "../modules/vaanforge/vaanforge-execution.service";
import { vaanForgeService } from "../modules/vaanforge/vaanforge.service";

async function main() {
  const organizationId = `org-agent-admin-${Date.now()}`;
  const suffix = Date.now();
  const actorId = "founder-user";
  const phaseOne = await vaanForgeService.submit({
    organizationId,
    requestedById: actorId,
    requirement: {
      productName: "Agent Admin Dashboard",
      productSlug: `agent-admin-dashboard-${suffix}`,
      source: "VFORMIX",
      ownerId: actorId,
      priority: "HIGH",
      dueDate: "2026-08-01",
      businessContext: {
        problemStatement: "Admins need to monitor and approve every VaanForge run visually.",
        targetUsers: ["Admin", "Founder"],
        goals: ["Expose run summary", "Support approvals"],
        successMetrics: ["Summary counts are real", "Actions are audited"]
      },
      scope: {
        coreFeatures: [
          {
            name: "Visual dashboard",
            description: "Show live agent run state and approval actions.",
            priority: "HIGH",
            acceptanceCriteria: ["Summary APIs return real counts"]
          }
        ]
      },
      constraints: {
        approvedArchitecture: "KRAVIA Express TypeScript backend with Next dashboard",
        designSystem: "KRAVIA design-system package",
        routing: ["/admin/agent", "/api/admin/agent/summary"],
        permissions: ["audit:read", "workspace:create"]
      }
    }
  });
  assert.ok(phaseOne?.runId);

  const execution = await vaanForgeExecutionService.submit({
    organizationId,
    requestedById: actorId,
    phaseOneRunId: phaseOne!.runId,
    validationCommands: [
      { checkName: "lint", command: "node", args: ["-e", "process.exit(0)"] },
      { checkName: "type-check", command: "node", args: ["-e", "process.exit(0)"] },
      { checkName: "tests", command: "node", args: ["-e", "process.exit(0)"] },
      { checkName: "build", command: "node", args: ["-e", "process.exit(0)"] }
    ]
  });
  assert.ok(execution?.executionId);

  const summary = await agentAdminService.summary(organizationId);
  assert.equal(summary.totalRuns >= 2, true);
  assert.equal(summary.completedRuns >= 1, true);
  assert.equal(summary.averageValidationSuccessRate >= 0 && summary.averageValidationSuccessRate <= 100, true);

  const runs = await agentAdminService.runs(organizationId);
  assert.ok(runs.some((run) => run.runId === phaseOne!.runId));
  assert.ok(runs.some((run) => run.runId === execution!.executionId));

  const blocked = await agentAdminService.action({
    organizationId,
    actorId,
    runId: execution!.executionId,
    action: "block",
    reason: "Manual review"
  });
  assert.equal(blocked?.status, "blocked");

  const logs = await agentAdminService.logs(organizationId, execution!.executionId);
  assert.ok(logs.some((log) => log.step === "approval.execution_blocked"));

  for (const file of execution?.files || []) {
    const absolutePath = resolve(__dirname, "../../..", file.path);
    if (existsSync(absolutePath)) {
      rmSync(absolutePath, { force: true });
    }
    const parent = dirname(absolutePath);
    if (parent.includes(`agent-admin-dashboard-${suffix}`) || parent.includes(phaseOne!.runId)) {
      rmSync(parent, { recursive: true, force: true });
    }
  }

  console.log("Agent admin API test passed through summary, run list, action workflow, and audit logs.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
