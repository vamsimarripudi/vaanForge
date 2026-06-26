const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const qaDoc = fs.readFileSync(path.join(rootDir, "docs", "QA.md"), "utf8");
const scriptsReadme = fs.readFileSync(path.join(rootDir, "scripts", "README.md"), "utf8");
const finalAudit = fs.readFileSync(path.join(rootDir, "docs", "FINAL-AUDIT.md"), "utf8");

const e2eScript = packageJson.scripts["test:e2e"];
const qaScripts = e2eScript.match(/scripts\/[a-z0-9-]+\.js/g) || [];
const requiredDocLabels = [
  "Route smoke",
  "UI interaction",
  "API auth/permission",
  "CSRF",
  "CI workflow",
  "Environment",
  "Database schema/migration",
  "Provider readiness",
  "Audit coverage",
  "Phase documentation",
  "Domain configuration",
  "Pricing placeholder",
  "Dependency hygiene"
];

const failures = [];

for (const script of qaScripts) {
  if (!qaDoc.includes(script)) {
    failures.push(`docs/QA.md must mention ${script}`);
  }
}

for (const label of requiredDocLabels) {
  if (!qaDoc.includes(label)) {
    failures.push(`docs/QA.md must describe ${label} coverage`);
  }
}

for (const command of ["npm.cmd run typecheck", "npm.cmd test", "npm.cmd run test:e2e", "npm.cmd run build", "npm.cmd run phase:status"]) {
  if (!qaDoc.includes(command)) {
    failures.push(`docs/QA.md must mention ${command}`);
  }
}

if (!scriptsReadme.includes("dependency hygiene contract checks") || !finalAudit.includes("dependency hygiene contracts")) {
  failures.push("scripts README and final audit must describe the full current E2E contract suite");
}

if (failures.length) {
  console.error(`QA documentation contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`QA documentation contract check passed for ${qaScripts.length} E2E scripts.`);
