const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

const requiredDocs = [
  "docs/README.md",
  "docs/START-HERE.md",
  "docs/NON-TECH-GUIDE.md",
  "docs/DEVELOPER-GUIDE.md",
  "docs/ARCHITECTURE.md",
  "docs/DATABASE.md",
  "docs/API.md",
  "docs/FRONTEND.md",
  "docs/BACKEND.md",
  "docs/DEPLOYMENT.md",
  "docs/SECURITY.md",
  "docs/ROLES-PERMISSIONS.md",
  "docs/DAILY-NOTES.md",
  "docs/CHANGELOG.md",
  "docs/PHASE-TRACKER.md",
  "docs/KNOWN-ISSUES.md",
  "docs/LAUNCH-CHECKLIST.md"
];

const requiredDailyNotes = ["daily-notes/day-001.md", "daily-notes/day-002.md"];
const requiredDailySections = [
  "What was planned",
  "What was built",
  "Files changed",
  "Bugs found",
  "Decisions made",
  "Pending tasks",
  "Next day plan"
];
const requiredFollowUpDailySections = [
  "Objective",
  "Tasks Planned",
  "Tasks Completed",
  "Files Created",
  "Issues Found",
  "Decisions Taken",
  "Pending Items",
  "Next Day Plan"
];

const failures = [];

for (const docPath of requiredDocs) {
  if (!fs.existsSync(path.join(rootDir, docPath))) {
    failures.push(`Missing required documentation file: ${docPath}`);
  }
}

for (const notePath of requiredDailyNotes) {
  const absolutePath = path.join(rootDir, notePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required daily note: ${notePath}`);
    continue;
  }

  const note = fs.readFileSync(absolutePath, "utf8").toLowerCase();
  for (const section of [...requiredDailySections, ...requiredFollowUpDailySections]) {
    if (!note.includes(section.toLowerCase())) {
      failures.push(`${notePath} must contain section "${section}"`);
    }
  }
}

if (failures.length) {
  console.error(`Documentation requirements contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Documentation requirements contract check passed for ${requiredDocs.length} docs and ${requiredDailyNotes.length} daily notes.`);
