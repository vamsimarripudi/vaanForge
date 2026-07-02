import { z } from "zod";
import {
  createId,
  store,
  type StoredArchitectureDecision,
  type StoredArchitectureReview,
  type StoredEngineeringProject,
  type StoredEnvironmentRegistry,
  type StoredFeatureFlag,
  type StoredMigrationHistory,
  type StoredReleasePipeline,
  type StoredTechnicalDebt
} from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { operationsService } from "../operations/operations.service";
import { providerReadinessService } from "../providers/provider-readiness.service";
import { releaseOperationsService } from "../readiness/release-operations.service";

export type EngineeringActor = { organizationId: string; userId: string; role: string };

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const projectStatuses = ["planning", "active", "blocked", "release_candidate", "released", "archived"] as const;
const architectureReviewStatuses = ["requested", "in_review", "approved", "changes_requested", "rejected"] as const;
const adrStatuses = ["draft", "proposed", "approved", "superseded", "rejected"] as const;
const releaseStages = ["development", "internal_qa", "security_review", "release_candidate", "beta", "general_availability", "hotfix", "patch", "lts"] as const;
const releasePipelineStatuses = ["pending", "in_progress", "approved", "blocked", "completed"] as const;
const environmentNames = ["development", "testing", "staging", "production", "sandbox", "preview"] as const;
const healthStatuses = ["healthy", "degraded", "down"] as const;
const databaseMetricNames = ["index_health", "query_performance", "unused_tables", "unused_columns", "storage_growth"] as const;
const reportTypes = ["engineering_dashboard", "architecture_compliance", "code_quality", "technical_debt", "release_pipeline", "database_governance"] as const;

export const engineeringProjectSchema = z.object({
  projectId: z.string().min(2),
  projectOwnerId: z.string().min(2),
  techLeadId: z.string().min(2),
  productOwnerId: z.string().min(2),
  priority: z.enum(priorities).default("HIGH"),
  status: z.enum(projectStatuses).default("active"),
  architectureVersion: z.string().min(1).default("v1"),
  releaseVersion: z.string().min(1).default("unreleased"),
  documentationStatus: z.enum(["missing", "draft", "current", "stale"]).default("draft"),
  securityStatus: z.enum(["not_reviewed", "reviewing", "approved", "risk_accepted", "blocked"]).default("not_reviewed"),
  riskScore: z.number().min(0).max(100).default(40),
  completionPercent: z.number().min(0).max(100).default(0),
  dependencies: z.array(z.string()).default([]),
  technicalDebtScore: z.number().min(0).max(100).default(0)
});

export const engineeringProjectPatchSchema = engineeringProjectSchema.partial();

export const technicalDebtSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(8),
  priority: z.enum(priorities).default("MEDIUM"),
  ownerId: z.string().min(2),
  impact: z.string().min(3),
  estimatedEffort: z.string().min(2),
  relatedProjectId: z.string().optional(),
  status: z.enum(["open", "assigned", "in_progress", "resolved", "accepted"]).default("open"),
  risk: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  targetSprint: z.string().optional()
});

export const technicalDebtPatchSchema = technicalDebtSchema.partial();

export const architectureReviewSchema = z.object({
  projectId: z.string().min(2),
  architectureVersion: z.string().min(1),
  reviewerId: z.string().min(2),
  findings: z.array(z.string().min(2)).default([]),
  evidence: z.record(z.unknown()).default({}),
  nextAction: z.string().min(3).default("Complete architecture review.")
});

export const architectureReviewPatchSchema = z.object({
  status: z.enum(architectureReviewStatuses),
  findings: z.array(z.string().min(2)).optional(),
  evidence: z.record(z.unknown()).optional(),
  nextAction: z.string().min(3).optional()
});

export const architectureDecisionSchema = z.object({
  projectId: z.string().optional(),
  title: z.string().min(4),
  context: z.string().min(8),
  decision: z.string().min(8),
  consequences: z.string().min(8),
  status: z.enum(adrStatuses).default("draft"),
  version: z.string().min(1).default("v1"),
  ownerId: z.string().min(2)
});

