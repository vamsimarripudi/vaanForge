const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const routes = fs.readFileSync(path.join(rootDir, "backend", "src", "routes.ts"), "utf8");
const aliases = fs.readFileSync(path.join(rootDir, "backend", "src", "modules", "aliases", "pdf-api-aliases.routes.ts"), "utf8");
const apiSmoke = fs.readFileSync(path.join(rootDir, "backend", "src", "tests", "api-http-smoke.test.ts"), "utf8");
const routeSmoke = fs.readFileSync(path.join(rootDir, "scripts", "qa-route-smoke.js"), "utf8");
const pdfAudit = fs.readFileSync(path.join(rootDir, "docs", "PDF-REQUIREMENTS-AUDIT.md"), "utf8");

const requiredRootFolders = ["frontend", "backend", "docs", "design-system", "daily-notes", "infrastructure", "scripts", "shared"];
const requiredGoalEvidence = [
  "/onboarding",
  "/pricing",
  "/workspaces",
  "/users/invite",
  "/tasks",
  "/finance",
  "/pnl",
  "/gst",
  "/hr",
  "/interviews",
  "/support",
  "/customers",
  "/documents",
  "/legal",
  "/compliance",
  "/communication",
  "/automation",
  "/reports"
];

const failures = [];

for (const folder of requiredRootFolders) {
  if (!fs.existsSync(path.join(rootDir, folder, "README.md"))) {
    failures.push(`${folder}/README.md is required by the simple folder rule`);
  }
}

for (const compatibilityFolder of ["apps", "packages"]) {
  const readmePath = path.join(rootDir, compatibilityFolder, "README.md");
  if (!fs.existsSync(readmePath) || !fs.readFileSync(readmePath, "utf8").includes("Compatibility-only")) {
    failures.push(`${compatibilityFolder}/README.md must identify the folder as compatibility-only`);
  }
}

for (const evidence of requiredGoalEvidence) {
  const haystack = `${routes}\n${aliases}\n${apiSmoke}\n${routeSmoke}\n${pdfAudit}`;
  if (!haystack.includes(evidence)) {
    failures.push(`Final goal evidence missing for ${evidence}`);
  }
}

if (failures.length) {
  console.error(`Final goal contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Final goal contract check passed for ${requiredRootFolders.length} root folders and ${requiredGoalEvidence.length} operating goals.`);
