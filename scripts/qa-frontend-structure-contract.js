const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

const requiredPaths = [
  "apps/web/README.md",
  "apps/api/README.md",
  "packages/ui/README.md",
  "packages/config/README.md",
  "packages/types/README.md",
  "packages/utils/README.md",
  "packages/docs/README.md",
  "frontend/src/app",
  "frontend/src/components",
  "frontend/src/features",
  "frontend/src/hooks",
  "frontend/src/lib",
  "frontend/src/services",
  "frontend/src/store",
  "frontend/src/styles",
  "frontend/src/types",
  "frontend/src/constants",
  "frontend/src/features/auth",
  "frontend/src/features/onboarding",
  "frontend/src/features/dashboard",
  "frontend/src/features/finance",
  "frontend/src/features/hr",
  "frontend/src/features/sales",
  "frontend/src/features/support",
  "frontend/src/features/legal",
  "frontend/src/features/compliance",
  "frontend/src/features/documents",
  "frontend/src/features/settings",
  "frontend/src/features/reports"
];

const requiredFeatureFolders = ["auth", "onboarding", "dashboard", "finance", "hr", "sales", "support", "legal", "compliance", "documents", "settings", "reports"];
const requiredFeatureSubfolders = ["components", "pages", "hooks", "services", "types"];

const frontendDoc = fs.readFileSync(path.join(rootDir, "docs", "FRONTEND.md"), "utf8");
const failures = [];

for (const requiredPath of requiredPaths) {
  if (!fs.existsSync(path.join(rootDir, requiredPath))) {
    failures.push(`Missing PDF frontend structure path: ${requiredPath}`);
  }
}

for (const feature of requiredFeatureFolders) {
  for (const subfolder of requiredFeatureSubfolders) {
    const requiredPath = path.join(rootDir, "frontend", "src", "features", feature, subfolder);
    if (!fs.existsSync(requiredPath)) {
      failures.push(`Missing PDF feature subfolder: frontend/src/features/${feature}/${subfolder}`);
    }
  }
}

for (const requiredDocSnippet of ["apps/web", "apps/api", "packages/ui", "packages/config", "packages/types", "packages/utils", "packages/docs"]) {
  if (!frontendDoc.includes(requiredDocSnippet)) {
    failures.push(`docs/FRONTEND.md must document ${requiredDocSnippet}`);
  }
}

if (failures.length) {
  console.error(`Frontend structure contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Frontend structure contract check passed for ${requiredPaths.length} PDF paths.`);
