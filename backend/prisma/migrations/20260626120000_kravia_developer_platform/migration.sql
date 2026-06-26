CREATE TYPE "DeveloperAppStatus" AS ENUM ('active', 'disabled');
CREATE TYPE "ApiKeyStatus" AS ENUM ('active', 'revoked', 'rotated');
CREATE TYPE "PluginStatus" AS ENUM ('draft', 'review', 'published', 'disabled');
CREATE TYPE "WebhookEndpointStatus" AS ENUM ('active', 'paused', 'failed');

CREATE TABLE "developer_accounts" (
  "id" TEXT NOT NULL,
  "developerId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "developer_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "developer_apps" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "developerId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "DeveloperAppStatus" NOT NULL,
  "redirectUris" TEXT[],
  "scopes" TEXT[],
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "developer_apps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_keys" (
  "id" TEXT NOT NULL,
  "keyId" TEXT NOT NULL,
  "developerId" TEXT NOT NULL,
  "appId" TEXT,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "scopes" TEXT[],
  "status" "ApiKeyStatus" NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "rotatedFromKeyId" TEXT,
  "ipAllowlist" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oauth_clients" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "developerId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "clientSecretHash" TEXT NOT NULL,
  "redirectUris" TEXT[],
  "scopes" TEXT[],
  "grantTypes" TEXT[],
  "status" "DeveloperAppStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sdk_versions" (
  "id" TEXT NOT NULL,
  "sdkId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "packageName" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "apiSpecVersion" TEXT NOT NULL,
  "downloadUrl" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "generatedFromSpec" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sdk_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plugin_registry" (
  "id" TEXT NOT NULL,
  "pluginId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "developerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "pluginType" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "manifest" JSONB NOT NULL,
  "permissions" TEXT[],
  "status" "PluginStatus" NOT NULL,
  "reviewNotes" TEXT,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plugin_registry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_endpoints" (
  "id" TEXT NOT NULL,
  "webhookId" TEXT NOT NULL,
  "developerId" TEXT NOT NULL,
  "appId" TEXT,
  "organizationId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "events" TEXT[],
  "signingSecretHash" TEXT NOT NULL,
  "status" "WebhookEndpointStatus" NOT NULL,
  "retryPolicy" JSONB NOT NULL,
  "lastDeliveryAt" TIMESTAMP(3),
  "failureCount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_usage_logs" (
  "id" TEXT NOT NULL,
  "usageId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "developerId" TEXT,
  "appId" TEXT,
  "keyId" TEXT,
  "apiVersion" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "requestId" TEXT NOT NULL,
  "responseStandardized" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_rate_limits" (
  "id" TEXT NOT NULL,
  "limitId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "developerId" TEXT,
  "keyId" TEXT,
  "windowKey" TEXT NOT NULL,
  "limit" INTEGER NOT NULL,
  "used" INTEGER NOT NULL,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "api_rate_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "developer_accounts_developerId_key" ON "developer_accounts"("developerId");
CREATE UNIQUE INDEX "developer_accounts_organizationId_userId_key" ON "developer_accounts"("organizationId", "userId");
CREATE INDEX "developer_accounts_organizationId_status_idx" ON "developer_accounts"("organizationId", "status");

CREATE UNIQUE INDEX "developer_apps_appId_key" ON "developer_apps"("appId");
CREATE INDEX "developer_apps_organizationId_developerId_idx" ON "developer_apps"("organizationId", "developerId");
CREATE INDEX "developer_apps_organizationId_status_idx" ON "developer_apps"("organizationId", "status");

CREATE UNIQUE INDEX "api_keys_keyId_key" ON "api_keys"("keyId");
CREATE INDEX "api_keys_organizationId_developerId_idx" ON "api_keys"("organizationId", "developerId");
CREATE INDEX "api_keys_organizationId_status_idx" ON "api_keys"("organizationId", "status");
CREATE INDEX "api_keys_prefix_idx" ON "api_keys"("prefix");

CREATE UNIQUE INDEX "oauth_clients_clientId_key" ON "oauth_clients"("clientId");
CREATE INDEX "oauth_clients_organizationId_appId_idx" ON "oauth_clients"("organizationId", "appId");

CREATE UNIQUE INDEX "sdk_versions_sdkId_key" ON "sdk_versions"("sdkId");
CREATE INDEX "sdk_versions_organizationId_language_idx" ON "sdk_versions"("organizationId", "language");
CREATE UNIQUE INDEX "sdk_versions_organizationId_language_version_key" ON "sdk_versions"("organizationId", "language", "version");

CREATE UNIQUE INDEX "plugin_registry_pluginId_key" ON "plugin_registry"("pluginId");
CREATE INDEX "plugin_registry_organizationId_pluginType_idx" ON "plugin_registry"("organizationId", "pluginType");
CREATE INDEX "plugin_registry_organizationId_status_idx" ON "plugin_registry"("organizationId", "status");

CREATE UNIQUE INDEX "webhook_endpoints_webhookId_key" ON "webhook_endpoints"("webhookId");
CREATE INDEX "webhook_endpoints_organizationId_developerId_idx" ON "webhook_endpoints"("organizationId", "developerId");
CREATE INDEX "webhook_endpoints_organizationId_status_idx" ON "webhook_endpoints"("organizationId", "status");

CREATE UNIQUE INDEX "api_usage_logs_usageId_key" ON "api_usage_logs"("usageId");
CREATE INDEX "api_usage_logs_organizationId_developerId_idx" ON "api_usage_logs"("organizationId", "developerId");
CREATE INDEX "api_usage_logs_organizationId_apiVersion_idx" ON "api_usage_logs"("organizationId", "apiVersion");
CREATE INDEX "api_usage_logs_organizationId_createdAt_idx" ON "api_usage_logs"("organizationId", "createdAt");

CREATE UNIQUE INDEX "api_rate_limits_limitId_key" ON "api_rate_limits"("limitId");
CREATE UNIQUE INDEX "api_rate_limits_organizationId_windowKey_key" ON "api_rate_limits"("organizationId", "windowKey");
CREATE INDEX "api_rate_limits_organizationId_keyId_idx" ON "api_rate_limits"("organizationId", "keyId");

ALTER TABLE "developer_accounts" ADD CONSTRAINT "developer_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "developer_apps" ADD CONSTRAINT "developer_apps_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "developer_accounts"("developerId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "developer_apps" ADD CONSTRAINT "developer_apps_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "developer_accounts"("developerId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_appId_fkey" FOREIGN KEY ("appId") REFERENCES "developer_apps"("appId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_appId_fkey" FOREIGN KEY ("appId") REFERENCES "developer_apps"("appId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "developer_accounts"("developerId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sdk_versions" ADD CONSTRAINT "sdk_versions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plugin_registry" ADD CONSTRAINT "plugin_registry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plugin_registry" ADD CONSTRAINT "plugin_registry_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "developer_accounts"("developerId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "developer_accounts"("developerId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_appId_fkey" FOREIGN KEY ("appId") REFERENCES "developer_apps"("appId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "api_rate_limits" ADD CONSTRAINT "api_rate_limits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
