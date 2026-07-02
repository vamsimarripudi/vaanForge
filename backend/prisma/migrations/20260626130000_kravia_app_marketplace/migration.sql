CREATE TABLE "marketplace_publishers" (
  "id" TEXT NOT NULL,
  "publisherId" TEXT NOT NULL,
  "developerId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "profileUrl" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_publishers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_apps" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "publisherId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "appType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "supportUrl" TEXT,
  "requestedPermissions" TEXT[],
  "pricingModel" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "currentVersionId" TEXT,
  "latestVersionNumber" TEXT,
  "reviewRequired" BOOLEAN NOT NULL DEFAULT true,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_apps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_app_versions" (
  "id" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "versionNumber" TEXT NOT NULL,
  "changelog" TEXT NOT NULL,
  "manifest" JSONB NOT NULL,
  "packageChecksum" TEXT NOT NULL,
  "releaseNotes" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "immutable" BOOLEAN NOT NULL DEFAULT true,
  "submittedById" TEXT NOT NULL,
  "approvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_app_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_reviews" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "reviewType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reviewerId" TEXT,
  "evidence" JSONB NOT NULL,
  "reason" TEXT,
  "nextAction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_installs" (
  "id" TEXT NOT NULL,
  "installId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "installedById" TEXT NOT NULL,
  "consentedPermissions" TEXT[],
  "status" TEXT NOT NULL,
  "rollbackVersionId" TEXT,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_installs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_permissions" (
  "id" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_pricing" (
  "id" TEXT NOT NULL,
  "pricingId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "billingMetric" TEXT,
  "revenueSharePercent" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_pricing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_payouts" (
  "id" TEXT NOT NULL,
  "payoutId" TEXT NOT NULL,
  "publisherId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "sourceInstallId" TEXT,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_payouts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketplace_publishers_publisherId_key" ON "marketplace_publishers"("publisherId");
CREATE INDEX "marketplace_publishers_organizationId_status_idx" ON "marketplace_publishers"("organizationId", "status");
CREATE INDEX "marketplace_publishers_organizationId_developerId_idx" ON "marketplace_publishers"("organizationId", "developerId");

CREATE UNIQUE INDEX "marketplace_apps_appId_key" ON "marketplace_apps"("appId");
CREATE UNIQUE INDEX "marketplace_apps_slug_key" ON "marketplace_apps"("slug");
CREATE INDEX "marketplace_apps_organizationId_status_idx" ON "marketplace_apps"("organizationId", "status");
CREATE INDEX "marketplace_apps_organizationId_appType_idx" ON "marketplace_apps"("organizationId", "appType");
CREATE INDEX "marketplace_apps_publisherId_idx" ON "marketplace_apps"("publisherId");

CREATE UNIQUE INDEX "marketplace_app_versions_versionId_key" ON "marketplace_app_versions"("versionId");
CREATE UNIQUE INDEX "marketplace_app_versions_appId_versionNumber_key" ON "marketplace_app_versions"("appId", "versionNumber");
CREATE INDEX "marketplace_app_versions_organizationId_status_idx" ON "marketplace_app_versions"("organizationId", "status");

CREATE UNIQUE INDEX "marketplace_reviews_reviewId_key" ON "marketplace_reviews"("reviewId");
CREATE UNIQUE INDEX "marketplace_reviews_versionId_reviewType_key" ON "marketplace_reviews"("versionId", "reviewType");
CREATE INDEX "marketplace_reviews_organizationId_status_idx" ON "marketplace_reviews"("organizationId", "status");

CREATE UNIQUE INDEX "marketplace_installs_installId_key" ON "marketplace_installs"("installId");
CREATE INDEX "marketplace_installs_organizationId_workspaceId_idx" ON "marketplace_installs"("organizationId", "workspaceId");
CREATE INDEX "marketplace_installs_organizationId_status_idx" ON "marketplace_installs"("organizationId", "status");

CREATE UNIQUE INDEX "marketplace_permissions_permissionId_key" ON "marketplace_permissions"("permissionId");
CREATE UNIQUE INDEX "marketplace_permissions_appId_key_key" ON "marketplace_permissions"("appId", "key");
CREATE INDEX "marketplace_permissions_organizationId_riskLevel_idx" ON "marketplace_permissions"("organizationId", "riskLevel");

CREATE UNIQUE INDEX "marketplace_pricing_pricingId_key" ON "marketplace_pricing"("pricingId");
CREATE UNIQUE INDEX "marketplace_pricing_appId_key" ON "marketplace_pricing"("appId");
CREATE INDEX "marketplace_pricing_organizationId_model_idx" ON "marketplace_pricing"("organizationId", "model");

CREATE UNIQUE INDEX "marketplace_payouts_payoutId_key" ON "marketplace_payouts"("payoutId");
CREATE INDEX "marketplace_payouts_organizationId_status_idx" ON "marketplace_payouts"("organizationId", "status");
CREATE INDEX "marketplace_payouts_publisherId_idx" ON "marketplace_payouts"("publisherId");

ALTER TABLE "marketplace_publishers" ADD CONSTRAINT "marketplace_publishers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_apps" ADD CONSTRAINT "marketplace_apps_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_apps" ADD CONSTRAINT "marketplace_apps_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "marketplace_publishers"("publisherId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_app_versions" ADD CONSTRAINT "marketplace_app_versions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_app_versions" ADD CONSTRAINT "marketplace_app_versions_appId_fkey" FOREIGN KEY ("appId") REFERENCES "marketplace_apps"("appId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_appId_fkey" FOREIGN KEY ("appId") REFERENCES "marketplace_apps"("appId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "marketplace_app_versions"("versionId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_appId_fkey" FOREIGN KEY ("appId") REFERENCES "marketplace_apps"("appId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "marketplace_app_versions"("versionId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_permissions" ADD CONSTRAINT "marketplace_permissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_permissions" ADD CONSTRAINT "marketplace_permissions_appId_fkey" FOREIGN KEY ("appId") REFERENCES "marketplace_apps"("appId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_pricing" ADD CONSTRAINT "marketplace_pricing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_pricing" ADD CONSTRAINT "marketplace_pricing_appId_fkey" FOREIGN KEY ("appId") REFERENCES "marketplace_apps"("appId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_payouts" ADD CONSTRAINT "marketplace_payouts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_payouts" ADD CONSTRAINT "marketplace_payouts_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "marketplace_publishers"("publisherId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_payouts" ADD CONSTRAINT "marketplace_payouts_appId_fkey" FOREIGN KEY ("appId") REFERENCES "marketplace_apps"("appId") ON DELETE RESTRICT ON UPDATE CASCADE;
