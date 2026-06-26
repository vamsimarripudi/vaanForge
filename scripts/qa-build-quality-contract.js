const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const developerGuide = fs.readFileSync(path.join(rootDir, "docs", "DEVELOPER-GUIDE.md"), "utf8");
const phaseTracker = fs.readFileSync(path.join(rootDir, "docs", "PHASE-TRACKER.md"), "utf8");
const knownIssues = fs.readFileSync(path.join(rootDir, "docs", "KNOWN-ISSUES.md"), "utf8");
const designReadme = fs.readFileSync(path.join(rootDir, "design-system", "README.md"), "utf8");
const futurePhases = fs.readFileSync(path.join(rootDir, "docs", "FUTURE-PHASES.md"), "utf8");

const requiredExecutionRules = [
  "Explain objective",
  "Create/update files",
  "Keep code readable",
  "Add comments where needed",
  "Update docs",
  "Update daily note",
  "Update phase tracker",
  "Add tests where reasonable",
  "Avoid breaking previous phases",
  "Continue to the next phase without asking unless blocked by missing secrets"
];

const requiredQualityRules = [
  "No messy code",
  "No hardcoded secrets",
  "No hardcoded domains",
  "No duplicate components",
  "No unclear file names",
  "No undocumented business logic",
  "No fake production claims",
  "No random UI",
  "No broken mobile layouts",
  "No financial calculations without formulas",
  "No legal output without disclaimers"
];

const phaseRows = [...phaseTracker.matchAll(/^\| (\d+) \| ([^|]+) \| ([^|]+) \|/gm)];
const failures = [];

if (phaseRows.length !== 48) {
  failures.push("PHASE-TRACKER.md must not exceed or fall below 48 phases");
}

for (const rule of [...requiredExecutionRules, ...requiredQualityRules]) {
  if (!developerGuide.includes(rule)) {
    failures.push(`docs/DEVELOPER-GUIDE.md must include PDF rule: ${rule}`);
  }
}

for (const required of ["placeholder", "production", "readiness", "Legal document workflows"]) {
  if (!knownIssues.includes(required)) {
    failures.push(`docs/KNOWN-ISSUES.md must retain production limitation evidence for ${required}`);
  }
}

for (const required of ["BusinessOS", "Vidyaluma", "VaanMeet", "Pulse Forms", "VMetron", "one design language", "one font family"]) {
  if (!designReadme.includes(required)) {
    failures.push(`design-system/README.md must document ecosystem design rule: ${required}`);
  }
}

for (const required of ["Document it", "Prioritize it", "Add it to future phases", "5-10 years"]) {
  if (!futurePhases.includes(required)) {
    failures.push(`docs/FUTURE-PHASES.md must document future phase rule: ${required}`);
  }
}

for (const required of ["Avoid clever code", "Prefer readable code", "Maintainability is more important than short code", "future developers will maintain it without the founder present"]) {
  if (!developerGuide.includes(required)) {
    failures.push(`docs/DEVELOPER-GUIDE.md must include maintainability rule: ${required}`);
  }
}

if (failures.length) {
  console.error(`Build quality contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Build quality contract check passed for execution rules, quality rules, and the 48-phase ceiling.");
