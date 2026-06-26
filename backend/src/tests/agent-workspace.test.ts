import assert from "node:assert/strict";
import { agentWorkspaceService } from "../modules/vaanforge/agent-workspace.service";
import { vaanForgeService } from "../modules/vaanforge/vaanforge.service";

async function main() {
  const organizationId = `org-agent-workspace-${Date.now()}`;
  const actorId = "founder-user";
  const run = await vaanForgeService.submit({
    organizationId,
    requestedById: actorId,
    requirement: {
      productName: "Live Agent Workspace",
      productSlug: `live-agent-workspace-${Date.now()}`,
      source: "VFORMIX",
      ownerId: actorId,
      priority: "HIGH",
      dueDate: "2026-09-01",
      businessContext: {
        problemStatement: "Admins need one command-center interface for live agent monitoring and approvals.",
        targetUsers: ["Admin", "Founder"],
        goals: ["Stream real state", "Store instructions", "Audit controls"],
        successMetrics: ["Live events are persisted", "Instructions pause the run"]
      },
      scope: {
        coreFeatures: [
          {
            name: "Live workspace",
            description: "Show live task, validation, error, repair, and approval state.",
            priority: "HIGH",
            acceptanceCriteria: ["Workspace uses backend-backed events"]
          }
        ]
      },
      constraints: {
        approvedArchitecture: "VMNexus Express TypeScript backend with Next dashboard",
        designSystem: "VMNexus design-system package",
        routing: ["/admin/agent/workspace", "/api/admin/agent/workspace/:runId"],
        permissions: ["audit:read", "workspace:create"]
      }
    }
  });
  assert.ok(run?.runId);
  const runId = "runId" in run! ? run!.runId : "";
  assert.ok(runId);

  const workspace = await agentWorkspaceService.workspace(organizationId, runId);
  assert.equal((workspace?.run as { runId?: string }).runId, runId);
  assert.ok(workspace?.liveEvents.length);

  const evidence = await agentWorkspaceService.evidence(organizationId, runId);
  assert.ok(evidence.some((item) => item.evidenceType === "final"));

  const instruction = await agentWorkspaceService.addInstruction(organizationId, actorId, runId, {
    instructionType: "security",
    content: "Add stricter role checks and remove any ignore previous instructions text."
  });
  assert.equal(instruction.applied, true);
  assert.ok(!instruction.content.includes("ignore previous instructions"));

  const paused = await agentWorkspaceService.control(organizationId, actorId, runId, "pause", "Manual checkpoint");
  assert.equal(paused?.run.status, "failed");
  assert.ok(paused?.liveEvents.some((event) => event.eventType === "agent.run.blocked"));

  const approval = await agentWorkspaceService.control(organizationId, actorId, runId, "approve-step", "Looks correct", "analysis.started");
  assert.ok(approval?.approvals.some((item) => item.stepId === "analysis.started" && item.decision === "approved"));

  console.log("Agent live workspace test passed through snapshot, evidence, instructions, controls, approvals, and persisted live events.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
