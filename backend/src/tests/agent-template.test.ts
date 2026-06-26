import assert from "node:assert/strict";
import { agentTemplateService } from "../modules/vaanforge/agent-template.service";

async function main() {
  const organizationId = `org-agent-template-${Date.now()}`;
  const actorId = "founder-user";

  const marketplace = await agentTemplateService.marketplace(organizationId);
  assert.equal(marketplace.length, 8);
  assert.ok(marketplace.every((template) => template.status === "published"));

  const custom = await agentTemplateService.create(organizationId, actorId, {
    name: "Operations Portal Template",
    slug: `operations-portal-${Date.now()}`,
    category: "Operations",
    description: "Operations portal with work queues, approvals, audit logs, notifications, and execution dashboards.",
    stack: ["Next.js App Router", "Express TypeScript API", "Prisma", "PostgreSQL"],
    requiredInputs: [
      { key: "productName", label: "Product name", inputType: "text", required: true },
      { key: "targetUsers", label: "Target users", inputType: "list", required: true },
      { key: "primaryGoal", label: "Primary goal", inputType: "textarea", required: true },
      { key: "ownerId", label: "Owner", inputType: "user", required: true },
      { key: "dueDate", label: "Due date", inputType: "date", required: true }
    ],
    optionalInputs: [],
    includedScreens: ["Operations overview", "Approvals", "Audit trail"],
    includedApis: ["GET /api/v1/operations", "POST /api/v1/operations"],
    databaseModels: ["OperationItem", "Approval", "AuditEvent"],
    designTokens: ["colors", "spacing", "radius", "typography"],
    securityRules: ["Authenticated admin APIs", "Role-based permissions", "Input validation"],
    validationRules: ["Architecture validation", "Design system validation", "Required fields validation", "Security validation", "Build/lint/type-check validation"],
    priority: "HIGH",
    changelog: "Initial operations portal template."
  });
  assert.equal(custom.status, "draft");

  const published = await agentTemplateService.publish(organizationId, actorId, custom.templateId);
  assert.equal(published?.status, "published");

  const versions = await agentTemplateService.versions(organizationId, custom.templateId);
  assert.ok(versions.length >= 2);
  assert.ok(versions.some((version) => version.releaseStatus === "released"));

  const run = await agentTemplateService.use(organizationId, actorId, custom.templateId, {
    productName: "Operations Portal",
    targetUsers: ["Admin", "Operations"],
    primaryGoal: "Coordinate operating work with approvals and audit visibility.",
    ownerId: actorId,
    dueDate: "2026-08-15"
  });
  assert.equal(run?.status, "completed");
  assert.ok(run?.runId);

  await agentTemplateService.archive(organizationId, actorId, custom.templateId);
  await assert.rejects(
    () =>
      agentTemplateService.use(organizationId, actorId, custom.templateId, {
        productName: "Blocked Use",
        targetUsers: ["Admin"],
        primaryGoal: "Should not run",
        ownerId: actorId,
        dueDate: "2026-08-15"
      }),
    /Archived templates cannot be used/
  );

  console.log("Agent template marketplace test passed through defaults, quality gates, versioning, usage, and archive protection.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