export const architectureDecisionPatchSchema = architectureDecisionSchema.partial();

export const releasePipelineSchema = z.object({
  releaseId: z.string().min(2),
  stage: z.enum(releaseStages).default("development"),
  status: z.enum(releasePipelineStatuses).default("pending"),
  approvalRequired: z.boolean().default(true),
  rollbackPlan: z.string().min(4),
  validationReportId: z.string().optional(),
  documentationUrl: z.string().optional(),
  migrationNotes: z.string().min(4),
  ownerId: z.string().min(2),
  nextAction: z.string().min(3).default("Advance release after current gate passes.")
});

export const releasePipelinePatchSchema = releasePipelineSchema.partial();

export const environmentSchema = z.object({
  name: z.enum(environmentNames),
  status: z.enum(["healthy", "degraded", "blocked", "maintenance"]).default("healthy"),
  region: z.string().min(2).default("ap-south-1"),
  ownerId: z.string().min(2),
  providerReadiness: z.enum(["ready", "degraded", "missing_configuration"]).default("missing_configuration"),
  secretsStatus: z.enum(["configured", "missing", "rotation_due"]).default("missing"),
  databaseStatus: z.enum(healthStatuses).default("healthy"),
  storageStatus: z.enum(healthStatuses).default("healthy"),
  queueStatus: z.enum(healthStatuses).default("healthy"),
  workerStatus: z.enum(healthStatuses).default("healthy"),
  deploymentStatus: z.enum(["idle", "deploying", "failed"]).default("idle")
});

export const environmentPatchSchema = environmentSchema.partial();

export const environmentHealthSchema = z.object({
  environmentId: z.string().min(2),
  status: z.enum(healthStatuses),
  latencyMs: z.number().min(0).optional(),
  evidence: z.record(z.unknown()).default({})
});

export const migrationSchema = z.object({
  version: z.string().min(1),
  name: z.string().min(3),
  status: z.enum(["pending", "applied", "failed", "rolled_back"]).default("pending"),
  rollbackPlan: z.string().min(4),
  ownerId: z.string().min(2),
  evidence: z.record(z.unknown()).default({})
});

export const migrationPatchSchema = migrationSchema.partial();

export const databaseMetricSchema = z.object({
  metricName: z.enum(databaseMetricNames),
  value: z.number().min(0),
  unit: z.string().min(1),
  evidence: z.record(z.unknown()).default({})
});

export const featureFlagSchema = z.object({
  key: z.string().min(3).regex(/^[a-z0-9_.-]+$/),
  description: z.string().min(4),
  enabled: z.boolean().default(false),
  environment: z.enum(environmentNames).default("production"),
  rolloutPercent: z.number().min(0).max(100).default(0),
  ownerId: z.string().min(2)
});

export const featureFlagPatchSchema = featureFlagSchema.partial();
export const featureFlagEvaluationSchema = z.object({ key: z.string().min(3), environment: z.enum(environmentNames).default("production"), subjectId: z.string().min(1).optional() });
export const engineeringReportSchema = z.object({ reportType: z.enum(reportTypes) });

