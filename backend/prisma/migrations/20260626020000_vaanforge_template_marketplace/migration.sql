CREATE TYPE "AgentTemplateStatus" AS ENUM ('draft', 'pending_review', 'published', 'unpublished', 'archived');
CREATE TYPE "AgentTemplateReleaseStatus" AS ENUM ('draft', 'approved', 'rejected', 'released', 'rolled_back');
CREATE TYPE "AgentTemplateQualityStatus" AS ENUM ('passed', 'failed', 'pending');

CREATE TABLE "agent_templates" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "previewImage" TEXT,
  "stack" JSONB NOT NULL,
  "requiredInputs" JSONB NOT NULL,
  "optionalInputs" JSONB NOT NULL,
  "includedScreens" JSONB NOT NULL,
  "includedApis" JSONB NOT NULL,
  "databaseModels" JSONB NOT NULL,
  "designTokens" JSONB NOT NULL,
  "securityRules" JSONB NOT NULL,
  "validationRules" JSONB NOT NULL,
  "status" "AgentTemplateStatus" NOT NULL DEFAULT 'draft',
  "version" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "approvedBy" TEXT,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_template_versions" (
  "id" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "changelog" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdBy" TEXT NOT NULL,
  "approvedBy" TEXT,
  "releaseStatus" "AgentTemplateReleaseStatus" NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_template_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_template_inputs" (
  "id" TEXT NOT NULL,
  "inputId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "inputType" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "validation" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_template_inputs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_template_files" (
  "id" TEXT NOT NULL,
  "fileId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "content" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_template_files_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_template_quality_checks" (
  "id" TEXT NOT NULL,
  "checkId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "checkName" TEXT NOT NULL,
  "status" "AgentTemplateQualityStatus" NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_template_quality_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_template_usage_logs" (
  "id" TEXT NOT NULL,
  "usageId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "runId" TEXT,
  "inputValues" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_template_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_template_reviews" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_template_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_templates_templateId_key" ON "agent_templates"("templateId");
CREATE UNIQUE INDEX "agent_templates_organizationId_slug_key" ON "agent_templates"("organizationId", "slug");
CREATE INDEX "agent_templates_organizationId_status_idx" ON "agent_templates"("organizationId", "status");
CREATE INDEX "agent_templates_organizationId_category_idx" ON "agent_templates"("organizationId", "category");
CREATE UNIQUE INDEX "agent_template_versions_versionId_key" ON "agent_template_versions"("versionId");
CREATE INDEX "agent_template_versions_organizationId_templateId_idx" ON "agent_template_versions"("organizationId", "templateId");
CREATE UNIQUE INDEX "agent_template_inputs_inputId_key" ON "agent_template_inputs"("inputId");
CREATE UNIQUE INDEX "agent_template_inputs_templateId_key_key" ON "agent_template_inputs"("templateId", "key");
CREATE UNIQUE INDEX "agent_template_files_fileId_key" ON "agent_template_files"("fileId");
CREATE INDEX "agent_template_files_organizationId_templateId_idx" ON "agent_template_files"("organizationId", "templateId");
CREATE UNIQUE INDEX "agent_template_quality_checks_checkId_key" ON "agent_template_quality_checks"("checkId");
CREATE INDEX "agent_template_quality_checks_organizationId_templateId_idx" ON "agent_template_quality_checks"("organizationId", "templateId");
CREATE UNIQUE INDEX "agent_template_usage_logs_usageId_key" ON "agent_template_usage_logs"("usageId");
CREATE INDEX "agent_template_usage_logs_organizationId_templateId_idx" ON "agent_template_usage_logs"("organizationId", "templateId");
CREATE UNIQUE INDEX "agent_template_reviews_reviewId_key" ON "agent_template_reviews"("reviewId");
CREATE INDEX "agent_template_reviews_organizationId_templateId_idx" ON "agent_template_reviews"("organizationId", "templateId");

ALTER TABLE "agent_templates" ADD CONSTRAINT "agent_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_template_versions" ADD CONSTRAINT "agent_template_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "agent_templates"("templateId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_template_versions" ADD CONSTRAINT "agent_template_versions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_template_inputs" ADD CONSTRAINT "agent_template_inputs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "agent_templates"("templateId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_template_inputs" ADD CONSTRAINT "agent_template_inputs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_template_files" ADD CONSTRAINT "agent_template_files_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "agent_templates"("templateId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_template_files" ADD CONSTRAINT "agent_template_files_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_template_quality_checks" ADD CONSTRAINT "agent_template_quality_checks_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "agent_templates"("templateId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_template_quality_checks" ADD CONSTRAINT "agent_template_quality_checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_template_usage_logs" ADD CONSTRAINT "agent_template_usage_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "agent_templates"("templateId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_template_usage_logs" ADD CONSTRAINT "agent_template_usage_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_template_reviews" ADD CONSTRAINT "agent_template_reviews_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "agent_templates"("templateId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_template_reviews" ADD CONSTRAINT "agent_template_reviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
