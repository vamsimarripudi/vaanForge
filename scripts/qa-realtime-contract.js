const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const realtimeServicePath = path.join(rootDir, "backend", "src", "infrastructure", "realtime", "realtime.service.ts");
const notificationsServicePath = path.join(rootDir, "backend", "src", "modules", "notifications", "notifications.service.ts");
const tasksServicePath = path.join(rootDir, "backend", "src", "modules", "tasks", "tasks.service.ts");
const supportServicePath = path.join(rootDir, "backend", "src", "modules", "support", "support.service.ts");
const automationServicePath = path.join(rootDir, "backend", "src", "modules", "automation", "automation.service.ts");
const backendDocPath = path.join(rootDir, "docs", "BACKEND.md");
const knownIssuesPath = path.join(rootDir, "docs", "KNOWN-ISSUES.md");

const realtimeService = fs.readFileSync(realtimeServicePath, "utf8");
const notificationsService = fs.readFileSync(notificationsServicePath, "utf8");
const tasksService = fs.readFileSync(tasksServicePath, "utf8");
const supportService = fs.readFileSync(supportServicePath, "utf8");
const automationService = fs.readFileSync(automationServicePath, "utf8");
const backendDoc = fs.readFileSync(backendDocPath, "utf8");
const knownIssues = fs.readFileSync(knownIssuesPath, "utf8");
const failures = [];

for (const required of ["ExternalRtcAdapter", "VaanRtcAdapter", "SfuAdapter", "publishUpdate"]) {
  if (!realtimeService.includes(required)) {
    failures.push(`realtime service must keep ${required}`);
  }
}

const contracts = [
  { name: "notifications", source: notificationsService, channel: ":notifications", events: ["publishUpdate"] },
  { name: "tasks", source: tasksService, channel: ":tasks", events: ["TASK_CREATED", "TASK_ASSIGNED", "TASK_STATUS_UPDATED"] },
  { name: "support", source: supportService, channel: ":support", events: ["SUPPORT_TICKET_CREATED", "SUPPORT_MESSAGE_CREATED", "SUPPORT_TICKET_STATUS_UPDATED"] },
  { name: "approvals", source: automationService, channel: ":approvals", events: ["AUTOMATION_RULE_CREATED"] }
];

for (const contract of contracts) {
  if (!contract.source.includes("realtimeService.publishUpdate")) {
    failures.push(`${contract.name} must publish realtime updates`);
  }
  if (!contract.source.includes(contract.channel)) {
    failures.push(`${contract.name} must publish to ${contract.channel} channel`);
  }
  for (const event of contract.events) {
    if (!contract.source.includes(event)) {
      failures.push(`${contract.name} must publish ${event}`);
    }
  }
}

for (const required of ["realtime task updates", "realtime support", "realtime approval", "VaanRTC"]) {
  if (!backendDoc.includes(required) && !knownIssues.includes(required)) {
    failures.push(`backend docs or known issues must mention ${required}`);
  }
}

if (failures.length) {
  console.error(`Realtime contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Realtime contract check passed for notifications, tasks, support, and approvals.");
