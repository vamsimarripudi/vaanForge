import assert from "node:assert/strict";
import { store } from "../database/in-memory-store";
import { billingService } from "../modules/billing/billing.service";
import { factoryService, type FactoryActor } from "../modules/factory/factory.service";

async function main() {
  const organizationId = `org-factory-${Date.now()}`;
  const actor: FactoryActor = { userId: "factory-customer@kravia.local", organizationId, role: "Admin" };
  const business = billingService.plans(organizationId).find((plan) => plan.tier === "business");
  assert.ok(business, "Business plan must be available for full factory release validation.");
  await billingService.subscribe({ organizationId, customerId: actor.userId, actorId: actor.userId, planId: business.planId, billingCycle: "MONTHLY" });

  const project = factoryService.create(actor, {
    name: "Autonomous customer onboarding platform",
    productType: "SaaS application",
    targetPlatform: "Web",
    businessGoal: "Reduce enterprise customer onboarding time from five days to one day with governed self-service workflows.",
    priority: "HIGH",
    complexityLevel: "standard",
    deploymentTarget: "KRAVIA Cloud"
  });
  assert.ok(project);
  assert.equal(project.status, "intake");

  const intake = factoryService.submitIntake(actor, project.projectId, {
    userRoles: ["Admin", "Customer"],
    coreFeatures: ["Workspace onboarding", "Approval workflow", "Audit dashboard"],
    integrations: ["Email"],
    budgetLevel: "Professional",
    deploymentTarget: "KRAVIA Cloud",
    dataEntities: ["Workspace", "User", "Approval", "AuditLog"],
    complianceNeeds: ["RBAC", "Tenant isolation", "Audit logs"]
  });
  assert.ok(intake);
  assert.equal(intake.status, "blueprint_ready");
  assert.equal((intake.questions || []).filter((question) => question.status === "open").length, 0);

  const blueprint = factoryService.generateBlueprint(actor, project.projectId);
  assert.equal(blueprint.status, "generated");
  assert.ok(blueprint.prd);
  assert.ok(blueprint.apiMap);

  const approvedBlueprint = factoryService.approveBlueprint(actor, project.projectId);
  assert.ok(approvedBlueprint);
  assert.equal(approvedBlueprint.status, "blueprint_approved");

  const design = factoryService.generateDesign(actor, project.projectId);
  assert.equal(design.status, "generated");
  assert.ok(design.themeTokens);
  assert.ok(design.accessibilityChecklist);

  const approvedDesign = factoryService.approveDesign(actor, project.projectId);
  assert.ok(approvedDesign);
  assert.equal(approvedDesign.status, "design_approved");

  const built = factoryService.startBuild(actor, project.projectId);
  assert.ok(built);
  assert.equal(built.status, "qa_ready");
  assert.ok((built.tasks || []).length >= 8);
  assert.ok((built.qa?.validations || []).every((run) => run.status === "passed"));
  assert.ok(factoryService.files(actor, project.projectId).every((file) => file.diffRequired));

  const release = factoryService.prepareRelease(actor, project.projectId);
  assert.equal(release.status, "ready");
  assert.ok(release.rollbackPlan);

  const approvedRelease = factoryService.approveRelease(actor, project.projectId);
  assert.ok(approvedRelease);
  assert.equal(approvedRelease.status, "released");
  assert.equal(approvedRelease.nextAction, "Monitor production health and maintenance plan.");

  const docs = factoryService.docs(actor, project.projectId);
  assert.ok(docs.readme);
  assert.ok(docs.releaseNotes);
  assert.ok(factoryService.memory(actor, project.projectId).some((entry) => entry.trusted));

  const quality = factoryService.quality(actor);
  assert.equal(quality.validationPassRate, 100);
  assert.ok(factoryService.adminSummary(actor).totalProjects >= 1);
  assert.ok(store.factoryAuditLogs.some((log) => log.projectId === project.projectId && log.action === "release.approved"));
  assert.ok(store.customerUsageEvents.some((event) => event.organizationId === organizationId && event.metric === "deployment"));

  console.log("Autonomous Software Factory test passed through billing-gated intake, requirement intelligence, blueprint, design, build, QA, release, docs, memory, and audit trails.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
