CREATE TYPE "AgentExecutionStatus" AS ENUM ('pending', 'preparing', 'generating', 'validating', 'repairing', 'completed', 'blocked', 'failed');
CREATE TYPE "AgentTaskStatus" AS ENUM ('pending', 'preparing', 'generating', 'validating', 'repairing', 'completed', 'blocked', 'failed');
CREATE TYPE "AgentFileStatus" AS ENUM ('planned', 'written', 'skipped', 'blocked');
CREATE TYPE "AgentValidationStatus" AS ENUM ('passed', 'failed', 'skipped');
CREATE TYPE "AgentErrorStatus" AS ENUM ('open', 'repaired', 'blocked');
CREATE TYPE "AgentRepairStatus" AS ENUM ('attempted', 'succeeded', 'failed');

CREATE TABLE "agent_execution_runs" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "phaseOneRunId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "status" "AgentExecutionStatus" NOT NULL DEFAULT 'pending',
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "approvedBlueprint" JSONB NOT NULL,
  "taskGraph" JSONB NOT NULL,
  "validationSummary" JSONB,
  "executionReport" JSONB,
  "errorMessage" TEXT,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_execution_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_tasks" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "AgentTaskStatus" NOT NULL DEFAULT 'pending',
  "priority" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "dependencies" JSONB NOT NULL,
  "outputPaths" JSONB NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_files" (
  "id" TEXT NOT NULL,
  "fileId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "taskId" TEXT,
  "organizationId" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "status" "AgentFileStatus" NOT NULL DEFAULT 'planned',
  "contentHash" TEXT,
  "previousHash" TEXT,
  "diffSummary" TEXT,
  "humanReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_files_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_validation_runs" (
  "id" TEXT NOT NULL,
  "validationId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "checkName" TEXT NOT NULL,
  "command" TEXT NOT NULL,
  "status" "AgentValidationStatus" NOT NULL,
  "exitCode" INTEGER,
  "output" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_validation_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_errors" (
  "id" TEXT NOT NULL,
  "errorId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "validationId" TEXT,
  "source" TEXT NOT NULL,
  "filePath" TEXT,
  "line" INTEGER,
  "reason" TEXT NOT NULL,
  "fixAttempt" TEXT,
  "status" "AgentErrorStatus" NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_errors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_repair_attempts" (
  "id" TEXT NOT NULL,
  "repairId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "errorId" TEXT,
  "cycle" INTEGER NOT NULL,
  "strategy" TEXT NOT NULL,
  "status" "AgentRepairStatus" NOT NULL,
  "notes" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_repair_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_commits" (
  "id" TEXT NOT NULL,
  "commitId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sha" TEXT,
  "message" TEXT NOT NULL,
  "files" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_commits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_activity_logs" (
  "id" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "step" TEXT NOT NULL,
  "status" "AgentExecutionStatus" NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_execution_runs_executionId_key" ON "agent_execution_runs"("executionId");
CREATE INDEX "agent_execution_runs_organizationId_createdAt_idx" ON "agent_execution_runs"("organizationId", "createdAt");
CREATE INDEX "agent_execution_runs_organizationId_status_idx" ON "agent_execution_runs"("organizationId", "status");
CREATE INDEX "agent_execution_runs_organizationId_ownerId_idx" ON "agent_execution_runs"("organizationId", "ownerId");

CREATE UNIQUE INDEX "agent_tasks_taskId_key" ON "agent_tasks"("taskId");
CREATE INDEX "agent_tasks_organizationId_executionId_idx" ON "agent_tasks"("organizationId", "executionId");
CREATE INDEX "agent_tasks_executionId_status_idx" ON "agent_tasks"("executionId", "status");

CREATE UNIQUE INDEX "agent_files_fileId_key" ON "agent_files"("fileId");
CREATE UNIQUE INDEX "agent_files_executionId_path_key" ON "agent_files"("executionId", "path");
CREATE INDEX "agent_files_organizationId_executionId_idx" ON "agent_files"("organizationId", "executionId");

CREATE UNIQUE INDEX "agent_validation_runs_validationId_key" ON "agent_validation_runs"("validationId");
CREATE INDEX "agent_validation_runs_organizationId_executionId_idx" ON "agent_validation_runs"("organizationId", "executionId");

CREATE UNIQUE INDEX "agent_errors_errorId_key" ON "agent_errors"("errorId");
CREATE INDEX "agent_errors_organizationId_executionId_idx" ON "agent_errors"("organizationId", "executionId");

CREATE UNIQUE INDEX "agent_repair_attempts_repairId_key" ON "agent_repair_attempts"("repairId");
CREATE INDEX "agent_repair_attempts_organizationId_executionId_idx" ON "agent_repair_attempts"("organizationId", "executionId");

CREATE UNIQUE INDEX "agent_commits_commitId_key" ON "agent_commits"("commitId");
CREATE INDEX "agent_commits_organizationId_executionId_idx" ON "agent_commits"("organizationId", "executionId");

CREATE UNIQUE INDEX "agent_activity_logs_activityId_key" ON "agent_activity_logs"("activityId");
CREATE INDEX "agent_activity_logs_organizationId_executionId_idx" ON "agent_activity_logs"("organizationId", "executionId");
CREATE INDEX "agent_activity_logs_executionId_createdAt_idx" ON "agent_activity_logs"("executionId", "createdAt");

ALTER TABLE "agent_execution_runs" ADD CONSTRAINT "agent_execution_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "agent_execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_files" ADD CONSTRAINT "agent_files_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "agent_execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_files" ADD CONSTRAINT "agent_files_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_validation_runs" ADD CONSTRAINT "agent_validation_runs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "agent_execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_validation_runs" ADD CONSTRAINT "agent_validation_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_errors" ADD CONSTRAINT "agent_errors_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "agent_execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_errors" ADD CONSTRAINT "agent_errors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_repair_attempts" ADD CONSTRAINT "agent_repair_attempts_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "agent_execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_repair_attempts" ADD CONSTRAINT "agent_repair_attempts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_commits" ADD CONSTRAINT "agent_commits_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "agent_execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_commits" ADD CONSTRAINT "agent_commits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_activity_logs" ADD CONSTRAINT "agent_activity_logs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "agent_execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_activity_logs" ADD CONSTRAINT "agent_activity_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
