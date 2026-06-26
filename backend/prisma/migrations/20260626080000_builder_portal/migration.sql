CREATE TYPE "BuilderProjectStatus" AS ENUM (
  'draft',
  'requirements_submitted',
  'blueprint_ready',
  'blueprint_approved',
  'blueprint_rejected',
  'coding_started',
  'change_requested',
  'delivered',
  'blocked',
  'failed'
);

CREATE TYPE "BuilderRequirementStatus" AS ENUM ('submitted', 'accepted', 'blocked');
CREATE TYPE "BuilderBlueprintStatus" AS ENUM ('generated', 'approved', 'rejected', 'superseded');
CREATE TYPE "BuilderOutputStatus" AS ENUM ('pending', 'in_progress', 'ready', 'failed');
CREATE TYPE "BuilderChangeRequestStatus" AS ENUM ('requested', 'accepted', 'in_progress', 'completed', 'rejected');

CREATE TABLE "builder_projects" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "templateId" TEXT,
  "agentRunId" TEXT NOT NULL,
  "executionId" TEXT,
  "status" "BuilderProjectStatus" NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "builder_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_project_requirements" (
  "id" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "rawInput" JSONB NOT NULL,
  "normalizedInput" JSONB NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "BuilderRequirementStatus" NOT NULL,
  "missingFields" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "builder_project_requirements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_project_blueprints" (
  "id" TEXT NOT NULL,
  "blueprintId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "agentRunId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "BuilderBlueprintStatus" NOT NULL,
  "content" JSONB NOT NULL,
  "rejectionReason" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "builder_project_blueprints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_project_outputs" (
  "id" TEXT NOT NULL,
  "outputId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "agentRunId" TEXT NOT NULL,
  "executionId" TEXT,
  "outputType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" "BuilderOutputStatus" NOT NULL,
  "version" INTEGER NOT NULL,
  "deliveryDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "builder_project_outputs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_project_change_requests" (
  "id" TEXT NOT NULL,
  "changeRequestId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "targetVersion" INTEGER NOT NULL,
  "status" "BuilderChangeRequestStatus" NOT NULL,
  "agentTaskId" TEXT,
  "nextAction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "builder_project_change_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_project_activity_logs" (
  "id" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "builder_project_activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "builder_projects_projectId_key" ON "builder_projects"("projectId");
CREATE INDEX "builder_projects_organizationId_customerId_idx" ON "builder_projects"("organizationId", "customerId");
CREATE INDEX "builder_projects_organizationId_status_idx" ON "builder_projects"("organizationId", "status");
CREATE INDEX "builder_projects_organizationId_agentRunId_idx" ON "builder_projects"("organizationId", "agentRunId");

CREATE UNIQUE INDEX "builder_project_requirements_requirementId_key" ON "builder_project_requirements"("requirementId");
CREATE UNIQUE INDEX "builder_project_requirements_projectId_version_key" ON "builder_project_requirements"("projectId", "version");
CREATE INDEX "builder_project_requirements_organizationId_customerId_idx" ON "builder_project_requirements"("organizationId", "customerId");

CREATE UNIQUE INDEX "builder_project_blueprints_blueprintId_key" ON "builder_project_blueprints"("blueprintId");
CREATE UNIQUE INDEX "builder_project_blueprints_projectId_version_key" ON "builder_project_blueprints"("projectId", "version");
CREATE INDEX "builder_project_blueprints_organizationId_customerId_idx" ON "builder_project_blueprints"("organizationId", "customerId");
CREATE INDEX "builder_project_blueprints_organizationId_agentRunId_idx" ON "builder_project_blueprints"("organizationId", "agentRunId");

CREATE UNIQUE INDEX "builder_project_outputs_outputId_key" ON "builder_project_outputs"("outputId");
CREATE INDEX "builder_project_outputs_organizationId_customerId_idx" ON "builder_project_outputs"("organizationId", "customerId");
CREATE INDEX "builder_project_outputs_projectId_version_idx" ON "builder_project_outputs"("projectId", "version");

CREATE UNIQUE INDEX "builder_project_change_requests_changeRequestId_key" ON "builder_project_change_requests"("changeRequestId");
CREATE INDEX "builder_project_change_requests_organizationId_customerId_idx" ON "builder_project_change_requests"("organizationId", "customerId");
CREATE INDEX "builder_project_change_requests_projectId_status_idx" ON "builder_project_change_requests"("projectId", "status");

CREATE UNIQUE INDEX "builder_project_activity_logs_activityId_key" ON "builder_project_activity_logs"("activityId");
CREATE INDEX "builder_project_activity_logs_organizationId_projectId_idx" ON "builder_project_activity_logs"("organizationId", "projectId");
CREATE INDEX "builder_project_activity_logs_organizationId_createdAt_idx" ON "builder_project_activity_logs"("organizationId", "createdAt");

ALTER TABLE "builder_projects"
  ADD CONSTRAINT "builder_projects_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "builder_project_requirements"
  ADD CONSTRAINT "builder_project_requirements_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "builder_project_requirements"
  ADD CONSTRAINT "builder_project_requirements_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "builder_project_blueprints"
  ADD CONSTRAINT "builder_project_blueprints_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "builder_project_blueprints"
  ADD CONSTRAINT "builder_project_blueprints_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "builder_project_outputs"
  ADD CONSTRAINT "builder_project_outputs_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "builder_project_outputs"
  ADD CONSTRAINT "builder_project_outputs_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "builder_project_change_requests"
  ADD CONSTRAINT "builder_project_change_requests_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "builder_project_change_requests"
  ADD CONSTRAINT "builder_project_change_requests_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "builder_project_activity_logs"
  ADD CONSTRAINT "builder_project_activity_logs_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "builder_project_activity_logs"
  ADD CONSTRAINT "builder_project_activity_logs_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
