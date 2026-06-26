CREATE TYPE "VaanForgeRunStatus" AS ENUM ('pending', 'analyzing', 'planned', 'failed', 'completed');

CREATE TYPE "VaanForgeOutputType" AS ENUM (
  'product_requirement_document',
  'architecture_plan',
  'folder_structure',
  'database_plan',
  'api_plan',
  'ui_screen_list',
  'sprint_roadmap',
  'codex_implementation_prompt'
);

CREATE TABLE "VaanForgeAgentRun" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" "VaanForgeRunStatus" NOT NULL DEFAULT 'pending',
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "inputRequirements" JSONB NOT NULL,
  "errorMessage" TEXT,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "jobId" TEXT,
  "provider" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VaanForgeAgentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VaanForgeOutput" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "outputType" "VaanForgeOutputType" NOT NULL,
  "title" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VaanForgeOutput_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VaanForgeAuditLog" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "step" TEXT NOT NULL,
  "status" "VaanForgeRunStatus" NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "VaanForgeAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VaanForgeAgentRun_runId_key" ON "VaanForgeAgentRun"("runId");
CREATE INDEX "VaanForgeAgentRun_organizationId_createdAt_idx" ON "VaanForgeAgentRun"("organizationId", "createdAt");
CREATE INDEX "VaanForgeAgentRun_organizationId_status_idx" ON "VaanForgeAgentRun"("organizationId", "status");
CREATE INDEX "VaanForgeAgentRun_organizationId_ownerId_idx" ON "VaanForgeAgentRun"("organizationId", "ownerId");

CREATE UNIQUE INDEX "VaanForgeOutput_runId_outputType_key" ON "VaanForgeOutput"("runId", "outputType");
CREATE INDEX "VaanForgeOutput_organizationId_runId_idx" ON "VaanForgeOutput"("organizationId", "runId");

CREATE INDEX "VaanForgeAuditLog_organizationId_runId_idx" ON "VaanForgeAuditLog"("organizationId", "runId");
CREATE INDEX "VaanForgeAuditLog_runId_createdAt_idx" ON "VaanForgeAuditLog"("runId", "createdAt");

ALTER TABLE "VaanForgeAgentRun"
  ADD CONSTRAINT "VaanForgeAgentRun_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VaanForgeOutput"
  ADD CONSTRAINT "VaanForgeOutput_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "VaanForgeAgentRun"("runId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VaanForgeOutput"
  ADD CONSTRAINT "VaanForgeOutput_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VaanForgeAuditLog"
  ADD CONSTRAINT "VaanForgeAuditLog_runId_fkey"
  FOREIGN KEY ("runId") REFERENCES "VaanForgeAgentRun"("runId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VaanForgeAuditLog"
  ADD CONSTRAINT "VaanForgeAuditLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