export class EngineeringOperationsService {
  dashboard(actor: EngineeringActor) {
    const projects = this.projects(actor);
    const operations = operationsService.summary(actor);
    const health = operationsService.health(actor);
    const queues = operationsService.queues(actor);
    const providerReadiness = providerReadinessService.readiness();
    const validations = store.factoryValidationRuns.filter((item) => this.visible(actor, item.organizationId));
    const technicalDebt = this.technicalDebt(actor);
    const securityFindings = store.securityEvents.filter((item) => this.visible(actor, item.organizationId));
    const architectureViolations = store.architectureReviews.filter((item) => this.visible(actor, item.organizationId) && ["changes_requested", "rejected"].includes(item.status));
    const builds = validations.filter((item) => item.validationType === "build");
    return {
      repositoryHealth: {
        lintResults: validations.filter((item) => item.validationType === "lint"),
        typeErrors: validations.filter((item) => item.validationType === "type-check" && item.status === "failed").length,
        buildSuccessRate: percent(builds.filter((item) => item.status === "passed").length, builds.length),
        openBugs: store.factoryErrors.filter((item) => this.visible(actor, item.organizationId) && item.status === "open").length,
        openSecurityFindings: securityFindings.filter((item) => !["completed", "rejected"].includes(item.status)).length,
        architectureViolations: architectureViolations.length
      },
      activeProjects: projects.filter((item) => ["active", "release_candidate"].includes(item.status)).length,
      buildQueue: store.cloudJobs.filter((item) => this.visible(actor, item.organizationId) && item.jobType === "build"),
      runningAgentJobs: store.agentExecutionRuns.filter((item) => this.visible(actor, item.organizationId) && ["preparing", "generating", "validating", "repairing"].includes(item.status)).length,
      ciStatus: validations.some((item) => item.status === "failed") ? "failing" : "passing",
      deploymentQueue: store.agentDeployments.filter((item) => this.visible(actor, item.organizationId) && ["preparing", "deploying", "verifying"].includes(item.status)),
      technicalDebt: { open: technicalDebt.filter((item) => item.status !== "resolved").length, critical: technicalDebt.filter((item) => item.risk === "critical").length },
      codeCoverage: this.latestMetric(actor, "code_coverage") ?? 0,
      performanceTrends: this.metrics(actor).filter((item) => ["api_latency", "build_duration", "query_time"].includes(item.metricName)),
      databaseHealth: health.checks.find((item) => item.service === "database")?.status ?? "unknown",
      queueHealth: queues.overallStatus,
      providerHealth: providerReadiness.totals.missingSecret ? "degraded" : "healthy",
      sources: {
        repository: "factoryValidationRuns, factoryErrors, securityEvents, architectureReviews",
        operations: "operationsService health, queues, deployments",
        providers: "providerReadinessService",
        engineering: "engineeringProjects, technicalDebt, engineeringMetrics"
      },
      operations
    };
  }

  projects(actor: EngineeringActor) {
    return store.engineeringProjects.filter((item) => this.visible(actor, item.organizationId));
  }

  upsertProject(actor: EngineeringActor, input: z.infer<typeof engineeringProjectSchema>) {
    const parsed = engineeringProjectSchema.parse(input);
    const now = new Date().toISOString();
    const existing = store.engineeringProjects.find((item) => item.organizationId === actor.organizationId && item.projectId === parsed.projectId);
    if (existing) {
      Object.assign(existing, parsed, { updatedAt: now });
      this.audit(actor, "ENGINEERING_PROJECT_UPDATED", "EngineeringProject", existing.engineeringProjectId);
      return existing;
    }
    const project: StoredEngineeringProject = { id: createId("engp"), engineeringProjectId: createId("engineering_project"), organizationId: actor.organizationId, ...parsed, createdBy: actor.userId, createdAt: now, updatedAt: now };
    store.engineeringProjects.push(project);
    this.audit(actor, "ENGINEERING_PROJECT_CREATED", "EngineeringProject", project.engineeringProjectId);
    return project;
  }

  updateProject(actor: EngineeringActor, engineeringProjectId: string, input: z.infer<typeof engineeringProjectPatchSchema>) {
    const project = store.engineeringProjects.find((item) => this.visible(actor, item.organizationId) && item.engineeringProjectId === engineeringProjectId);
    if (!project) throw new Error("Engineering project not found.");
    Object.assign(project, engineeringProjectPatchSchema.parse(input), { updatedAt: new Date().toISOString() });
    this.audit(actor, "ENGINEERING_PROJECT_UPDATED", "EngineeringProject", project.engineeringProjectId);
    return project;
  }

