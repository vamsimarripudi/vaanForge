const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const seedPath = path.join(rootDir, "backend", "src", "database", "seed-demo-data.ts");
const rootPackagePath = path.join(rootDir, "package.json");
const backendPackagePath = path.join(rootDir, "backend", "package.json");
const databaseDocPath = path.join(rootDir, "docs", "DATABASE.md");
const qaDocPath = path.join(rootDir, "docs", "QA.md");
const scriptsReadmePath = path.join(rootDir, "scripts", "README.md");
const phaseTrackerPath = path.join(rootDir, "docs", "PHASE-TRACKER.md");

const seed = fs.readFileSync(seedPath, "utf8");
const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"));
const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, "utf8"));
const databaseDoc = fs.readFileSync(databaseDocPath, "utf8");
const qaDoc = fs.readFileSync(qaDocPath, "utf8");
const scriptsReadme = fs.readFileSync(scriptsReadmePath, "utf8");
const phaseTracker = fs.readFileSync(phaseTrackerPath, "utf8");
const failures = [];

const requiredSeedCalls = [
  "authService.register",
  "workspacesService.create",
  "financeService.addRevenue",
  "financeService.addExpense",
  "financeService.queueExport",
  "tasksService.createProject",
  "tasksService.createTask",
  "crmService.createLead",
  "crmService.updateLeadStage",
  "crmService.createCustomer",
  "supportService.createTicket",
  "supportService.addMessage",
  "hrService.createDepartment",
  "hrService.createEmployee",
  "hrService.createCandidate",
  "hrService.createInterview",
  "legalService.createAgreement",
  "complianceService.createItem",
  "complianceService.updateItemStatus",
  "complianceService.createRegistration",
  "creatorsService.createProfile",
  "creatorsService.createCampaign",
  "partnersService.createPartner",
  "communicationService.create",
  "automationService.createRule",
  "settingsService.update",
  "intelligenceService.summary"
];

for (const required of requiredSeedCalls) {
  if (!seed.includes(required)) {
    failures.push(`seed-demo-data.ts must include ${required}`);
  }
}

for (const required of ["seededModules", "intelligenceSnapshotId", "require.main === module", '"seeded"', "organizationId", "workspaceId"]) {
  if (!seed.includes(required)) {
    failures.push(`seed-demo-data.ts must include runnable summary evidence: ${required}`);
  }
}

if (rootPackage.scripts["seed:demo"] !== "npm run seed:demo --workspace backend") {
  failures.push("root package.json must expose seed:demo");
}

if (backendPackage.scripts["seed:demo"] !== "tsx src/database/seed-demo-data.ts") {
  failures.push("backend package.json must expose seed:demo");
}

for (const required of [
  "npm run seed:demo",
  "workspace",
  "finance",
  "reports",
  "tasks",
  "CRM",
  "customer",
  "support",
  "HR",
  "hiring",
  "interviews",
  "legal",
  "compliance",
  "registrations",
  "creators",
  "partners",
  "communication",
  "automation",
  "settings",
  "intelligence"
]) {
  if (!databaseDoc.includes(required) && !qaDoc.includes(required) && !scriptsReadme.includes(required) && !phaseTracker.includes(required)) {
    failures.push(`seed docs must mention ${required}`);
  }
}

if (failures.length) {
  console.error(`Seed contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Seed contract check passed for demo workspace data.");
