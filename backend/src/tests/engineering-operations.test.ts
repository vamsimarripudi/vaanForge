import assert from "node:assert/strict";
import { createId, store } from "../database/in-memory-store";
import { engineeringOperationsService } from "../modules/engineering-operations/engineering-operations.service";

async function main() {
  const organizationId = `org-engineering-${Date.now()}`;
  const actor = { organizationId, userId: "eng-admin", role: "Super Admin" };
  const now = new Date().toISOString();
  const projectId = "factory_project_engops";

  store.organizations.push({ id: organizationId, name: "Engineering Ops Org", suiteType: "VAANFORGE" as any, activePlan: "professional", billingStatus: "ACTIVE" as any, createdAt: now });
  store.workspaces.push({ id: `wks-${organizationId}`, organizationId, suiteType: "VAANFORGE" as any, name: "EngOps Workspace", enabledProducts: ["VAANFORGE" as any], status: "ACTIVE", createdAt: now });
  store.factoryProjects.push({ id: createId("fp"), projectId, organizationId, ownerId: actor.userId, name: "Factory Governance", productType: "saas", targetPlatform: "web", businessGoal: "Govern engineering operations", status: "building", priority: "HIGH", dueDate: now, complexityLevel: "enterprise", deploymentTarget: "docker", recommendedPlan: "professional", requirementQualityScore: 90, complexityScore: 75, buildSize: "large", nextAction: "Validate", activityHistory: [], createdAt: now, updatedAt: now });
  store.factoryValidationRuns.push({ id: createId("fv"), validationId: "val_lint", projectId, organizationId, validationType: "lint", status: "passed", evidence: { command: "npm run lint" }, createdAt: now, updatedAt: now });
  store.factoryValidationRuns.push({ id: createId("fv"), validationId: "val_build", projectId, organizationId, validationType: "build", status: "passed", evidence: { command: "npm run build" }, createdAt: now, updatedAt: now });
  store.agentExecutionRuns.push({ id: createId("aer"), executionId: "exec_engops", phaseOneRunId: "run_engops", organizationId, ownerId: actor.userId, requestedById: actor.userId, status: "validating", priority: "HIGH", dueDate: now, approvedBlueprint: {}, taskGraph: {}, nextAction: "Finish validation", activityHistory: [], createdAt: now, updatedAt: now });
  store.agentDeployments.push({ id: createId("dep"), deploymentId: "dep_engops", runId: "run_engops", organizationId, targetType: "DOCKER_SERVER", targetName: "Production", environment: "production", ownerId: actor.userId, priority: "HIGH", status: "deploying", releaseId: "rel_engops", requiredEnvVars: [], config: {}, checks: [], logs: [], releases: [], rollbacks: [], healthChecks: [], confirmedProduction: true, nextAction: "Verify", activityHistory: [], createdAt: now, updatedAt: now } as any);
  store.operationsHealthChecks.push({ id: createId("ohc"), checkId: "db_health_engops", organizationId, service: "database", region: "ap-south-1", status: "healthy", latencyMs: 24, evidence: {}, createdAt: now });
  store.engineeringMetrics.push({ id: createId("em"), metricId: "metric_coverage", organizationId, metricName: "code_coverage", value: 84, unit: "percent", source: "coverage_report", createdAt: now });
  store.engineeringMetrics.push({ id: createId("em"), metricId: "metric_lead_time", organizationId, metricName: "lead_time_hours", value: 18, unit: "hours", source: "release_pipeline", createdAt: now });

  const project = engineeringOperationsService.upsertProject(actor, { projectId, projectOwnerId: actor.userId, techLeadId: "tech-lead", productOwnerId: "product-owner", priority: "HIGH", status: "active", architectureVersion: "v1", releaseVersion: "v1.0.0-rc1", documentationStatus: "draft", securityStatus: "reviewing", riskScore: 35, completionPercent: 65, dependencies: ["billing"], technicalDebtScore: 18 });
  assert.equal(project.projectId, projectId);
  assert.equal(engineeringOperationsService.updateProject(actor, project.engineeringProjectId, { completionPercent: 70 }).completionPercent, 70);

  const adr = engineeringOperationsService.createArchitectureDecision(actor, { projectId, title: "Use modular EngOps service", context: "Engineering governance needs audited workflows.", decision: "Create a dedicated EngOps module.", consequences: "Routes remain isolated and testable.", status: "proposed", version: "v1", ownerId: actor.userId });
  assert.equal(engineeringOperationsService.updateArchitectureDecision(actor, adr.adrId, { status: "approved" }).approvalHistory.length, 1);
  const review = engineeringOperationsService.createArchitectureReview(actor, { projectId, architectureVersion: "v2", reviewerId: actor.userId, findings: ["Release gates need rollback evidence."], evidence: { source: "review" }, nextAction: "Approve after rollback plan." });
  assert.equal(engineeringOperationsService.updateArchitectureReview(actor, review.reviewId, { status: "approved" }).status, "approved");
  assert.equal(engineeringOperationsService.projects(actor)[0].architectureVersion, "v2");

  const debt = engineeringOperationsService.createTechnicalDebt(actor, { title: "Reduce duplicated route helpers", description: "Several modules use similar validation wrappers.", priority: "MEDIUM", ownerId: actor.userId, impact: "Maintenance cost", estimatedEffort: "2 days", relatedProjectId: projectId, status: "open", risk: "medium", targetSprint: "Sprint 13" });
  assert.equal(engineeringOperationsService.updateTechnicalDebt(actor, debt.debtId, { status: "assigned" }).status, "assigned");

  const pipeline = engineeringOperationsService.createReleasePipeline(actor, { releaseId: "release_engops", stage: "internal_qa", status: "in_progress", approvalRequired: true, rollbackPlan: "Restore previous release artifact.", validationReportId: "val_build", documentationUrl: "docs/engineering/release-process.md", migrationNotes: "No migration required.", ownerId: actor.userId, nextAction: "Complete QA." });
  assert.equal(engineeringOperationsService.updateReleasePipeline(actor, pipeline.pipelineId, { status: "approved", stage: "release_candidate" }).stage, "release_candidate");

  const environment = engineeringOperationsService.upsertEnvironment(actor, { name: "production", status: "healthy", region: "ap-south-1", ownerId: actor.userId, providerReadiness: "ready", secretsStatus: "configured", databaseStatus: "healthy", storageStatus: "healthy", queueStatus: "healthy", workerStatus: "healthy", deploymentStatus: "idle" });
  assert.equal(engineeringOperationsService.recordEnvironmentHealth(actor, { environmentId: environment.environmentId, status: "healthy", latencyMs: 20, evidence: { check: "api" } }).status, "healthy");
  assert.equal(engineeringOperationsService.environments(actor).registry[0].name, "production");

  const migration = engineeringOperationsService.createMigration(actor, { version: "20260702_engops", name: "Create EngOps governance tables", status: "pending", rollbackPlan: "Drop newly created tables after backup.", ownerId: actor.userId, evidence: { reviewed: true } });
  assert.equal(engineeringOperationsService.updateMigration(actor, migration.migrationId, { status: "applied" }).status, "applied");
  assert.equal(engineeringOperationsService.recordDatabaseMetric(actor, { metricName: "index_health", value: 98, unit: "percent", evidence: { indexes: "healthy" } }).value, 98);
  assert.equal(engineeringOperationsService.databaseGovernance(actor).schemaVersions.includes("20260702_engops"), true);

  const flag = engineeringOperationsService.createFeatureFlag(actor, { key: "engineering.release-gates", description: "Enable release gate controls.", enabled: true, environment: "production", rolloutPercent: 100, ownerId: actor.userId });
  assert.equal(engineeringOperationsService.updateFeatureFlag(actor, flag.flagId, { rolloutPercent: 50 }).rolloutPercent, 50);
  assert.equal(typeof engineeringOperationsService.evaluateFeatureFlag(actor, { key: "engineering.release-gates", environment: "production", subjectId: "workspace-a" }).enabled, "boolean");

  const dashboard = engineeringOperationsService.dashboard(actor);
  assert.equal(dashboard.activeProjects, 1);
  assert.equal(dashboard.repositoryHealth.buildSuccessRate, 100);
  assert.equal(dashboard.codeCoverage, 84);
  assert.equal(dashboard.runningAgentJobs, 1);
  assert.equal(engineeringOperationsService.codeQuality(actor).coverage, 84);
  assert.equal(engineeringOperationsService.analytics(actor).leadTime, 18);
  assert.equal(engineeringOperationsService.platformGovernance(actor).databaseVersioning.migrations.includes("20260702_engops"), true);
  assert.equal(engineeringOperationsService.adminTools(actor).featureFlags.length, 1);

  const report = engineeringOperationsService.createReport(actor, { reportType: "engineering_dashboard" });
  assert.equal(report.status, "READY");
  assert.equal(engineeringOperationsService.reports(actor).length, 1);

  console.log("Engineering operations test passed for dashboard, governance, debt, releases, environments, database, flags, analytics, and reports.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
