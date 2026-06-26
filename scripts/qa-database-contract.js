const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const schemaPath = path.join(rootDir, "backend", "prisma", "schema.prisma");
const migrationsDir = path.join(rootDir, "backend", "prisma", "migrations");
const databaseDocPath = path.join(rootDir, "docs", "DATABASE.md");
const persistenceDocPath = path.join(rootDir, "docs", "PERSISTENCE.md");
const packagePath = path.join(rootDir, "package.json");
const backendPackagePath = path.join(rootDir, "backend", "package.json");

const schema = fs.readFileSync(schemaPath, "utf8");
const databaseDoc = fs.readFileSync(databaseDocPath, "utf8");
const persistenceDoc = fs.readFileSync(persistenceDocPath, "utf8");
const rootPackage = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, "utf8"));

const migrationFiles = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(migrationsDir, entry.name, "migration.sql"))
  .filter((filePath) => fs.existsSync(filePath));

const migrationSql = migrationFiles.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n");
const models = [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]);
const enums = [...schema.matchAll(/^enum\s+(\w+)\s+\{/gm)].map((match) => match[1]);
const requiredPdfModels = [
  "User",
  "Organization",
  "Workspace",
  "Role",
  "Permission",
  "Product",
  "Plan",
  "Subscription",
  "Payment",
  "Invoice",
  "Customer",
  "Client",
  "Lead",
  "Deal",
  "Expense",
  "Revenue",
  "GSTRecord",
  "CashFlowRecord",
  "PnLReport",
  "Employee",
  "Candidate",
  "Interview",
  "Offer",
  "Department",
  "Task",
  "Project",
  "Approval",
  "Agreement",
  "ComplianceItem",
  "GovernmentRegistration",
  "Document",
  "SupportTicket",
  "TicketMessage",
  "Notification",
  "Announcement",
  "CreatorProfile",
  "Campaign",
  "Partner",
  "AuditLog",
  "DailyNote",
  "ReportExport",
  "AutomationRule"
];
const requiredProductTypes = [
  "VIDYALUMA",
  "VAANMEET",
  "VFORMIX",
  "VMETRON",
  "SUPPORT",
  "CUSTOMER_PORTAL",
  "CLIENT_PORTAL",
  "BILLING",
  "REPORTS",
  "COMMUNICATION",
  "PROMOTIONS"
];

const failures = [];

if (!migrationFiles.length) {
  failures.push("backend/prisma/migrations must include at least one migration.sql");
}

for (const model of models) {
  if (!migrationSql.includes(`CREATE TABLE "${model}"`)) {
    failures.push(`Prisma model ${model} must have a CREATE TABLE migration`);
  }
  if (!databaseDoc.includes(`- ${model}.`)) {
    failures.push(`docs/DATABASE.md must list Prisma model ${model}`);
  }
}

for (const model of requiredPdfModels) {
  if (!models.includes(model)) {
    failures.push(`PDF-required Prisma model ${model} must exist in schema.prisma`);
  }
}

for (const productType of requiredProductTypes) {
  if (!schema.includes(productType)) {
    failures.push(`ProductType enum must include ${productType}`);
  }
  if (!databaseDoc.includes(productType) && !databaseDoc.includes(productType.replace("_", " "))) {
    failures.push(`docs/DATABASE.md must mention ProductType ${productType}`);
  }
}

for (const enumName of enums) {
  if (!migrationSql.includes(`CREATE TYPE "${enumName}"`)) {
    failures.push(`Prisma enum ${enumName} must have a CREATE TYPE migration`);
  }
}

for (const required of [
  "PERSISTENCE_MODE=postgres",
  "npm run prisma:generate --workspace backend",
  "npm run db:migrate:deploy",
  "npm run launch:readiness"
]) {
  if (!persistenceDoc.includes(required)) {
    failures.push(`docs/PERSISTENCE.md must mention ${required}`);
  }
}

if (rootPackage.scripts["db:migrate:deploy"] !== "npm run prisma:migrate:deploy --workspace backend") {
  failures.push("root package.json must expose db:migrate:deploy");
}

if (backendPackage.scripts["prisma:generate"] !== "prisma generate") {
  failures.push("backend package.json must expose prisma:generate");
}

if (backendPackage.scripts["prisma:migrate:deploy"] !== "prisma migrate deploy") {
  failures.push("backend package.json must expose prisma:migrate:deploy");
}

if (failures.length) {
  console.error(`Database contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Database contract check passed for ${models.length} models, ${enums.length} enums, and ${migrationFiles.length} migration file.`);
