import assert from "node:assert/strict";
import { vformixAgentService } from "../modules/vformix-agent/vformix-agent.service";

async function main() {
  const organizationId = `org-vformix-agent-${Date.now()}`;
  const actorId = "founder-user";
  const formId = "project-intake";
  const submissionId = `sub-${Date.now()}`;

  const config = await vformixAgentService.updateConfig(organizationId, actorId, formId, {
    enabled: true,
    ownerId: actorId,
    priority: "HIGH",
    dueDate: "2026-08-30",
    status: "active"
  });
  assert.equal(config.enabled, true);

  const mappings = await vformixAgentService.updateMapping(organizationId, actorId, formId, {
    mappings: [
      { formFieldKey: "productName", agentFieldPath: "productName", required: true, normalizer: "text" },
      { formFieldKey: "productSlug", agentFieldPath: "productSlug", required: true, normalizer: "slug" },
      { formFieldKey: "problemStatement", agentFieldPath: "businessContext.problemStatement", required: true, normalizer: "text" },
      { formFieldKey: "targetUsers", agentFieldPath: "businessContext.targetUsers", required: true, normalizer: "list" },
      { formFieldKey: "goals", agentFieldPath: "businessContext.goals", required: true, normalizer: "list" },
      { formFieldKey: "successMetrics", agentFieldPath: "businessContext.successMetrics", required: true, normalizer: "list" },
      { formFieldKey: "coreFeatures", agentFieldPath: "scope.coreFeatures", required: true, normalizer: "list" },
      { formFieldKey: "ownerId", agentFieldPath: "ownerId", required: true, normalizer: "text" },
      { formFieldKey: "dueDate", agentFieldPath: "dueDate", required: true, normalizer: "date" },
      { formFieldKey: "priority", agentFieldPath: "priority", required: false, normalizer: "priority", fallbackValue: "HIGH" }
    ]
  });
  assert.equal(mappings.length, 10);

  const triggers = await vformixAgentService.updateTriggers(organizationId, actorId, formId, {
    triggers: [
      { triggerType: "submission", enabled: true, requiresApproval: true },
      { triggerType: "manual", enabled: true, requiresApproval: false },
      { triggerType: "approval", enabled: true, requiresApproval: true },
      { triggerType: "template_selection", enabled: true, requiresApproval: true }
    ]
  });
  assert.equal(triggers.filter((trigger) => trigger.enabled).length, 4);

  const failed = await vformixAgentService.runFromSubmission({
    organizationId,
    actorId,
    formId,
    submissionId: `${submissionId}-missing`,
    triggerType: "manual",
    rawSubmission: { productName: "Missing Fields" }
  });
  assert.equal(failed.status, "failed");
  assert.ok(failed.missingFields.length > 0);

  const successful = await vformixAgentService.runFromSubmission({
    organizationId,
    actorId,
    formId,
    submissionId,
    triggerType: "manual",
    rawSubmission: {
      productName: "VFormix CRM Builder",
      productSlug: "vformix-crm-builder",
      problemStatement: "Teams need a CRM generated from VFormix submissions with approvals and audit logs.",
      targetUsers: "Admin, Sales",
      goals: "Create CRM, Track approvals",
      successMetrics: "Blueprint generated, Approval required",
      coreFeatures: [
        {
          name: "Lead intake",
          description: "Map submitted customer fields into CRM lead workflows.",
          priority: "HIGH",
          acceptanceCriteria: ["Submission produces an audited blueprint"]
        }
      ],
      ownerId: actorId,
      priority: "HIGH",
      dueDate: "2026-08-30"
    }
  });
  assert.equal(successful.status, "blueprint_generated");
  assert.ok(successful.runId);
  assert.ok(successful.cleanedAgentInput);

  const duplicate = await vformixAgentService.runFromSubmission({
    organizationId,
    actorId,
    formId,
    submissionId,
    triggerType: "submission",
    rawSubmission: { productName: "Duplicate" }
  });
  assert.equal(duplicate.status, "blocked");
  assert.match(duplicate.errorMessage || "", /already has a linked agent run/);

  assert.equal(vformixAgentService.verifyWebhookToken("wrong-token"), false);

  console.log("VFormix agent integration test passed through config, mapping, triggers, run creation, duplicate protection, and webhook token checks.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
