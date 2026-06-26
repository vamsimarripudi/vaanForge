const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

const moduleComponents = [
  "frontend/src/features/finance/components/FinanceDashboard.tsx",
  "frontend/src/features/operations/components/OperationsDashboard.tsx",
  "frontend/src/features/crm/components/CrmDashboard.tsx",
  "frontend/src/features/support/components/SupportDashboard.tsx",
  "frontend/src/features/hr/components/HrDashboard.tsx",
  "frontend/src/features/legal/components/LegalDashboard.tsx",
  "frontend/src/features/compliance/components/ComplianceDashboard.tsx",
  "frontend/src/features/customer/components/CustomerPortal.tsx",
  "frontend/src/features/growth/components/ModuleSummaryDashboard.tsx",
  "frontend/src/features/dashboard/components/FounderCommandCenter.tsx",
  "frontend/src/features/notifications/components/NotificationPanel.tsx"
];

const docsPath = path.join(rootDir, "docs", "FRONTEND.md");
const failures = [];

for (const component of moduleComponents) {
  const source = fs.readFileSync(path.join(rootDir, component), "utf8");
  for (const state of ["loading", "empty", "error", "success"]) {
    if (!source.includes(`"${state}"`)) {
      failures.push(`${component} must include ${state} state evidence`);
    }
  }

  if (!source.includes("StatePanel")) {
    failures.push(`${component} must render StatePanel lifecycle evidence`);
  }

  if (source.includes('catch(() => setState("empty"))')) {
    failures.push(`${component} must not map API failures to empty state`);
  }

  if (source.includes("apiClient") && !source.includes('catch(() => setState("error"))')) {
    failures.push(`${component} API failure path must set error state`);
  }
}

const frontendDocs = fs.readFileSync(docsPath, "utf8");
for (const required of ["loading", "empty", "error", "success", "StatePanel", "scripts/qa-state-contract.js"]) {
  if (!frontendDocs.includes(required)) {
    failures.push(`FRONTEND.md must mention ${required}`);
  }
}

if (failures.length) {
  console.error(`State contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`State contract check passed for ${moduleComponents.length} module surfaces.`);
