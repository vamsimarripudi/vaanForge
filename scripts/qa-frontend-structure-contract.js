const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

const requiredPaths = [
  "frontend/index.html",
  "frontend/package.json",
  "frontend/vite.config.ts",
  "frontend/src/main.tsx",
  "frontend/src/app/App.tsx",
  "frontend/src/app/Workspace.tsx",
  "frontend/src/app/PublicPages.tsx",
  "frontend/src/app/LegalPages.tsx",
  "frontend/src/styles/theme.css",
  "frontend/src/styles/tailwind.css",
  "frontend/public/site.webmanifest",
  "frontend/public/assets/brand/README.md",
  "frontend/public/assets/brand/tokens.json",
  "frontend/public/assets/brand/logos/logo-mark.svg",
  "frontend/public/assets/brand/icons/favicon.svg",
  "frontend/public/assets/brand/splash/splash-dark.svg",
  "docs/product/workflow.md",
  "docs/product/pricing.md",
  "docs/agents/agent-brain-system.md",
  "docs/deployment/production.md"
];

const failures = [];

for (const requiredPath of requiredPaths) {
  if (!fs.existsSync(path.join(rootDir, requiredPath))) {
    failures.push(`Missing VaanForge frontend path: ${requiredPath}`);
  }
}

const appSource = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "App.tsx"), "utf8");
for (const route of ["profile", "project-chat", "billing-usage", "marketplace", "developers", "admin-operations"]) {
  if (!appSource.includes(route)) failures.push(`App route registry must include ${route}`);
}

const workspaceSource = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "Workspace.tsx"), "utf8");
for (const surface of ["SURFACE_PAGES", "ProductFooter", "ProfileView", "SurfacePage"]) {
  if (!workspaceSource.includes(surface)) failures.push(`Workspace shell must include ${surface}`);
}

if (failures.length) {
  console.error(`Frontend structure contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Frontend structure contract check passed for ${requiredPaths.length} Vite paths.`);