  architectureSummary(actor: EngineeringActor) {
    return {
      decisions: store.architectureDecisions.filter((item) => this.visible(actor, item.organizationId)),
      reviews: store.architectureReviews.filter((item) => this.visible(actor, item.organizationId)),
      compliance: this.architectureCompliance(actor)
    };
  }

  createArchitectureReview(actor: EngineeringActor, input: z.infer<typeof architectureReviewSchema>) {
    const parsed = architectureReviewSchema.parse(input);
    const now = new Date().toISOString();
    const review: StoredArchitectureReview = { id: createId("arv"), reviewId: createId("architecture_review"), organizationId: actor.organizationId, ...parsed, status: "requested", createdAt: now, updatedAt: now };
    store.architectureReviews.push(review);
    this.audit(actor, "ARCHITECTURE_REVIEW_REQUESTED", "ArchitectureReview", review.reviewId);
    return review;
  }

  updateArchitectureReview(actor: EngineeringActor, reviewId: string, input: z.infer<typeof architectureReviewPatchSchema>) {
    const review = store.architectureReviews.find((item) => this.visible(actor, item.organizationId) && item.reviewId === reviewId);
    if (!review) throw new Error("Architecture review not found.");
    Object.assign(review, architectureReviewPatchSchema.parse(input), { updatedAt: new Date().toISOString() });
    if (review.status === "approved") this.syncProjectArchitecture(actor, review.projectId, review.architectureVersion);
    this.audit(actor, "ARCHITECTURE_REVIEW_UPDATED", "ArchitectureReview", review.reviewId);
    return review;
  }

  createArchitectureDecision(actor: EngineeringActor, input: z.infer<typeof architectureDecisionSchema>) {
    const parsed = architectureDecisionSchema.parse(input);
    const now = new Date().toISOString();
    const decision: StoredArchitectureDecision = { id: createId("adr"), adrId: createId("architecture_decision"), organizationId: actor.organizationId, ...parsed, approvalHistory: [], createdAt: now, updatedAt: now };
    store.architectureDecisions.push(decision);
    this.audit(actor, "ARCHITECTURE_DECISION_CREATED", "ArchitectureDecision", decision.adrId);
    return decision;
  }

  updateArchitectureDecision(actor: EngineeringActor, adrId: string, input: z.infer<typeof architectureDecisionPatchSchema>) {
    const decision = store.architectureDecisions.find((item) => this.visible(actor, item.organizationId) && item.adrId === adrId);
    if (!decision) throw new Error("Architecture decision not found.");
    const parsed = architectureDecisionPatchSchema.parse(input);
    Object.assign(decision, parsed, { updatedAt: new Date().toISOString() });
    if (parsed.status === "approved") decision.approvalHistory.push({ at: decision.updatedAt, actorId: actor.userId, decision: "approved" });
    this.audit(actor, "ARCHITECTURE_DECISION_UPDATED", "ArchitectureDecision", decision.adrId);
    return decision;
  }

  codeQuality(actor: EngineeringActor) {
    const validations = store.factoryValidationRuns.filter((item) => this.visible(actor, item.organizationId));
    return {
      lintResults: validations.filter((item) => item.validationType === "lint"),
      typeErrors: validations.filter((item) => item.validationType === "type-check" && item.status === "failed"),
      coverage: this.latestMetric(actor, "code_coverage") ?? 0,
      duplicatedCode: this.latestMetric(actor, "duplicated_code") ?? 0,
      unusedFiles: this.latestMetric(actor, "unused_files") ?? 0,
      unusedPackages: this.latestMetric(actor, "unused_packages") ?? 0,
      unusedApis: this.latestMetric(actor, "unused_apis") ?? 0,
      complexity: this.latestMetric(actor, "complexity") ?? 0,
      cyclomaticComplexity: this.latestMetric(actor, "cyclomatic_complexity") ?? 0,
      largeFiles: this.latestMetric(actor, "large_files") ?? 0,
      largeFunctions: this.latestMetric(actor, "large_functions") ?? 0,
      trends: this.metrics(actor).filter((item) => ["code_coverage", "complexity", "duplicated_code"].includes(item.metricName))
    };
  }

