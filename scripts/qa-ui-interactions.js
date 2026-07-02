const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "App.tsx"), "utf8");
const workspaceSource = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "Workspace.tsx"), "utf8");
const publicSource = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "PublicPages.tsx"), "utf8");
const legalSource = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "LegalPages.tsx"), "utf8");

const contracts = [
  {
    name: "auth pages",
    source: publicSource,
    requires: ["AuthPage", "Sign in to VaanForge", "Create your workspace", "Reset your password", "Verify your email"]
  },
  {
    name: "workspace intake",
    source: workspaceSource,
    requires: ["Start from one clear idea", "Generate next step", "Requirements", "Blueprint", "Build plan"]
  },
  {
    name: "profile and settings navigation",
    source: workspaceSource,
    requires: ["ProfileView", "Account", "Workspace profile", "navigate(\"profile\")", "navigate(\"settings\")"]
  },
  {
    name: "project workflow surfaces",
    source: workspaceSource,
    requires: ["Requirement conversation", "PRD and system blueprint", "AI Design Studio", "Executable task graph", "Multi-agent execution", "Diff review", "Validation factory", "Security review"]
  },
  {
    name: "billing surfaces",
    source: workspaceSource,
    requires: ["Billing dashboard", "Secure checkout", "Subscription management", "Invoice history", "Usage and limits", "Credit wallet"]
  },
  {
    name: "marketplace developer admin surfaces",
    source: workspaceSource,
    requires: ["KRAVIA app marketplace", "Developer platform", "API key management", "Admin command center", "Operations center", "Security dashboard"]
  },
  {
    name: "state model",
    source: workspaceSource,
    requires: ["Loading", "Empty", "Error", "Permission denied", "Plan limit", "Success"]
  },
  {
    name: "legal footer",
    source: workspaceSource,
    requires: ["ProductFooter", "Terms", "Privacy", "Cookies", "Acceptable Use", "Support"]
  },
  {
    name: "legal plan limits",
    source: legalSource,
    requires: ["PlanLimitsPage", "Plan Limits Policy", "Server-Side Enforcement", "When a Limit is Exceeded"]
  },
  {
    name: "route aliases",
    source: appSource,
    requires: ["builder/projects/", "builder/billing/usage", "marketplace/apps/", "developers/api-keys", "admin/operations", "legal/plan-limits"]
  }
];

const requiredAssets = [
  "frontend/public/assets/brand/tokens.json",
  "frontend/public/assets/brand/logos/logo-wordmark-dark.svg",
  "frontend/public/assets/brand/icons/icon-512.svg",
  "frontend/public/assets/brand/splash/splash-dark.svg",
  "frontend/public/assets/brand/states/loading.svg",
  "frontend/public/assets/brand/states/plan-limit.svg"
];

const failures = [];

for (const contract of contracts) {
  for (const required of contract.requires) {
    if (!contract.source.includes(required)) {
      failures.push(`${contract.name}: expected ${required}`);
    }
  }
}

for (const assetPath of requiredAssets) {
  if (!fs.existsSync(path.join(rootDir, assetPath))) {
    failures.push(`brand asset missing: ${assetPath}`);
  }
}

if (failures.length) {
  console.error(`UI interaction contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`UI interaction contract check passed for ${contracts.length} VaanForge flows.`);

