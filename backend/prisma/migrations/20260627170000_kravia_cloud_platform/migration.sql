CREATE TABLE "service_registry" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "componentType" TEXT NOT NULL,
  "health" TEXT NOT NULL,
  "dependencies" TEXT[],
  "region" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "lastHeartbeatAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_registry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "service_registry_serviceId_key" ON "service_registry"("serviceId");
CREATE INDEX "service_registry_organizationId_componentType_idx" ON "service_registry"("organizationId", "componentType");
CREATE INDEX "service_registry_organizationId_health_idx" ON "service_registry"("organizationId", "health");

CREATE TABLE "event_bus" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "producerServiceId" TEXT NOT NULL,
  "consumerServiceId" TEXT,
  "status" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "attempts" INTEGER NOT NULL,
  "traceId" TEXT NOT NULL,
  "nextAction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_bus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_bus_eventId_key" ON "event_bus"("eventId");
CREATE INDEX "event_bus_organizationId_topic_idx" ON "event_bus"("organizationId", "topic");
CREATE INDEX "event_bus_organizationId_status_idx" ON "event_bus"("organizationId", "status");
CREATE INDEX "event_bus_traceId_idx" ON "event_bus"("traceId");

CREATE TABLE "storage_objects" (
  "id" TEXT NOT NULL,
  "objectId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "bucket" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "objectType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "contentType" TEXT NOT NULL,
  "encrypted" BOOLEAN NOT NULL,
  "version" INTEGER NOT NULL,
  "lifecyclePolicy" TEXT NOT NULL,
  "cdnUrl" TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "storage_objects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "storage_objects_objectId_key" ON "storage_objects"("objectId");
CREATE INDEX "storage_objects_organizationId_bucket_idx" ON "storage_objects"("organizationId", "bucket");
CREATE INDEX "storage_objects_organizationId_objectType_idx" ON "storage_objects"("organizationId", "objectType");

CREATE TABLE "secret_store" (
  "id" TEXT NOT NULL,
  "secretId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "rotationDueAt" TIMESTAMP(3) NOT NULL,
  "lastRotatedAt" TIMESTAMP(3),
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "secret_store_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "secret_store_secretId_key" ON "secret_store"("secretId");
CREATE INDEX "secret_store_organizationId_category_idx" ON "secret_store"("organizationId", "category");
CREATE INDEX "secret_store_organizationId_status_idx" ON "secret_store"("organizationId", "status");

CREATE TABLE "configuration" (
  "id" TEXT NOT NULL,
  "configId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "configuration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "configuration_configId_key" ON "configuration"("configId");
CREATE UNIQUE INDEX "configuration_organizationId_key_environment_key" ON "configuration"("organizationId", "key", "environment");
CREATE INDEX "configuration_organizationId_scope_idx" ON "configuration"("organizationId", "scope");

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "traceId" TEXT NOT NULL,
  "nextAction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notifications_messageId_key" ON "notifications"("messageId");
CREATE INDEX "notifications_organizationId_channel_idx" ON "notifications"("organizationId", "channel");
CREATE INDEX "notifications_organizationId_status_idx" ON "notifications"("organizationId", "status");

CREATE TABLE "ai_runs" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "jobType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "artifactId" TEXT,
  "releaseId" TEXT,
  "validationEvidence" JSONB NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_runs_jobId_key" ON "ai_runs"("jobId");
CREATE INDEX "ai_runs_organizationId_status_idx" ON "ai_runs"("organizationId", "status");

CREATE TABLE "build_jobs" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "artifactId" TEXT,
  "validationEvidence" JSONB NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "build_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "build_jobs_jobId_key" ON "build_jobs"("jobId");
CREATE INDEX "build_jobs_organizationId_status_idx" ON "build_jobs"("organizationId", "status");

CREATE TABLE "deployments" (
  "id" TEXT NOT NULL,
  "deploymentId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "releaseId" TEXT,
  "validationEvidence" JSONB NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deployments_deploymentId_key" ON "deployments"("deploymentId");
CREATE INDEX "deployments_organizationId_status_idx" ON "deployments"("organizationId", "status");

CREATE TABLE "health_checks" (
  "id" TEXT NOT NULL,
  "metricId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "componentType" TEXT NOT NULL,
  "metricName" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "traceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "health_checks_metricId_key" ON "health_checks"("metricId");
CREATE INDEX "health_checks_organizationId_componentType_idx" ON "health_checks"("organizationId", "componentType");

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "auditId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "audit_logs_auditId_key" ON "audit_logs"("auditId");
CREATE INDEX "audit_logs_organizationId_action_idx" ON "audit_logs"("organizationId", "action");
CREATE INDEX "audit_logs_organizationId_actorId_idx" ON "audit_logs"("organizationId", "actorId");

CREATE TABLE "billing" (
  "id" TEXT NOT NULL,
  "billingId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "product" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "subscriptions" INTEGER NOT NULL,
  "marketplace" INTEGER NOT NULL,
  "credits" INTEGER NOT NULL,
  "licensing" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_billingId_key" ON "billing"("billingId");
CREATE INDEX "billing_organizationId_status_idx" ON "billing"("organizationId", "status");

CREATE TABLE "console_preferences" (
  "id" TEXT NOT NULL,
  "preferenceId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "landingModule" TEXT NOT NULL,
  "visibleModules" TEXT[],
  "themeMode" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "console_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "console_preferences_preferenceId_key" ON "console_preferences"("preferenceId");
CREATE UNIQUE INDEX "console_preferences_organizationId_userId_key" ON "console_preferences"("organizationId", "userId");
