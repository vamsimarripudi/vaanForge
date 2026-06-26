const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const auditServicePath = path.join(rootDir, "backend", "src", "modules", "audit", "audit.service.ts");
const auditRoutesPath = path.join(rootDir, "backend", "src", "modules", "audit", "audit.routes.ts");

const actions = [
  "FINANCE_ACTION",
  "LEGAL_ACTION",
  "SECURITY_ACTION",
  "BILLING_ACTION",
  "ENTITLEMENT_CHECK",
  "WORKSPACE_CREATED",
  "PERMISSION_CHECK",
  "SETTINGS_CHANGED",
  "AUTOMATION_CHANGED",
  "FILE_UPLOADED"
];

const sensitiveModules = [
  { file: "backend/src/modules/billing/billing.routes.ts", actions: ["BILLING_ACTION"], entities: ["Checkout"] },
  { file: "backend/src/modules/entitlements/entitlements.routes.ts", actions: ["ENTITLEMENT_CHECK"], entities: ["Entitlement"] },
  { file: "backend/src/modules/finance/finance.routes.ts", actions: ["FINANCE_ACTION"], entities: ["Revenue", "Expense", "ReportExport"] },
  { file: "backend/src/modules/legal/legal.routes.ts", actions: ["LEGAL_ACTION"], entities: ["Agreement"] },
  { file: "backend/src/modules/compliance/compliance.routes.ts", actions: ["LEGAL_ACTION"], entities: ["ComplianceItem", "GovernmentRegistration"] },
  { file: "backend/src/modules/workspaces/workspaces.routes.ts", actions: ["WORKSPACE_CREATED"], entities: ["Workspace"] },
  { file: "backend/src/modules/settings/settings.routes.ts", actions: ["SETTINGS_CHANGED"], entities: ["OrganizationSettings"] },
  { file: "backend/src/modules/automation/automation.routes.ts", actions: ["AUTOMATION_CHANGED"], entities: ["AutomationRule"] },
  { file: "backend/src/modules/hr/hr.routes.ts", actions: ["SECURITY_ACTION"], entities: ["Employee"] },
  { file: "backend/src/modules/tasks/tasks.routes.ts", actions: ["WORKSPACE_CREATED"], entities: ["Project", "Task"] },
  { file: "backend/src/modules/files/files.routes.ts", actions: ["FILE_UPLOADED"], entities: ["FileUpload"] }
];

const auditService = fs.readFileSync(auditServicePath, "utf8");
const auditRoutes = fs.readFileSync(auditRoutesPath, "utf8");
const failures = [];

for (const action of actions) {
  if (!auditService.includes(`| "${action}"`)) {
    failures.push(`AuditAction must include ${action}`);
  }
  if (!auditRoutes.includes(`"${action}"`)) {
    failures.push(`audit.routes.ts schema must accept ${action}`);
  }
}

for (const module of sensitiveModules) {
  const source = fs.readFileSync(path.join(rootDir, module.file), "utf8");
  if (!source.includes("auditService")) {
    failures.push(`${module.file} must import and use auditService`);
  }
  if (!source.includes("auditService.record")) {
    failures.push(`${module.file} must record an audit entry`);
  }
  if (!source.includes("actorId: request.session!.userId")) {
    failures.push(`${module.file} audit entries must include the session actor`);
  }
  if (!source.includes("organizationId")) {
    failures.push(`${module.file} audit entries must include organizationId`);
  }
  for (const action of module.actions) {
    if (!source.includes(`action: "${action}"`)) {
      failures.push(`${module.file} must record ${action}`);
    }
  }
  for (const entity of module.entities) {
    if (!source.includes(`entityType: "${entity}"`)) {
      failures.push(`${module.file} must record entityType ${entity}`);
    }
  }
}

if (!auditService.includes("requestId?: string") || !auditService.includes("ipAddress?: string") || !auditService.includes("userAgent?: string")) {
  failures.push("AuditLogInput must support requestId, ipAddress, and userAgent metadata");
}

if (!auditRoutes.includes('requirePermission("audit:read")')) {
  failures.push("audit routes must require audit:read");
}

if (failures.length) {
  console.error(`Audit contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Audit contract check passed for ${sensitiveModules.length} sensitive modules and ${actions.length} actions.`);
