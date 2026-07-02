const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

const planConfiguration = read("backend/src/modules/billing/plan-configuration.service.ts");
const billingService = read("backend/src/modules/billing/billing.service.ts");
const billingRoutes = read("backend/src/modules/billing/billing.routes.ts");
const usageMiddleware = read("backend/src/modules/billing/usage-limit.middleware.ts");
const builderRoutes = read("backend/src/modules/builder/builder.routes.ts");
const plansService = read("backend/src/modules/plans/plans.service.ts");
const workspaceApp = read("frontend/src/app/Workspace.tsx");
const appRoutes = read("frontend/src/app/App.tsx");
const backendPackage = read("backend/package.json");
const prismaSchema = read("backend/prisma/schema.prisma");

for (const removedFile of [
  "backend/src/config/plans/education-suite.plans.ts",
  "backend/src/config/plans/vmetron-suite.plans.ts",
  "frontend/src/config/plans/educationSuitePlans.ts",
  "frontend/src/config/plans/vmetronSuitePlans.ts"
]) {
  if (exists(removedFile)) failures.push(`${removedFile} must not exist; plan catalogs must be backend-API driven from plan-configuration.service.ts`);
}

for (const required of [
  "class PlanConfigurationService",
  "billingPlanSeeds()",
  "suitePlans(",
  "featureFlagsFor(",
  "usagePoliciesFor(",
  "creditCost(",
  '"free_trial"',
  '"starter"',
  '"pro"',
  '"business"',
  '"enterprise"',
  '"custom"'
]) {
  if (!planConfiguration.includes(required)) failures.push(`plan-configuration.service.ts must include ${required}`);
}

for (const forbidden of ["const defaultPlanSeeds", "const creditCost", "function plan("]) {
  if (billingService.includes(forbidden)) failures.push(`billing.service.ts must not own pricing seed logic: ${forbidden}`);
}

for (const required of [
  "planConfigurationService.billingPlanSeeds()",
  "planConfigurationService.featureFlagsFor",
  "planConfigurationService.usagePoliciesFor",
  "canConsume(",
  "updateFeatureFlags(",
  "featureFlags(",
  "usagePolicies("
]) {
  if (!billingService.includes(required)) failures.push(`billing.service.ts must use centralized pricing foundation: ${required}`);
}

for (const required of [
  'get("/plans/:planId/feature-flags"',
  'patch("/plans/:planId/feature-flags"',
  'get("/plans/:planId/usage-policies"',
  'requirePermission("billing:manage")',
  "planFeatureFlagsPatchSchema"
]) {
  if (!billingRoutes.includes(required)) failures.push(`billing.routes.ts must expose protected admin pricing controls: ${required}`);
}

for (const required of [
  "requireUsageLimit",
  "billingService.canConsume",
  'status(402)',
  "Usage limit blocked this action"
]) {
  if (!usageMiddleware.includes(required)) failures.push(`usage-limit.middleware.ts must enforce server-side plan limits: ${required}`);
}

for (const required of [
  'requireUsageLimit({ metric: "agent_run" })',
  'requireUsageLimit({ metric: "regeneration" })',
  'requireUsageLimit({ metric: "build_minute" })'
]) {
  if (!builderRoutes.includes(required)) failures.push(`builder routes must preflight paid protected actions: ${required}`);
}

if (!plansService.includes("planConfigurationService.suitePlans") || !plansService.includes("planConfigurationService.findSuitePlan")) {
  failures.push("plans.service.ts must read suite plans from planConfigurationService");
}

for (const forbidden of ["@/config/plans", "educationSuitePlans", "vmetronSuitePlans", "const PLANS =", "const USAGE ="]) {
  if (workspaceApp.includes(forbidden) || appRoutes.includes(forbidden)) failures.push(`frontend pricing must not import or define static plan data: ${forbidden}`);
}

for (const required of [
  'apiClient<BillingPlan[]>("/billing/builder/plans")',
  'apiClient<BillingUsage>("/billing/builder/usage")',
  "Loaded from the VaanForge billing API",
  "Plans are not available in this session",
  "No active plans",
  "Most Popular"
]) {
  if (!workspaceApp.includes(required)) failures.push(`Workspace pricing view must render API-loaded VaanForge plans: ${required}`);
}

for (const required of ['if (clean === "builder/billing/plans") return "pricing"', 'pricing: "/pricing"']) {
  if (!appRoutes.includes(required)) failures.push(`App route map must expose pricing route: ${required}`);
}

for (const required of ["PlanFeatureFlag", "PlanUsagePolicy", '@@map("plan_feature_flags")', '@@map("plan_usage_policies")']) {
  if (!prismaSchema.includes(required)) failures.push(`Prisma schema must include pricing foundation model ${required}`);
}

if (!backendPackage.includes("pricing-foundation.test.ts")) {
  failures.push("backend test script must include pricing-foundation.test.ts");
}

if (failures.length) {
  console.error(`Pricing contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Pricing contract check passed for centralized plan configuration, API-fed pricing UI, admin flags, usage policies, middleware, and tests.");
