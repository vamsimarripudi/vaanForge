const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const planFiles = [
  "backend/src/config/plans/education-suite.plans.ts",
  "backend/src/config/plans/vmetron-suite.plans.ts",
  "frontend/src/config/plans/educationSuitePlans.ts",
  "frontend/src/config/plans/vmetronSuitePlans.ts"
];

const backendEducation = fs.readFileSync(path.join(rootDir, planFiles[0]), "utf8");
const backendVmetron = fs.readFileSync(path.join(rootDir, planFiles[1]), "utf8");
const frontendEducation = fs.readFileSync(path.join(rootDir, planFiles[2]), "utf8");
const frontendVmetron = fs.readFileSync(path.join(rootDir, planFiles[3]), "utf8");
const billingService = fs.readFileSync(path.join(rootDir, "backend", "src", "modules", "billing", "billing.service.ts"), "utf8");
const billingRoutes = fs.readFileSync(path.join(rootDir, "backend", "src", "modules", "billing", "billing.routes.ts"), "utf8");
const planGrid = fs.readFileSync(path.join(rootDir, "frontend", "src", "features", "billing", "components", "PlanGrid.tsx"), "utf8");
const pricingPage = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "pricing", "page.tsx"), "utf8");
const knownIssues = fs.readFileSync(path.join(rootDir, "docs", "KNOWN-ISSUES.md"), "utf8");
const finalAudit = fs.readFileSync(path.join(rootDir, "docs", "FINAL-AUDIT.md"), "utf8");

const expectedPlanIds = [
  "education-starter",
  "education-growth",
  "education-enterprise",
  "vmetron-starter",
  "vmetron-growth",
  "vmetron-enterprise"
];

const failures = [];

function extractPlanIds(source) {
  return [...source.matchAll(/planId: "([^"]+)"/g)].map((match) => match[1]);
}

const backendIds = [...extractPlanIds(backendEducation), ...extractPlanIds(backendVmetron)].sort();
const frontendIds = [...extractPlanIds(frontendEducation), ...extractPlanIds(frontendVmetron)].sort();

if (JSON.stringify(backendIds) !== JSON.stringify([...expectedPlanIds].sort())) {
  failures.push("backend plan catalog must contain the expected six launch placeholder plans");
}

if (JSON.stringify(frontendIds) !== JSON.stringify(backendIds)) {
  failures.push("frontend plan catalog must match backend plan ids");
}

for (const file of planFiles) {
  const source = fs.readFileSync(path.join(rootDir, file), "utf8");
  const monthlyNulls = (source.match(/monthlyPrice: null/g) || []).length;
  const yearlyNulls = (source.match(/yearlyPrice: null/g) || []).length;
  const planCount = extractPlanIds(source).length;
  if (monthlyNulls !== planCount || yearlyNulls !== planCount) {
    failures.push(`${file} must keep every current launch plan price as null until commercial approval`);
  }
  if ((source.match(/currency: "INR"/g) || []).length !== planCount) {
    failures.push(`${file} must keep all current launch plans in INR`);
  }
}

for (const required of [
  "startTrial",
  'status: "TRIAL_STARTED"',
  'status: "TRIAL_UNAVAILABLE"',
  "trialAvailable",
  "amount === null",
  'status: "PRICE_PENDING"',
  "Commercial price is pending approval. Checkout is not available yet.",
  "paymentsService.createCheckout"
]) {
  if (!billingService.includes(required)) {
    failures.push(`billing.service.ts must include ${required}`);
  }
}

for (const required of [
  'billingRouter.post("/trial"',
  'requirePermission("billing:manage")',
  'entityType: "Trial"',
  'checkout.status === "PRICE_PENDING" ? 202 : 201',
  'action: "BILLING_ACTION"'
]) {
  if (!billingRoutes.includes(required)) {
    failures.push(`billing.routes.ts must include ${required}`);
  }
}

for (const required of [
  "type TrialResponse",
  'apiClient<TrialResponse>("/billing/trial"',
  "plan.trialAvailable",
  "Start trial",
  "plan.monthlyPrice === null",
  "Price pending",
  "Commercial price pending approval",
  'apiClient<{ csrfToken: string }>("/security/csrf")',
  'apiClient<CheckoutResponse>("/billing/checkout"'
]) {
  if (!planGrid.includes(required)) {
    failures.push(`PlanGrid.tsx must include ${required}`);
  }
}

if (!pricingPage.includes("Pricing values are placeholders until commercial approval")) {
  failures.push("pricing page must clearly state that prices are placeholders");
}

for (const required of ["Pricing values are placeholders", "Commercial plan prices are still pending approval"]) {
  if (!knownIssues.includes(required) && !finalAudit.includes(required)) {
    failures.push(`pricing docs must mention ${required}`);
  }
}

if (failures.length) {
  console.error(`Pricing contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Pricing contract check passed for ${expectedPlanIds.length} placeholder plans.`);
