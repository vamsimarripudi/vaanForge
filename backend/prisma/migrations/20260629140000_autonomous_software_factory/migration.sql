CREATE TABLE "factory_projects" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL, "productType" TEXT NOT NULL, "targetPlatform" TEXT NOT NULL, "businessGoal" TEXT NOT NULL,
  "status" TEXT NOT NULL, "priority" TEXT NOT NULL, "dueDate" TIMESTAMP(3) NOT NULL, "complexityLevel" TEXT NOT NULL,
  "deploymentTarget" TEXT NOT NULL, "recommendedPlan" TEXT NOT NULL, "requirementQualityScore" INTEGER NOT NULL,
  "complexityScore" INTEGER NOT NULL, "buildSize" TEXT NOT NULL, "nextAction" TEXT NOT NULL, "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "factory_projects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "factory_projects_projectId_key" ON "factory_projects"("projectId");
CREATE INDEX "factory_projects_organizationId_status_idx" ON "factory_projects"("organizationId", "status");
CREATE INDEX "factory_projects_organizationId_ownerId_idx" ON "factory_projects"("organizationId", "ownerId");
ALTER TABLE "factory_projects" ADD CONSTRAINT "factory_projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_intake_answers" (
  "id" TEXT NOT NULL, "answerId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL,
  "userRoles" TEXT[], "coreFeatures" TEXT[], "integrations" TEXT[], "budgetLevel" TEXT NOT NULL,
  "rawInput" JSONB NOT NULL, "normalizedInput" JSONB NOT NULL, "missingFields" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "factory_intake_answers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "factory_intake_answers_answerId_key" ON "factory_intake_answers"("answerId");
CREATE INDEX "factory_intake_answers_organizationId_projectId_idx" ON "factory_intake_answers"("organizationId", "projectId");
ALTER TABLE "factory_intake_answers" ADD CONSTRAINT "factory_intake_answers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_requirement_questions" (
  "id" TEXT NOT NULL, "questionId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL,
  "question" TEXT NOT NULL, "fieldKey" TEXT NOT NULL, "reason" TEXT NOT NULL, "status" TEXT NOT NULL, "answer" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "factory_requirement_questions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "factory_requirement_questions_questionId_key" ON "factory_requirement_questions"("questionId");
CREATE INDEX "factory_requirement_questions_organizationId_projectId_status_idx" ON "factory_requirement_questions"("organizationId", "projectId", "status");
ALTER TABLE "factory_requirement_questions" ADD CONSTRAINT "factory_requirement_questions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_blueprints" (
  "id" TEXT NOT NULL, "blueprintId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL, "prd" TEXT NOT NULL, "featureList" TEXT[], "userRoles" TEXT[], "userJourneys" TEXT[], "uxFlow" TEXT[],
  "pageMap" TEXT[], "apiMap" TEXT[], "databaseSchema" TEXT[], "architecturePlan" TEXT[], "securityPlan" TEXT[],
  "testingPlan" TEXT[], "deploymentPlan" TEXT[], "rejectionReason" TEXT, "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "factory_blueprints_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "factory_blueprints_blueprintId_key" ON "factory_blueprints"("blueprintId");
CREATE UNIQUE INDEX "factory_blueprints_projectId_version_key" ON "factory_blueprints"("projectId", "version");
CREATE INDEX "factory_blueprints_organizationId_status_idx" ON "factory_blueprints"("organizationId", "status");
ALTER TABLE "factory_blueprints" ADD CONSTRAINT "factory_blueprints_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_design_systems" (
  "id" TEXT NOT NULL, "designId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL, "designSystem" TEXT[], "layoutDirection" TEXT NOT NULL, "componentMap" TEXT[], "responsiveStrategy" TEXT[],
  "accessibilityChecklist" TEXT[], "themeTokens" JSONB NOT NULL, "uiQualityScore" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "factory_design_systems_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "factory_design_systems_designId_key" ON "factory_design_systems"("designId");
CREATE UNIQUE INDEX "factory_design_systems_projectId_version_key" ON "factory_design_systems"("projectId", "version");
CREATE INDEX "factory_design_systems_organizationId_status_idx" ON "factory_design_systems"("organizationId", "status");
ALTER TABLE "factory_design_systems" ADD CONSTRAINT "factory_design_systems_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_task_graphs" ("id" TEXT NOT NULL, "graphId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "status" TEXT NOT NULL, "nodes" JSONB NOT NULL, "edges" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "factory_task_graphs_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "factory_task_graphs_graphId_key" ON "factory_task_graphs"("graphId");
CREATE INDEX "factory_task_graphs_organizationId_projectId_idx" ON "factory_task_graphs"("organizationId", "projectId");
ALTER TABLE "factory_task_graphs" ADD CONSTRAINT "factory_task_graphs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_tasks" ("id" TEXT NOT NULL, "taskId" TEXT NOT NULL, "graphId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "module" TEXT NOT NULL, "title" TEXT NOT NULL, "status" TEXT NOT NULL, "ownerAgent" TEXT NOT NULL, "priority" TEXT NOT NULL, "dueDate" TIMESTAMP(3) NOT NULL, "nextAction" TEXT NOT NULL, "evidence" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "factory_tasks_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "factory_tasks_taskId_key" ON "factory_tasks"("taskId");
CREATE INDEX "factory_tasks_organizationId_projectId_status_idx" ON "factory_tasks"("organizationId", "projectId", "status");
ALTER TABLE "factory_tasks" ADD CONSTRAINT "factory_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_generated_files" ("id" TEXT NOT NULL, "fileId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "taskId" TEXT NOT NULL, "path" TEXT NOT NULL, "fileType" TEXT NOT NULL, "status" TEXT NOT NULL, "checksum" TEXT NOT NULL, "diffRequired" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "factory_generated_files_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "factory_generated_files_fileId_key" ON "factory_generated_files"("fileId");
CREATE INDEX "factory_generated_files_organizationId_projectId_idx" ON "factory_generated_files"("organizationId", "projectId");
ALTER TABLE "factory_generated_files" ADD CONSTRAINT "factory_generated_files_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_validation_runs" ("id" TEXT NOT NULL, "validationId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "validationType" TEXT NOT NULL, "status" TEXT NOT NULL, "evidence" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "factory_validation_runs_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "factory_validation_runs_validationId_key" ON "factory_validation_runs"("validationId");
CREATE INDEX "factory_validation_runs_organizationId_projectId_status_idx" ON "factory_validation_runs"("organizationId", "projectId", "status");
ALTER TABLE "factory_validation_runs" ADD CONSTRAINT "factory_validation_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_errors" ("id" TEXT NOT NULL, "errorId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "source" TEXT NOT NULL, "reason" TEXT NOT NULL, "line" INTEGER, "status" TEXT NOT NULL, "nextAction" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "factory_errors_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "factory_errors_errorId_key" ON "factory_errors"("errorId");
CREATE INDEX "factory_errors_organizationId_projectId_status_idx" ON "factory_errors"("organizationId", "projectId", "status");
ALTER TABLE "factory_errors" ADD CONSTRAINT "factory_errors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_repair_attempts" ("id" TEXT NOT NULL, "repairId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "errorId" TEXT NOT NULL, "summary" TEXT NOT NULL, "status" TEXT NOT NULL, "evidence" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "factory_repair_attempts_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "factory_repair_attempts_repairId_key" ON "factory_repair_attempts"("repairId");
CREATE INDEX "factory_repair_attempts_organizationId_projectId_idx" ON "factory_repair_attempts"("organizationId", "projectId");
ALTER TABLE "factory_repair_attempts" ADD CONSTRAINT "factory_repair_attempts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_releases" ("id" TEXT NOT NULL, "releaseId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "version" TEXT NOT NULL, "status" TEXT NOT NULL, "changelog" TEXT[], "releaseNotes" TEXT NOT NULL, "deploymentChecklist" TEXT[], "rollbackPlan" TEXT[], "finalReport" TEXT NOT NULL, "approvedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "factory_releases_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "factory_releases_releaseId_key" ON "factory_releases"("releaseId");
CREATE INDEX "factory_releases_organizationId_projectId_status_idx" ON "factory_releases"("organizationId", "projectId", "status");
ALTER TABLE "factory_releases" ADD CONSTRAINT "factory_releases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_memory_entries" ("id" TEXT NOT NULL, "memoryId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "memoryType" TEXT NOT NULL, "summary" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "trusted" BOOLEAN NOT NULL DEFAULT false, "sensitive" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "factory_memory_entries_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "factory_memory_entries_memoryId_key" ON "factory_memory_entries"("memoryId");
CREATE INDEX "factory_memory_entries_organizationId_projectId_idx" ON "factory_memory_entries"("organizationId", "projectId");
CREATE INDEX "factory_memory_entries_organizationId_trusted_sensitive_idx" ON "factory_memory_entries"("organizationId", "trusted", "sensitive");
ALTER TABLE "factory_memory_entries" ADD CONSTRAINT "factory_memory_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_activity_logs" ("id" TEXT NOT NULL, "activityId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "actorId" TEXT NOT NULL, "action" TEXT NOT NULL, "status" TEXT NOT NULL, "message" TEXT NOT NULL, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "factory_activity_logs_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "factory_activity_logs_activityId_key" ON "factory_activity_logs"("activityId");
CREATE INDEX "factory_activity_logs_organizationId_projectId_idx" ON "factory_activity_logs"("organizationId", "projectId");
ALTER TABLE "factory_activity_logs" ADD CONSTRAINT "factory_activity_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "factory_audit_logs" ("id" TEXT NOT NULL, "auditId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "actorId" TEXT NOT NULL, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "factory_audit_logs_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "factory_audit_logs_auditId_key" ON "factory_audit_logs"("auditId");
CREATE INDEX "factory_audit_logs_organizationId_projectId_idx" ON "factory_audit_logs"("organizationId", "projectId");
CREATE INDEX "factory_audit_logs_organizationId_action_idx" ON "factory_audit_logs"("organizationId", "action");
ALTER TABLE "factory_audit_logs" ADD CONSTRAINT "factory_audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
