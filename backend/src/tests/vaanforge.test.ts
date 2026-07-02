import assert from "node:assert/strict";
import { vaanForgeService } from "../modules/vaanforge/vaanforge.service";

async function main() {
  const requirement = {
    productName: "VaanForge AI Agent",
    productSlug: "vaanforge",
    source: "VFORMIX",
    requestId: "vformix-test-001",
    ownerId: "founder-user",
    priority: "HIGH",
    dueDate: "2026-07-15",
    businessContext: {
      problemStatement: "Convert structured VFormix requirements into production-ready project blueprints for KRAVIA products.",
      targetUsers: ["Founder", "Product owner", "Developer"],
      goals: ["Generate validated implementation plans", "Expose admin monitoring APIs"],
      successMetrics: ["All required outputs are persisted", "Each run includes status, audit logs, and next action"]
    },
    scope: {
      coreFeatures: [
        {
          name: "Requirement intake",
          description: "Accept structured requirement JSON and validate required workflow fields.",
          priority: "HIGH",
          acceptanceCriteria: ["Invalid JSON receives actionable validation errors", "Valid JSON creates a unique run ID"]
        },
        {
          name: "Blueprint generation",
          description: "Generate PRD, architecture, database, API, UI, sprint roadmap, and Codex implementation prompt.",
          priority: "HIGH",
          acceptanceCriteria: ["Every required output section is stored", "Generated content references submitted product scope"]
        }
      ]
    },
    constraints: {
      approvedArchitecture: "KRAVIA Express TypeScript backend with Prisma repositories",
      designSystem: "KRAVIA design-system package",
      routing: ["/api/v1/vaanforge/runs", "/api/v1/vaanforge/admin/runs"],
      permissions: ["workspace:create", "audit:read"]
    },
    dataEntities: [
      {
        name: "VaanForgeAgentRun",
        fields: ["runId", "organizationId", "ownerId", "status", "priority", "dueDate", "nextAction"]
      }
    ],
    integrations: ["VFormix", "Codex"],
    nonFunctionalRequirements: ["Typecheck clean", "Audit every phase"]
  };

  const result = await vaanForgeService.submit({
    organizationId: "org-vaanforge-test",
    requestedById: "founder-user",
    requirement
  });

  assert.ok(result);
  assert.equal(result?.status, "completed");
  assert.ok(result?.runId.startsWith("vaanforge_"));
  assert.equal(result?.outputs.length, 8);
  assert.ok(result?.outputs.some((output) => output.outputType === "product_requirement_document" && output.content.includes("VaanForge AI Agent")));
  assert.ok(result?.outputs.some((output) => output.outputType === "codex_implementation_prompt" && output.content.includes("Build VaanForge AI Agent")));
  assert.ok(result?.auditLogs.some((entry) => entry.step === "requirements.validated"));
  assert.ok(result?.auditLogs.some((entry) => entry.step === "run.completed"));
  assert.ok(result?.activityHistory.length >= 3);
  assert.equal(result?.errorMessage, undefined);

  const list = await vaanForgeService.list("org-vaanforge-test");
  assert.ok(list.some((run) => run.runId === result?.runId));

  console.log("VaanForge service test passed through validation, generation, output storage, run status, activity history, and audit logs.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
