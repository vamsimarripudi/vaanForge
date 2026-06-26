CREATE TYPE "VFormixAgentStatus" AS ENUM ('pending', 'mapping', 'validating', 'template_matched', 'blueprint_generated', 'approval_required', 'coding_started', 'completed', 'failed', 'blocked');
CREATE TYPE "VFormixAgentConfigStatus" AS ENUM ('draft', 'active', 'paused');
CREATE TYPE "VFormixAgentTriggerType" AS ENUM ('submission', 'manual', 'approval', 'template_selection');
CREATE TYPE "VFormixAgentWebhookStatus" AS ENUM ('accepted', 'rejected', 'failed');

CREATE TABLE "vformix_agent_configs" (
  "id" TEXT NOT NULL,
  "configId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "defaultTemplateId" TEXT,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3),
  "status" "VFormixAgentConfigStatus" NOT NULL DEFAULT 'draft',
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vformix_agent_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vformix_agent_field_mappings" (
  "id" TEXT NOT NULL,
  "mappingId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "formFieldKey" TEXT NOT NULL,
  "agentFieldPath" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "normalizer" TEXT NOT NULL,
  "fallbackValue" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vformix_agent_field_mappings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vformix_agent_triggers" (
  "id" TEXT NOT NULL,
  "triggerId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "triggerType" "VFormixAgentTriggerType" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vformix_agent_triggers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vformix_agent_submission_links" (
  "id" TEXT NOT NULL,
  "linkId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "rawSubmission" JSONB NOT NULL,
  "cleanedAgentInput" JSONB,
  "templateId" TEXT,
  "templateMatchReason" TEXT,
  "runId" TEXT,
  "executionId" TEXT,
  "status" "VFormixAgentStatus" NOT NULL,
  "errorMessage" TEXT,
  "missingFields" TEXT[],
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vformix_agent_submission_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vformix_agent_mapping_errors" (
  "id" TEXT NOT NULL,
  "errorId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "nextAction" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vformix_agent_mapping_errors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vformix_agent_webhook_logs" (
  "id" TEXT NOT NULL,
  "webhookId" TEXT NOT NULL,
  "organizationId" TEXT,
  "formId" TEXT,
  "submissionId" TEXT,
  "eventType" TEXT NOT NULL,
  "status" "VFormixAgentWebhookStatus" NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vformix_agent_webhook_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vformix_agent_configs_configId_key" ON "vformix_agent_configs"("configId");
CREATE UNIQUE INDEX "vformix_agent_configs_organizationId_formId_key" ON "vformix_agent_configs"("organizationId", "formId");
CREATE INDEX "vformix_agent_configs_organizationId_status_idx" ON "vformix_agent_configs"("organizationId", "status");
CREATE UNIQUE INDEX "vformix_agent_field_mappings_mappingId_key" ON "vformix_agent_field_mappings"("mappingId");
CREATE INDEX "vformix_agent_field_mappings_organizationId_formId_idx" ON "vformix_agent_field_mappings"("organizationId", "formId");
CREATE UNIQUE INDEX "vformix_agent_field_mappings_organizationId_formId_formFieldKey_agentFieldPath_key" ON "vformix_agent_field_mappings"("organizationId", "formId", "formFieldKey", "agentFieldPath");
CREATE UNIQUE INDEX "vformix_agent_triggers_triggerId_key" ON "vformix_agent_triggers"("triggerId");
CREATE INDEX "vformix_agent_triggers_organizationId_formId_idx" ON "vformix_agent_triggers"("organizationId", "formId");
CREATE UNIQUE INDEX "vformix_agent_triggers_organizationId_formId_triggerType_key" ON "vformix_agent_triggers"("organizationId", "formId", "triggerType");
CREATE UNIQUE INDEX "vformix_agent_submission_links_linkId_key" ON "vformix_agent_submission_links"("linkId");
CREATE INDEX "vformix_agent_submission_links_organizationId_formId_idx" ON "vformix_agent_submission_links"("organizationId", "formId");
CREATE INDEX "vformix_agent_submission_links_organizationId_submissionId_idx" ON "vformix_agent_submission_links"("organizationId", "submissionId");
CREATE UNIQUE INDEX "vformix_agent_mapping_errors_errorId_key" ON "vformix_agent_mapping_errors"("errorId");
CREATE INDEX "vformix_agent_mapping_errors_organizationId_submissionId_idx" ON "vformix_agent_mapping_errors"("organizationId", "submissionId");
CREATE UNIQUE INDEX "vformix_agent_webhook_logs_webhookId_key" ON "vformix_agent_webhook_logs"("webhookId");
CREATE INDEX "vformix_agent_webhook_logs_organizationId_formId_idx" ON "vformix_agent_webhook_logs"("organizationId", "formId");
CREATE INDEX "vformix_agent_webhook_logs_submissionId_idx" ON "vformix_agent_webhook_logs"("submissionId");

ALTER TABLE "vformix_agent_configs" ADD CONSTRAINT "vformix_agent_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vformix_agent_field_mappings" ADD CONSTRAINT "vformix_agent_field_mappings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vformix_agent_triggers" ADD CONSTRAINT "vformix_agent_triggers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vformix_agent_submission_links" ADD CONSTRAINT "vformix_agent_submission_links_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vformix_agent_mapping_errors" ADD CONSTRAINT "vformix_agent_mapping_errors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vformix_agent_webhook_logs" ADD CONSTRAINT "vformix_agent_webhook_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
