import assert from "node:assert/strict";
import { agentTeamService } from "../modules/vaanforge/agent-team.service";
import { vaanForgeService } from "../modules/vaanforge/vaanforge.service";

async function main() {
  const organizationId = `org-agent-team-${Date.now()}`;
  const actorId = "founder-user";
  const run = await vaanForgeService.submit({
    organizationId,
    requestedById: actorId,
    requirement: {
      productName: "Multi Agent Team System",
      productSlug: `multi-agent-team-${Date.now()}`,
      source: "VFORMIX",
      ownerId: actorId,
      priority: "HIGH",
      dueDate: "2026-09-15",
      businessContext: {
        problemStatement: "VaanForge needs specialized agents to collaborate like a product team.",
        targetUsers: ["Admin", "Founder"],
        goals: ["Assign specialist agents", "Record handoffs", "Gate final approval"],
        successMetrics: ["Required reviews approved", "Final reviewer blocks missing reviews"]
      },
      scope: {
        coreFeatures: [
          {
            name: "Agent registry",
            description: "Register specialist agents and assign them to runs.",
            priority: "HIGH",
            acceptanceCriteria: ["Every task has a primary agent owner"]
          }
        ]
      },
      constraints: {
        approvedArchitecture: "KRAVIA Express TypeScript backend with Next dashboard",
        designSystem: "KRAVIA design-system package",
        routing: ["/admin/agent/team", "/api/admin/agent/team"],
        permissions: ["audit:read", "workspace:create"]
      }
    }
  });
  assert.ok(run && "runId" in run);
  const runId = "runId" in run ? run.runId : "";

  const roles = await agentTeamService.roles(organizationId);
  assert.equal(roles.length, 11);
  assert.ok(roles.some((role) => role.slug === "requirement"));
  assert.ok(roles.some((role) => role.slug === "reviewer"));
  assert.ok(roles.some((role) => role.slug === "security" && role.requiredReview));

  const assigned = await agentTeamService.assign(organizationId, actorId, runId, {});
  assert.equal(assigned.assignments.length, 11);

  const product = roles.find((role) => role.slug === "product-manager")!;
  const architect = roles.find((role) => role.slug === "architect")!;
  const handoff = await agentTeamService.handoff(organizationId, actorId, runId, {
    fromRoleId: product.roleId,
    toRoleId: architect.roleId,
    summary: "PRD scope is ready for architecture review.",
    evidence: { prd: "available" },
    nextAction: "Define service and database architecture."
  });
  assert.equal(handoff.handoffs.length, 1);

  const comment = await agentTeamService.comment(organizationId, actorId, runId, { roleId: product.roleId, message: "Acceptance criteria are ready.", visibility: "team" });
  assert.equal(comment.visibility, "team");

  const conflict = await agentTeamService.conflict(organizationId, actorId, runId, { raisedByRoleId: architect.roleId, reason: "Database ownership overlaps backend service boundaries.", nextAction: "Resolve model ownership before handoff." });
  assert.equal(conflict.status, "open");

  const rejectedFinal = await agentTeamService.finalReview(organizationId, actorId, runId, { decision: "approved", summary: "Attempt final approval too early." });
  assert.equal(rejectedFinal.decision, "rejected");
  assert.ok(rejectedFinal.missingReviews.length > 0);

  for (const role of roles.filter((item) => item.requiredReview)) {
    await agentTeamService.review(organizationId, actorId, runId, { roleId: role.roleId, decision: "approved", findings: [`${role.name} passed.`], nextAction: "Continue final review." });
  }
  const approvedFinal = await agentTeamService.finalReview(organizationId, actorId, runId, { decision: "approved", summary: "Required specialist reviews passed." });
  assert.equal(approvedFinal.decision, "approved");
  assert.equal(approvedFinal.missingReviews.length, 0);

  console.log("Agent team system test passed through registry, assignment, handoff, comments, conflicts, reviews, and final review gating.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