  technicalDebt(actor: EngineeringActor) {
    return store.technicalDebt.filter((item) => this.visible(actor, item.organizationId)).sort((a, b) => riskWeight(b.risk) - riskWeight(a.risk));
  }

  createTechnicalDebt(actor: EngineeringActor, input: z.infer<typeof technicalDebtSchema>) {
    const parsed = technicalDebtSchema.parse(input);
    const now = new Date().toISOString();
    const item: StoredTechnicalDebt = { id: createId("td"), debtId: createId("technical_debt"), organizationId: actor.organizationId, ...parsed, createdBy: actor.userId, createdAt: now, updatedAt: now };
    store.technicalDebt.push(item);
    this.audit(actor, "TECHNICAL_DEBT_CREATED", "TechnicalDebt", item.debtId);
    return item;
  }

  updateTechnicalDebt(actor: EngineeringActor, debtId: string, input: z.infer<typeof technicalDebtPatchSchema>) {
    const item = store.technicalDebt.find((debt) => this.visible(actor, debt.organizationId) && debt.debtId === debtId);
    if (!item) throw new Error("Technical debt item not found.");
    Object.assign(item, technicalDebtPatchSchema.parse(input), { updatedAt: new Date().toISOString() });
    this.audit(actor, "TECHNICAL_DEBT_UPDATED", "TechnicalDebt", item.debtId);
    return item;
  }

  releasePipeline(actor: EngineeringActor) {
    return store.releasePipeline.filter((item) => this.visible(actor, item.organizationId));
  }

  createReleasePipeline(actor: EngineeringActor, input: z.infer<typeof releasePipelineSchema>) {
    const parsed = releasePipelineSchema.parse(input);
    const now = new Date().toISOString();
    const item: StoredReleasePipeline = { id: createId("rp"), pipelineId: createId("release_pipeline"), organizationId: actor.organizationId, ...parsed, createdAt: now, updatedAt: now };
    store.releasePipeline.push(item);
    this.audit(actor, "RELEASE_PIPELINE_CREATED", "ReleasePipeline", item.pipelineId);
    return item;
  }

  updateReleasePipeline(actor: EngineeringActor, pipelineId: string, input: z.infer<typeof releasePipelinePatchSchema>) {
    const item = store.releasePipeline.find((pipeline) => this.visible(actor, pipeline.organizationId) && pipeline.pipelineId === pipelineId);
    if (!item) throw new Error("Release pipeline item not found.");
    Object.assign(item, releasePipelinePatchSchema.parse(input), { updatedAt: new Date().toISOString() });
    this.audit(actor, "RELEASE_PIPELINE_UPDATED", "ReleasePipeline", item.pipelineId);
    return item;
  }

  environments(actor: EngineeringActor) {
    return {
      registry: store.environmentRegistry.filter((item) => this.visible(actor, item.organizationId)),
      health: store.environmentHealth.filter((item) => this.visible(actor, item.organizationId)),
      providerReadiness: providerReadinessService.readiness()
    };
  }

  upsertEnvironment(actor: EngineeringActor, input: z.infer<typeof environmentSchema>) {
    const parsed = environmentSchema.parse(input);
    const now = new Date().toISOString();
    const existing = store.environmentRegistry.find((item) => item.organizationId === actor.organizationId && item.name === parsed.name);
    if (existing) {
      Object.assign(existing, parsed, { updatedAt: now });
      this.audit(actor, "ENVIRONMENT_UPDATED", "Environment", existing.environmentId);
      return existing;
    }
    const environment: StoredEnvironmentRegistry = { id: createId("env"), environmentId: createId("environment"), organizationId: actor.organizationId, ...parsed, createdAt: now, updatedAt: now };
    store.environmentRegistry.push(environment);
    this.audit(actor, "ENVIRONMENT_CREATED", "Environment", environment.environmentId);
    return environment;
  }

