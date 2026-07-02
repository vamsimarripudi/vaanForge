const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const appPath = path.join(rootDir, "frontend", "src", "app", "App.tsx");
const workspacePath = path.join(rootDir, "frontend", "src", "app", "Workspace.tsx");

const appSource = fs.readFileSync(appPath, "utf8");
const workspaceSource = fs.readFileSync(workspacePath, "utf8");

const requiredRouteContracts = [
  "builder/projects",
  "builder/projects/new",
  "builder/projects/",
  "builder/billing",
  "builder/billing/checkout",
  "builder/billing/payment-success",
  "marketplace/apps/",
  "marketplace/installed",
  "developers/api-keys",
  "developers/webhooks",
  "admin/operations",
  "admin/security",
  "legal/privacy-policy",
  "legal/terms-of-use",
  "legal/refund-cancellation-policy",
  "legal/plan-limits",
  "login",
  "register",
  "forgot-password",
  "verify-email"
];

const requiredSurfaceRoutes = [
  "project-chat",
  "project-intake",
  "project-questions",
  "project-blueprint",
  "project-design",
  "project-tasks",
  "project-agents",
  "project-files",
  "project-diffs",
  "project-qa",
  "project-security",
  "project-deployment",
  "project-release",
  "project-docs",
  "project-memory",
  "billing-usage",
  "developer-api-keys",
  "admin-operations"
];

const missing = [
  ...requiredRouteContracts.filter((route) => !appSource.includes(route)),
  ...requiredSurfaceRoutes.filter((route) => !workspaceSource.includes(route))
];

if (missing.length) {
  console.error(`Vite route smoke check failed. Missing route contracts:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log(`Vite route smoke check passed for ${requiredRouteContracts.length + requiredSurfaceRoutes.length} route contracts.`);
