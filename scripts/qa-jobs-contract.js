const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const jobInterfacePath = path.join(rootDir, "backend", "src", "infrastructure", "jobs", "job.interface.ts");
const jobServicePath = path.join(rootDir, "backend", "src", "infrastructure", "jobs", "job.service.ts");
const financeServicePath = path.join(rootDir, "backend", "src", "modules", "finance", "finance.service.ts");
const automationServicePath = path.join(rootDir, "backend", "src", "modules", "automation", "automation.service.ts");
const memoryInterfacePath = path.join(rootDir, "backend", "src", "infrastructure", "memory", "memory.interface.ts");
const backendDocPath = path.join(rootDir, "docs", "BACKEND.md");
const knownIssuesPath = path.join(rootDir, "docs", "KNOWN-ISSUES.md");

const jobInterface = fs.readFileSync(jobInterfacePath, "utf8");
const jobService = fs.readFileSync(jobServicePath, "utf8");
const financeService = fs.readFileSync(financeServicePath, "utf8");
const automationService = fs.readFileSync(automationServicePath, "utf8");
const memoryInterface = fs.readFileSync(memoryInterfacePath, "utf8");
const backendDoc = fs.readFileSync(backendDocPath, "utf8");
const knownIssues = fs.readFileSync(knownIssuesPath, "utf8");
const failures = [];

for (const required of ["REPORT_EXPORT_REQUESTED", "AUTOMATION_RULE_CREATED", "JobStatus", "JobRecord", "JobQueue"]) {
  if (!jobInterface.includes(required)) {
    failures.push(`job interface must include ${required}`);
  }
}

for (const required of ["memoryService.enqueue", "localJobRecords", "reports.exports", "automation.rules", "recent()"]) {
  if (!jobService.includes(required)) {
    failures.push(`job service must include ${required}`);
  }
}

if (!financeService.includes('jobService.enqueue("REPORT_EXPORT_REQUESTED"')) {
  failures.push("finance report exports must enqueue REPORT_EXPORT_REQUESTED jobs");
}

if (!automationService.includes('jobService.enqueue("AUTOMATION_RULE_CREATED"')) {
  failures.push("automation rule creation must enqueue AUTOMATION_RULE_CREATED jobs");
}

if (!memoryInterface.includes("enqueue(queueName: string, payload: unknown)")) {
  failures.push("memory adapter contract must expose enqueue");
}

for (const required of ["job.service.ts", "REPORT_EXPORT_REQUESTED", "AUTOMATION_RULE_CREATED", "BullMQ"]) {
  if (!backendDoc.includes(required) && !knownIssues.includes(required)) {
    failures.push(`backend docs or known issues must mention ${required}`);
  }
}

if (failures.length) {
  console.error(`Jobs contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Jobs contract check passed for report exports and automation jobs.");
