const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const phaseTrackerPath = path.join(rootDir, "docs", "PHASE-TRACKER.md");
const launchChecklistPath = path.join(rootDir, "docs", "LAUNCH-CHECKLIST.md");
const finalAuditPath = path.join(rootDir, "docs", "FINAL-AUDIT.md");
const readmePath = path.join(rootDir, "README.md");
const phaseStatusPath = path.join(rootDir, "scripts", "phase-status.js");
const routesPath = path.join(rootDir, "backend", "src", "routes.ts");
const reportsRoutesPath = path.join(rootDir, "backend", "src", "modules", "reports", "reports.routes.ts");
const workspacePath = path.join(rootDir, "frontend", "src", "app", "Workspace.tsx");
const appPath = path.join(rootDir, "frontend", "src", "app", "App.tsx");

const phaseTracker = fs.readFileSync(phaseTrackerPath, "utf8");
const launchChecklist = fs.readFileSync(launchChecklistPath, "utf8");
const finalAudit = fs.readFileSync(finalAuditPath, "utf8");
const readme = fs.readFileSync(readmePath, "utf8");
const phaseStatus = fs.readFileSync(phaseStatusPath, "utf8");
const routes = fs.readFileSync(routesPath, "utf8");
const reportsRoutes = fs.readFileSync(reportsRoutesPath, "utf8");
const workspace = fs.readFileSync(workspacePath, "utf8");
const app = fs.readFileSync(appPath, "utf8");

const requiredPhaseCount = 48;
const phaseRows = [...phaseTracker.matchAll(/^\| (\d+) \| ([^|]+) \| ([^|]+) \|/gm)].map((match) => ({
  number: Number(match[1]),
  name: match[2].trim(),
  status: match[3].trim()
}));

const failures = [];

if (phaseRows.length !== requiredPhaseCount) {
  failures.push(`PHASE-TRACKER.md must list ${requiredPhaseCount} phases`);
}

for (let index = 0; index < phaseRows.length; index += 1) {
  const expectedNumber = index + 1;
  const row = phaseRows[index];
  if (row.number !== expectedNumber) {
    failures.push(`phase row ${index + 1} must be numbered ${expectedNumber}`);
  }
  if (row.status !== "Complete") {
    failures.push(`phase ${row.number} must be Complete`);
  }
}

for (const required of [
  "Final cleanup and launch readiness",
  "Testing and QA",
  "Production checklist",
  "Documentation completion"
]) {
  if (!phaseTracker.includes(required)) {
    failures.push(`PHASE-TRACKER.md must include ${required}`);
  }
}

for (const required of [
  "48 phases are listed",
  "No phase is pending",
  "test:e2e",
  "API auth/permission",
  "CSRF",
  "environment",
  "database",
  "provider",
  "audit"
]) {
  if (!finalAudit.includes(required)) {
    failures.push(`FINAL-AUDIT.md must mention ${required}`);
  }
}

for (const required of [
  "npm.cmd run typecheck",
  "npm.cmd test",
  "npm.cmd run test:e2e",
  "npm.cmd run phase:status",
  "npm.cmd run build",
  "npm.cmd run db:migrate:deploy",
  "npm.cmd run launch:readiness"
]) {
  if (!readme.includes(required)) {
    failures.push(`README.md must mention ${required}`);
  }
}

if ((launchChecklist.match(/^- \[x\]/gm) || []).length < 20) {
  failures.push("LAUNCH-CHECKLIST.md must retain checked launch items");
}

for (const required of [
  "Run unit, API, build, and route smoke checks",
  "Complete scaffold security review",
  "Prepare founder approval checklist"
]) {
  if (!launchChecklist.includes(required)) {
    failures.push(`LAUNCH-CHECKLIST.md must include ${required}`);
  }
}

if (!phaseStatus.includes("process.exit(1)") || !phaseStatus.includes("expectedPhaseCount = 48")) {
  failures.push("phase-status.js must fail on incomplete or unexpected phase counts");
}

for (const required of [
  'apiRouter.use("/reports", reportsRouter)',
  'reportsRouter.get("/exports", authMiddleware, requirePermission("reports:export")',
  'reportsRouter.post("/exports", authMiddleware, requirePermission("reports:export")',
  'reportsRouter.get("/exports/:exportId/download", authMiddleware, requirePermission("reports:export")'
]) {
  if (!routes.includes(required) && !reportsRoutes.includes(required)) {
    failures.push(`phase artifact check must find reports export API evidence: ${required}`);
  }
}

for (const required of [
  "Validation factory",
  "Release manager",
  "Generated documentation",
  "Operations center",
  "Audit center",
  "Export"
]) {
  if (!workspace.includes(required)) {
    failures.push(`Vite workspace must include operational/reporting surface evidence: ${required}`);
  }
}

for (const required of [
  '"project-qa"',
  '"project-release"',
  '"project-docs"',
  '"admin-operations"',
  '"admin-audit"'
]) {
  if (!app.includes(required)) {
    failures.push(`Vite route map must include phase/reporting route evidence: ${required}`);
  }
}

if (failures.length) {
  console.error(`Phase contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Phase contract check passed for ${requiredPhaseCount} complete phases.`);