  updateEnvironment(actor: EngineeringActor, environmentId: string, input: z.infer<typeof environmentPatchSchema>) {
    const environment = store.environmentRegistry.find((item) => this.visible(actor, item.organizationId) && item.environmentId === environmentId);
    if (!environment) throw new Error("Environment not found.");
    Object.assign(environment, environmentPatchSchema.parse(input), { updatedAt: new Date().toISOString() });
    this.audit(actor, "ENVIRONMENT_UPDATED", "Environment", environment.environmentId);
    return environment;
  }

  recordEnvironmentHealth(actor: EngineeringActor, input: z.infer<typeof environmentHealthSchema>) {
    const parsed = environmentHealthSchema.parse(input);
    const item = { id: createId("envh"), healthId: createId("environment_health"), organizationId: actor.organizationId, ...parsed, createdAt: new Date().toISOString() };
    store.environmentHealth.push(item);
    this.audit(actor, "ENVIRONMENT_HEALTH_RECORDED", "EnvironmentHealth", item.healthId);
    return item;
  }

  databaseGovernance(actor: EngineeringActor) {
    return {
      migrations: store.migrationHistory.filter((item) => this.visible(actor, item.organizationId)),
      metrics: store.databaseMetrics.filter((item) => this.visible(actor, item.organizationId)),
      schemaVersions: unique(store.migrationHistory.filter((item) => this.visible(actor, item.organizationId)).map((item) => item.version)),
      rollbackHistory: store.migrationHistory.filter((item) => this.visible(actor, item.organizationId) && item.status === "rolled_back")
    };
  }

  createMigration(actor: EngineeringActor, input: z.infer<typeof migrationSchema>) {
    const parsed = migrationSchema.parse(input);
    const now = new Date().toISOString();
    const item: StoredMigrationHistory = { id: createId("mig"), migrationId: createId("migration"), organizationId: actor.organizationId, ...parsed, appliedAt: parsed.status === "applied" ? now : undefined, rolledBackAt: parsed.status === "rolled_back" ? now : undefined, createdAt: now, updatedAt: now };
    store.migrationHistory.push(item);
    this.audit(actor, "MIGRATION_RECORDED", "Migration", item.migrationId);
    return item;
  }

  updateMigration(actor: EngineeringActor, migrationId: string, input: z.infer<typeof migrationPatchSchema>) {
    const item = store.migrationHistory.find((migration) => this.visible(actor, migration.organizationId) && migration.migrationId === migrationId);
    if (!item) throw new Error("Migration not found.");
    const parsed = migrationPatchSchema.parse(input);
    const now = new Date().toISOString();
    Object.assign(item, parsed, { appliedAt: parsed.status === "applied" ? now : item.appliedAt, rolledBackAt: parsed.status === "rolled_back" ? now : item.rolledBackAt, updatedAt: now });
    this.audit(actor, "MIGRATION_UPDATED", "Migration", item.migrationId);
    return item;
  }

  recordDatabaseMetric(actor: EngineeringActor, input: z.infer<typeof databaseMetricSchema>) {
    const parsed = databaseMetricSchema.parse(input);
    const item = { id: createId("dbm"), metricId: createId("database_metric"), organizationId: actor.organizationId, ...parsed, createdAt: new Date().toISOString() };
    store.databaseMetrics.push(item);
    this.audit(actor, "DATABASE_METRIC_RECORDED", "DatabaseMetric", item.metricId);
    return item;
  }

