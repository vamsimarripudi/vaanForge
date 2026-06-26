CREATE TYPE "OperationsIncidentSeverity" AS ENUM ('SEV1', 'SEV2', 'SEV3', 'SEV4');
CREATE TYPE "OperationsIncidentStatus" AS ENUM ('open', 'investigating', 'mitigated', 'resolved', 'postmortem');
CREATE TYPE "OperationsCommandAction" AS ENUM ('pause_deployments', 'pause_agent_generation', 'emergency_stop', 'resume_services', 'maintenance_mode', 'scheduled_maintenance', 'restart_agent', 'drain_agent', 'enable_agent', 'disable_agent');

CREATE TABLE "operations_incidents" (
  "id" TEXT NOT NULL,
  "incidentId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" "OperationsIncidentSeverity" NOT NULL,
  "status" "OperationsIncidentStatus" NOT NULL,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "impactedProducts" TEXT[],
  "timeline" JSONB NOT NULL,
  "rootCause" TEXT,
  "resolution" TEXT,
  "postmortem" TEXT,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "operations_incidents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operations_audit_logs" (
  "id" TEXT NOT NULL,
  "auditId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "command" "OperationsCommandAction",
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "operations_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operations_health_checks" (
  "id" TEXT NOT NULL,
  "checkId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "service" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "latencyMs" INTEGER,
  "evidence" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "operations_health_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operations_agent_metrics" (
  "id" TEXT NOT NULL,
  "metricId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "agentName" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "health" TEXT NOT NULL,
  "activeRuns" INTEGER NOT NULL,
  "queuedTasks" INTEGER NOT NULL,
  "errorRate" DOUBLE PRECISION NOT NULL,
  "workloadScore" INTEGER NOT NULL,
  "region" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "operations_agent_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operations_product_metrics" (
  "id" TEXT NOT NULL,
  "metricId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "product" TEXT NOT NULL,
  "activeUsers" INTEGER NOT NULL,
  "activeWorkspaces" INTEGER NOT NULL,
  "apiHealth" TEXT NOT NULL,
  "queueHealth" TEXT NOT NULL,
  "errorRate" DOUBLE PRECISION NOT NULL,
  "buildStatus" TEXT NOT NULL,
  "deploymentStatus" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "operations_product_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operations_business_metrics" (
  "id" TEXT NOT NULL,
  "metricId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "revenue" INTEGER NOT NULL,
  "subscriptions" INTEGER NOT NULL,
  "usageEvents" INTEGER NOT NULL,
  "creditConsumption" INTEGER NOT NULL,
  "aiUsage" INTEGER NOT NULL,
  "customerGrowth" INTEGER NOT NULL,
  "productAdoption" JSONB NOT NULL,
  "churn" INTEGER NOT NULL,
  "mrr" INTEGER NOT NULL,
  "arr" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "operations_business_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "maintenance_windows" (
  "id" TEXT NOT NULL,
  "windowId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "affectedServices" TEXT[],
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "maintenance_windows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "emergency_actions" (
  "id" TEXT NOT NULL,
  "actionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" "OperationsCommandAction" NOT NULL,
  "reason" TEXT NOT NULL,
  "confirmed" BOOLEAN NOT NULL,
  "status" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "emergency_actions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operations_incidents_incidentId_key" ON "operations_incidents"("incidentId");
CREATE INDEX "operations_incidents_organizationId_status_idx" ON "operations_incidents"("organizationId", "status");
CREATE INDEX "operations_incidents_organizationId_severity_idx" ON "operations_incidents"("organizationId", "severity");

CREATE UNIQUE INDEX "operations_audit_logs_auditId_key" ON "operations_audit_logs"("auditId");
CREATE INDEX "operations_audit_logs_organizationId_actorId_idx" ON "operations_audit_logs"("organizationId", "actorId");
CREATE INDEX "operations_audit_logs_organizationId_action_idx" ON "operations_audit_logs"("organizationId", "action");
CREATE INDEX "operations_audit_logs_organizationId_createdAt_idx" ON "operations_audit_logs"("organizationId", "createdAt");

CREATE UNIQUE INDEX "operations_health_checks_checkId_key" ON "operations_health_checks"("checkId");
CREATE INDEX "operations_health_checks_organizationId_service_idx" ON "operations_health_checks"("organizationId", "service");
CREATE INDEX "operations_health_checks_organizationId_createdAt_idx" ON "operations_health_checks"("organizationId", "createdAt");

CREATE UNIQUE INDEX "operations_agent_metrics_metricId_key" ON "operations_agent_metrics"("metricId");
CREATE INDEX "operations_agent_metrics_organizationId_agentId_idx" ON "operations_agent_metrics"("organizationId", "agentId");
CREATE INDEX "operations_agent_metrics_organizationId_health_idx" ON "operations_agent_metrics"("organizationId", "health");

CREATE UNIQUE INDEX "operations_product_metrics_metricId_key" ON "operations_product_metrics"("metricId");
CREATE INDEX "operations_product_metrics_organizationId_product_idx" ON "operations_product_metrics"("organizationId", "product");
CREATE INDEX "operations_product_metrics_organizationId_createdAt_idx" ON "operations_product_metrics"("organizationId", "createdAt");

CREATE UNIQUE INDEX "operations_business_metrics_metricId_key" ON "operations_business_metrics"("metricId");
CREATE INDEX "operations_business_metrics_organizationId_createdAt_idx" ON "operations_business_metrics"("organizationId", "createdAt");

CREATE UNIQUE INDEX "maintenance_windows_windowId_key" ON "maintenance_windows"("windowId");
CREATE INDEX "maintenance_windows_organizationId_status_idx" ON "maintenance_windows"("organizationId", "status");

CREATE UNIQUE INDEX "emergency_actions_actionId_key" ON "emergency_actions"("actionId");
CREATE INDEX "emergency_actions_organizationId_action_idx" ON "emergency_actions"("organizationId", "action");
CREATE INDEX "emergency_actions_organizationId_createdAt_idx" ON "emergency_actions"("organizationId", "createdAt");

ALTER TABLE "operations_incidents" ADD CONSTRAINT "operations_incidents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operations_audit_logs" ADD CONSTRAINT "operations_audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operations_health_checks" ADD CONSTRAINT "operations_health_checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operations_agent_metrics" ADD CONSTRAINT "operations_agent_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operations_product_metrics" ADD CONSTRAINT "operations_product_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operations_business_metrics" ADD CONSTRAINT "operations_business_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "maintenance_windows" ADD CONSTRAINT "maintenance_windows_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emergency_actions" ADD CONSTRAINT "emergency_actions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
