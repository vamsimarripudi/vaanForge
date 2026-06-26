const fs = require("fs");
const path = require("path");

const workflowPath = path.join(__dirname, "..", ".github", "workflows", "ci.yml");
const workflow = fs.readFileSync(workflowPath, "utf8");

const requiredSnippets = [
  "uses: actions/checkout@v4",
  "uses: actions/setup-node@v4",
  "node-version: 20",
  "cache: npm",
  "run: npm ci",
  "run: npm run prisma:generate --workspace backend",
  "run: npm run typecheck",
  "run: npm test",
  "run: npm run test:e2e",
  "run: npm run phase:status",
  "run: npm run build"
];

const requiredNames = [
  "Install dependencies",
  "Generate Prisma client",
  "Typecheck",
  "Backend tests",
  "Route, UI, API security, and CSRF contracts",
  "Phase tracker",
  "Build"
];

const failures = [];

for (const snippet of requiredSnippets) {
  if (!workflow.includes(snippet)) {
    failures.push(`CI workflow must include ${snippet}`);
  }
}

for (const name of requiredNames) {
  if (!workflow.includes(`name: ${name}`)) {
    failures.push(`CI workflow must include a step named ${name}`);
  }
}

if (workflow.includes("run: npm run launch:readiness")) {
  failures.push("CI workflow must not run launch:readiness with local/demo placeholders; run it only in the target deployment environment");
}

if (!workflow.includes("pull_request:") || !workflow.includes("push:")) {
  failures.push("CI workflow must run on pull_request and push");
}

if (failures.length) {
  console.error(`CI contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("CI contract check passed.");
