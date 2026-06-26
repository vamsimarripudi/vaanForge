CREATE TYPE "AgentDeploymentStatus" AS ENUM ('draft', 'preparing', 'ready', 'deploying', 'verifying', 'live', 'failed', 'rollback_required', 'rolled_back');
CREATE TYPE "AgentDeploymentTargetType" AS ENUM ('AWS_EC2', 'S3_CLOUDFRONT', 'DOCKER_SERVER', 'VERCEL', 'VMNEXUS_CLOUD');
CREATE TYPE "AgentDeploymentCheckStatus" AS ENUM ('passed', 'failed', 'blocked');
CREATE TYPE "AgentDeploymentLogLevel" AS ENUM ('info', 'warning', 'error');
CREATE TYPE "AgentDeploymentEnvironment" AS ENUM ('staging', 'production');
CREATE TYPE "AgentReleaseMigrationStatus" AS ENUM ('pending', 'applied', 'failed');
CREATE TYPE "AgentReleaseBuildStatus" AS ENUM ('pending', 'passed', 'failed');
CREATE TYPE "AgentRollbackStatus" AS ENUM ('requested', 'completed', 'failed');
CREATE TYPE "AgentDeploymentHealthStatus" AS ENUM ('healthy', 'unhealthy');

CREATE TABLE "agent_deployments" (
  "id" TEXT NOT NULL,
  "deploymentId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "status" "AgentDeploymentStatus" NOT NULL,
  "targetId" TEXT NOT NULL,
  "releaseId" TEXT NOT NULL,
  "environment" "AgentDeploymentEnvironment" NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "confirmedProduction" BOOLEAN NOT NULL DEFAULT false,
  "errorMessage" TEXT,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_deployments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_deployment_targets" (
  "id" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "deploymentId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "targetType" "AgentDeploymentTargetType" NOT NULL,
  "name" TEXT NOT NULL,
  "config" JSONB NOT NULL,
  "requiredEnvVars" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_deployment_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_deployment_checks" (
  "id" TEXT NOT NULL,
  "checkId" TEXT NOT NULL,
  "deploymentId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "checkName" TEXT NOT NULL,
  "status" "AgentDeploymentCheckStatus" NOT NULL,
  "reason" TEXT,
  "evidence" JSONB NOT NULL,
  "nextAction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_deployment_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_deployment_logs" (
  "id" TEXT NOT NULL,
  "logId" TEXT NOT NULL,
  "deploymentId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "level" "AgentDeploymentLogLevel" NOT NULL,
  "message" TEXT NOT NULL,
  "evidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_deployment_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_deployment_releases" (
  "id" TEXT NOT NULL,
  "releaseId" TEXT NOT NULL,
  "deploymentId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "previousReleaseId" TEXT,
  "artifactVersion" TEXT NOT NULL,
  "migrationStatus" "AgentReleaseMigrationStatus" NOT NULL,
  "buildStatus" "AgentReleaseBuildStatus" NOT NULL,
  "rollbackMetadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_deployment_releases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_deployment_rollbacks" (
  "id" TEXT NOT NULL,
  "rollbackId" TEXT NOT NULL,
  "deploymentId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "fromReleaseId" TEXT NOT NULL,
  "toReleaseId" TEXT,
  "status" "AgentRollbackStatus" NOT NULL,
  "reason" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_deployment_rollbacks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_deployment_health_checks" (
  "id" TEXT NOT NULL,
  "healthCheckId" TEXT NOT NULL,
  "deploymentId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "status" "AgentDeploymentHealthStatus" NOT NULL,
  "statusCode" INTEGER,
  "responseTimeMs" INTEGER,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_deployment_health_checks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_deployments_deploymentId_key" ON "agent_deployments"("deploymentId");
CREATE INDEX "agent_deployments_organizationId_runId_idx" ON "agent_deployments"("organizationId", "runId");
CREATE INDEX "agent_deployments_organizationId_status_idx" ON "agent_deployments"("organizationId", "status");
CREATE UNIQUE INDEX "agent_deployment_targets_targetId_key" ON "agent_deployment_targets"("targetId");
CREATE INDEX "agent_deployment_targets_organizationId_deploymentId_idx" ON "agent_deployment_targets"("organizationId", "deploymentId");
CREATE UNIQUE INDEX "agent_deployment_checks_checkId_key" ON "agent_deployment_checks"("checkId");
CREATE INDEX "agent_deployment_checks_organizationId_deploymentId_idx" ON "agent_deployment_checks"("organizationId", "deploymentId");
CREATE UNIQUE INDEX "agent_deployment_logs_logId_key" ON "agent_deployment_logs"("logId");
CREATE INDEX "agent_deployment_logs_organizationId_deploymentId_idx" ON "agent_deployment_logs"("organizationId", "deploymentId");
CREATE UNIQUE INDEX "agent_deployment_releases_releaseId_key" ON "agent_deployment_releases"("releaseId");
CREATE INDEX "agent_deployment_releases_organizationId_deploymentId_idx" ON "agent_deployment_releases"("organizationId", "deploymentId");
CREATE UNIQUE INDEX "agent_deployment_rollbacks_rollbackId_key" ON "agent_deployment_rollbacks"("rollbackId");
CREATE INDEX "agent_deployment_rollbacks_organizationId_deploymentId_idx" ON "agent_deployment_rollbacks"("organizationId", "deploymentId");
CREATE UNIQUE INDEX "agent_deployment_health_checks_healthCheckId_key" ON "agent_deployment_health_checks"("healthCheckId");
CREATE INDEX "agent_deployment_health_checks_organizationId_deploymentId_idx" ON "agent_deployment_health_checks"("organizationId", "deploymentId");

ALTER TABLE "agent_deployments" ADD CONSTRAINT "agent_deployments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_deployment_targets" ADD CONSTRAINT "agent_deployment_targets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_deployment_checks" ADD CONSTRAINT "agent_deployment_checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_deployment_logs" ADD CONSTRAINT "agent_deployment_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_deployment_releases" ADD CONSTRAINT "agent_deployment_releases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_deployment_rollbacks" ADD CONSTRAINT "agent_deployment_rollbacks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_deployment_health_checks" ADD CONSTRAINT "agent_deployment_health_checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
