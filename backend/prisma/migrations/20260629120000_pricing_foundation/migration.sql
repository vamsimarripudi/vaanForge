CREATE TABLE "plan_feature_flags" (
  "id" TEXT NOT NULL,
  "flagId" TEXT NOT NULL,
  "organizationId" TEXT,
  "planId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "plan_feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_usage_policies" (
  "id" TEXT NOT NULL,
  "policyId" TEXT NOT NULL,
  "organizationId" TEXT,
  "planId" TEXT NOT NULL,
  "metric" "CustomerUsageMetric" NOT NULL,
  "creditCost" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "ownerId" TEXT NOT NULL,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "plan_usage_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_feature_flags_flagId_key" ON "plan_feature_flags"("flagId");
CREATE UNIQUE INDEX "plan_feature_flags_organizationId_planId_key_key" ON "plan_feature_flags"("organizationId", "planId", "key");
CREATE INDEX "plan_feature_flags_planId_enabled_idx" ON "plan_feature_flags"("planId", "enabled");

CREATE UNIQUE INDEX "plan_usage_policies_policyId_key" ON "plan_usage_policies"("policyId");
CREATE UNIQUE INDEX "plan_usage_policies_organizationId_planId_metric_key" ON "plan_usage_policies"("organizationId", "planId", "metric");
CREATE INDEX "plan_usage_policies_planId_metric_enabled_idx" ON "plan_usage_policies"("planId", "metric", "enabled");

ALTER TABLE "plan_feature_flags" ADD CONSTRAINT "plan_feature_flags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "plan_usage_policies" ADD CONSTRAINT "plan_usage_policies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
