import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { vaanForgeExecutionService } from "../modules/vaanforge/vaanforge-execution.service";
import { vaanForgeService } from "../modules/vaanforge/vaanforge.service";

async function main() {
  const suffix = Date.now();
  const organizationId = `org-vaanforge-execution-${suffix}`;
  const requestedById = "founder-user";
  const phaseOne = await vaanForgeService.submit({
    organizationId,
    requestedById,
    requirement: {
      productName: "VaanForge Execution Test Agent",
      productSlug: `vaanforge-execution-${suffix}`,
      source: "VFORMIX",
      ownerId: requestedById,
      priority: "HIGH",
      dueDate: "2026-07-20",
      businessContext: {
        problemStatement: "Convert approved VaanForge blueprints into tracked implementation work with validation gates.",
        targetUsers: ["Founder", "Developer"],
        goals: ["Create executable task graph", "Track files and validations"],
        successMetrics: ["All generated files tracked", "Validation gates recorded before completion"]
      },
      scope: {
        coreFeatures: [
          {
            name: "Execution graph",
            description: "Build executable tasks from an approved project blueprint.",
            priority: "HIGH",
            acceptanceCriteria: ["Tasks exist for frontend, backend, database, API, auth, dashboard, and tests"]
          }
        ]
      },
      constraints: {
        approvedArchitecture: "KRAVIA Express TypeScript backend with Prisma repositories",
        designSystem: "KRAVIA design-system package",
        routing: ["/api/v1/vaanforge/executions", "/api/v1/vaanforge/admin/executions"],
        permissions: ["workspace:create", "audit:read"]
      }
    }
  });

  assert.equal(phaseOne?.status, "completed");

  const execution = await vaanForgeExecutionService.submit({
    organizationId,
    requestedById,
    phaseOneRunId: phaseOne!.runId,
    validationCommands: [
      { checkName: "lint", command: "node", args: ["-e", "process.exit(0)"] },
      { checkName: "type-check", command: "node", args: ["-e", "process.exit(0)"] },
      { checkName: "tests", command: "node", args: ["-e", "process.exit(0)"] },
      { checkName: "build", command: "node", args: ["-e", "process.exit(0)"] }
    ]
  });

  assert.ok(execution);
  assert.equal(execution?.status, "completed");
  assert.equal(execution?.validationRuns.length, 4);
  assert.equal(execution?.validationRuns.every((run) => run.status === "passed"), true);
  assert.equal(execution?.errors.length, 0);
  assert.equal(execution?.tasks.length, 7);
  assert.equal(new Set(execution?.tasks.map((task) => task.module)).size, 7);
  assert.ok(execution?.files.length);
  assert.equal(execution?.files.every((file) => file.status === "written" || file.status === "skipped"), true);
  assert.equal(execution?.files.some((file) => file.status === "blocked"), false);
  assert.ok(execution?.activityLogs.some((log) => log.step === "execution.completed"));
  assert.ok(execution?.commits.some((commit) => commit.status === "skipped"));

  for (const file of execution?.files || []) {
    const absolutePath = resolve(__dirname, "../../..", file.path);
    if (existsSync(absolutePath)) {
      rmSync(absolutePath, { force: true });
    }
    const parent = dirname(absolutePath);
    if (parent.includes("vaanforge-execution-") || parent.includes(phaseOne!.runId)) {
      rmSync(parent, { recursive: true, force: true });
    }
  }

  console.log("VaanForge execution test passed through task graph, file tracking, validation gates, execution report, and completion rules.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
