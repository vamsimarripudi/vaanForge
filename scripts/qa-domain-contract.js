const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const domainConfigPath = path.join(rootDir, "shared", "config", "domains.ts");
const readinessPath = path.join(rootDir, "backend", "src", "database", "persistence.service.ts");
const envExamplePath = path.join(rootDir, ".env.example");
const envGuidePath = path.join(rootDir, "docs", "infra", "env-guide.md");
const domainGuidePath = path.join(rootDir, "docs", "infra", "domain-setup.md");
const readmePath = path.join(rootDir, "README.md");

const domainConfig = fs.readFileSync(domainConfigPath, "utf8");
const readiness = fs.readFileSync(readinessPath, "utf8");
const envExample = fs.readFileSync(envExamplePath, "utf8");
const envGuide = fs.readFileSync(envGuidePath, "utf8");
const domainGuide = fs.readFileSync(domainGuidePath, "utf8");
const readme = fs.readFileSync(readmePath, "utf8");

const domainKeys = [
  "root",
  "app",
  "founder",
  "admin",
  "finance",
  "hr",
  "sales",
  "support",
  "legal",
  "ca",
  "creator",
  "customer",
  "partner",
  "docs",
  "meet",
  "api",
  "assets"
];

const failures = [];

for (const key of domainKeys) {
  if (!domainConfig.includes(`${key}:`)) {
    failures.push(`shared/config/domains.ts must define ${key}`);
  }
  if (key !== "root" && !domainGuide.includes(key)) {
    failures.push(`docs/infra/domain-setup.md must mention ${key}`);
  }
}

for (const required of [
  'export type EnvironmentName = "local" | "staging" | "production"',
  "const rootDomain = process.env.ROOT_DOMAIN || \"example.com\"",
  "staging: buildDomainSet(`staging.${rootDomain}`)",
  "production: buildDomainSet(rootDomain)",
  'api: "localhost:4000/api/v1"',
  "export const getDomains"
]) {
  if (!domainConfig.includes(required)) {
    failures.push(`shared/config/domains.ts must include ${required}`);
  }
}

for (const required of [
  "ROOT_DOMAIN=example.com",
  "FRONTEND_URL=http://localhost:3000",
  "VITE_API_BASE_URL=http://localhost:4000/api/v1"
]) {
  if (!envExample.includes(required)) {
    failures.push(`.env.example must include ${required}`);
  }
  if (!envGuide.includes(required)) {
    failures.push(`docs/infra/env-guide.md must include ${required}`);
  }
}

for (const required of [
  "domainCheck()",
  "frontendUrlCheck()",
  "ROOT_DOMAIN must be replaced",
  "FRONTEND_URL still points",
  'env.rootDomain === "localhost"',
  'env.frontendUrl.includes("localhost")'
]) {
  if (!readiness.includes(required)) {
    failures.push(`readiness must include ${required}`);
  }
}

if (!readme.includes("[shared/config/domains.ts](shared/config/domains.ts)")) {
  failures.push("README.md must point to shared/config/domains.ts");
}

if (failures.length) {
  console.error(`Domain contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Domain contract check passed for ${domainKeys.length} domain keys.`);