  analytics(actor: EngineeringActor) {
    const metrics = this.metrics(actor);
    const deployments = store.agentDeployments.filter((item) => this.visible(actor, item.organizationId));
    const validationRuns = store.factoryValidationRuns.filter((item) => this.visible(actor, item.organizationId));
    const failedChanges = validationRuns.filter((item) => item.status === "failed").length;
    return {
      leadTime: this.latestMetric(actor, "lead_time_hours") ?? 0,
      cycleTime: this.latestMetric(actor, "cycle_time_hours") ?? 0,
      deploymentFrequency: deployments.length,
      changeFailureRate: percent(failedChanges, validationRuns.length),
      recoveryTime: this.latestMetric(actor, "recovery_time_hours") ?? 0,
      buildSuccessRate: percent(validationRuns.filter((item) => item.validationType === "build" && item.status === "passed").length, validationRuns.filter((item) => item.validationType === "build").length),
      averageReviewTime: this.latestMetric(actor, "average_review_time_hours") ?? 0,
      averageMergeTime: this.latestMetric(actor, "average_merge_time_hours") ?? 0,
      averageBugResolution: this.latestMetric(actor, "average_bug_resolution_hours") ?? 0,
      trends: metrics
    };
  }

  platformGovernance(actor: EngineeringActor) {
    return {
      apiVersioning: { versions: unique(store.apiUsageLogs.filter((item) => this.visible(actor, item.organizationId)).map((item) => item.apiVersion || "v1")) },
      documentationVersioning: { docsVersions: store.docsVersions.length },
      designSystemVersioning: { designSystems: store.factoryDesignSystems.filter((item) => this.visible(actor, item.organizationId)).length },
      databaseVersioning: { migrations: this.databaseGovernance(actor).schemaVersions },
      agentVersioning: { roles: store.agentRoles.length, brains: store.agentRoleConfigs.length },
      marketplaceVersioning: { appVersions: store.marketplaceAppVersions.length },
      sdkVersioning: { sdkVersions: store.sdkVersions.length }
    };
  }

  adminTools(actor: EngineeringActor) {
    return {
      featureFlags: store.featureFlags.filter((item) => this.visible(actor, item.organizationId)),
      maintenanceWindows: store.maintenanceWindows.filter((item) => this.visible(actor, item.organizationId)),
      globalAnnouncements: store.supportAnnouncements.filter((item) => this.visible(actor, item.organizationId) && item.status === "published"),
      emergencyLocks: store.emergencyActions.filter((item) => this.visible(actor, item.organizationId) && ["emergency_stop", "pause_deployments", "pause_agent_generation"].includes(item.action)),
      readOnlyMode: store.emergencyActions.some((item) => this.visible(actor, item.organizationId) && item.action === "maintenance_mode" && item.status === "accepted"),
      providerSwitching: providerReadinessService.readiness().providers,
      queueControl: operationsService.queues(actor),
      cacheManagement: store.cloudConfigurations.filter((item) => this.visible(actor, item.organizationId) && item.scope === "runtime")
    };
  }

  createFeatureFlag(actor: EngineeringActor, input: z.infer<typeof featureFlagSchema>) {
    const parsed = featureFlagSchema.parse(input);
    const now = new Date().toISOString();
    const existing = store.featureFlags.find((item) => item.organizationId === actor.organizationId && item.key === parsed.key && item.environment === parsed.environment);
    if (existing) {
      Object.assign(existing, parsed, { updatedAt: now });
      this.audit(actor, "FEATURE_FLAG_UPDATED", "FeatureFlag", existing.flagId);
      return existing;
    }
    const flag: StoredFeatureFlag = { id: createId("ff"), flagId: createId("feature_flag"), organizationId: actor.organizationId, ...parsed, createdAt: now, updatedAt: now };
    store.featureFlags.push(flag);
    this.audit(actor, "FEATURE_FLAG_CREATED", "FeatureFlag", flag.flagId);
    return flag;
  }

  updateFeatureFlag(actor: EngineeringActor, flagId: string, input: z.infer<typeof featureFlagPatchSchema>) {
    const flag = store.featureFlags.find((item) => this.visible(actor, item.organizationId) && item.flagId === flagId);
    if (!flag) throw new Error("Feature flag not found.");
    Object.assign(flag, featureFlagPatchSchema.parse(input), { updatedAt: new Date().toISOString() });
    this.audit(actor, "FEATURE_FLAG_UPDATED", "FeatureFlag", flag.flagId);
    return flag;
  }

