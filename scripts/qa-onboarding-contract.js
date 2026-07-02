const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const workspace = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "Workspace.tsx"), "utf8");
const app = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "App.tsx"), "utf8");
const workflowDoc = fs.readFileSync(path.join(rootDir, "docs", "product", "workflow.md"), "utf8");
const failures = [];

for (const required of [
  "Describe the product, users, core workflow, integrations",
  "Start from one clear idea",
  "Generate next step",
  "Requirement conversation",
  "Guided requirement intake",
  "Smart follow-up questions",
  "PRD and system blueprint"
]) {
  if (!workspace.includes(required)) failures.push(`Workspace onboarding surface must include ${required}`);
}

for (const route of ["builder/projects/new", "project-intake", "project-questions", "project-blueprint"]) {
  if (!app.includes(route) && !workspace.includes(route)) failures.push(`Route onboarding contract missing ${route}`);
}

for (const required of ["Create project", "Describe the idea", "Answer follow-up questions", "Generate and approve blueprint"]) {
  if (!workflowDoc.includes(required)) failures.push(`docs/product/workflow.md must mention ${required}`);
}

if (failures.length) {
  console.error(`Onboarding contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Onboarding contract check passed for VaanForge guided intake.");