  evaluateFeatureFlag(actor: EngineeringActor, input: z.infer<typeof featureFlagEvaluationSchema>) {
    const parsed = featureFlagEvaluationSchema.parse(input);
    const flag = store.featureFlags.find((item) => this.visible(actor, item.organizationId) && item.key === parsed.key && item.environment === parsed.environment);
    if (!flag) return { key: parsed.key, enabled: false, reason: "flag_not_found" };
    const bucket = parsed.subjectId ? hashPercent(parsed.subjectId) : 0;
    return { key: flag.key, enabled: flag.enabled && bucket <= flag.rolloutPercent, rolloutPercent: flag.rolloutPercent, bucket, reason: flag.enabled ? "evaluated" : "flag_disabled" };
  }

  createReport(actor: EngineeringActor, input: z.infer<typeof engineeringReportSchema>) {
    const parsed = engineeringReportSchema.parse(input);
    const content = this.reportContent(actor, parsed.reportType);
    const report = { id: createId("er"), reportId: createId("engineering_report"), organizationId: actor.organizationId, reportType: parsed.reportType, status: "READY" as const, content, generatedBy: actor.userId, createdAt: new Date().toISOString() };
    store.engineeringReports.push(report);
    this.audit(actor, "ENGINEERING_REPORT_GENERATED", "EngineeringReport", report.reportId);
    return report;
  }

  reports(actor: EngineeringActor) {
    return store.engineeringReports.filter((item) => this.visible(actor, item.organizationId));
  }

  private architectureCompliance(actor: EngineeringActor) {
    const reviews = store.architectureReviews.filter((item) => this.visible(actor, item.organizationId));
    return {
      reviewed: reviews.length,
      approved: reviews.filter((item) => item.status === "approved").length,
      changesRequested: reviews.filter((item) => item.status === "changes_requested").length,
      rejected: reviews.filter((item) => item.status === "rejected").length,
      approvalRate: percent(reviews.filter((item) => item.status === "approved").length, reviews.length)
    };
  }

  private syncProjectArchitecture(actor: EngineeringActor, projectId: string, architectureVersion: string) {
    const project = store.engineeringProjects.find((item) => this.visible(actor, item.organizationId) && item.projectId === projectId);
    if (project) {
      project.architectureVersion = architectureVersion;
      project.updatedAt = new Date().toISOString();
    }
  }

  private metrics(actor: EngineeringActor) {
    return store.engineeringMetrics.filter((item) => this.visible(actor, item.organizationId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private latestMetric(actor: EngineeringActor, metricName: string) {
    return this.metrics(actor).find((item) => item.metricName === metricName)?.value;
  }

  private reportContent(actor: EngineeringActor, reportType: z.infer<typeof engineeringReportSchema>["reportType"]) {
    if (reportType === "engineering_dashboard") return this.dashboard(actor);
    if (reportType === "architecture_compliance") return this.architectureSummary(actor);
    if (reportType === "code_quality") return this.codeQuality(actor);
    if (reportType === "technical_debt") return { technicalDebt: this.technicalDebt(actor) };
    if (reportType === "release_pipeline") return { releasePipeline: this.releasePipeline(actor), releases: releaseOperationsService.releases() };
    return this.databaseGovernance(actor);
  }

  private visible(actor: EngineeringActor, organizationId?: string) {
    return actor.role === "Super Admin" || organizationId === actor.organizationId;
  }

  private audit(actor: EngineeringActor, event: string, entityType: string, entityId: string) {
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: "SECURITY_ACTION", entityType, entityId, metadata: { engineeringAction: event } });
  }
}

export const engineeringOperationsService = new EngineeringOperationsService();

function percent(value: number, total: number) {
  return total ? Number(((value / total) * 100).toFixed(2)) : 0;
}

function riskWeight(risk: string) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[risk] || 0;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function hashPercent(value: string) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 100;
  return Math.abs(hash);
}
