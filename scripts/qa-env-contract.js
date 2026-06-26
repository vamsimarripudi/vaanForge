const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const envExamplePath = path.join(rootDir, ".env.example");
const envGuidePath = path.join(rootDir, "docs", "infra", "env-guide.md");
const backendEnvPath = path.join(rootDir, "backend", "src", "config", "env.ts");
const frontendApiPath = path.join(rootDir, "frontend", "src", "services", "apiClient.ts");

const backendSource = fs.readFileSync(backendEnvPath, "utf8");
const frontendSource = fs.readFileSync(frontendApiPath, "utf8");
const envExample = fs.readFileSync(envExamplePath, "utf8");
const envGuide = fs.readFileSync(envGuidePath, "utf8");

const discovered = new Set();
for (const source of [backendSource, frontendSource]) {
  for (const match of source.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
    discovered.add(match[1]);
  }
}

const required = [
  "NODE_ENV",
  "ROOT_DOMAIN",
  "FRONTEND_URL",
  "NEXT_PUBLIC_API_BASE_URL",
  "PORT",
  "PERSISTENCE_MODE",
  "DATABASE_URL",
  "JWT_SECRET",
  "SESSION_TTL_SECONDS",
  "PASSWORD_RESET_TTL_SECONDS",
  "MEMORY_ADAPTER",
  "REALTIME_ADAPTER",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "EMAIL_PROVIDER",
  "SMS_PROVIDER",
  "S3_ENDPOINT",
  "AI_PROVIDER"
];

const failures = [];

for (const key of required) {
  if (!discovered.has(key) && key !== "NEXT_PUBLIC_API_BASE_URL") {
    failures.push(`${key} is required by the env contract but not read by backend/src/config/env.ts`);
  }
  if (!envExample.includes(`${key}=`)) {
    failures.push(`.env.example must include ${key}`);
  }
  if (!envGuide.includes(`${key}=`) && !envGuide.includes(`\`${key}`)) {
    failures.push(`docs/infra/env-guide.md must document ${key}`);
  }
}

for (const key of discovered) {
  if (!required.includes(key)) {
    failures.push(`${key} is read from process.env but missing from the env contract`);
  }
}

for (const key of ["JWT_SECRET", "RAZORPAY_KEY_SECRET"]) {
  const exampleLine = envExample.split(/\r?\n/).find((line) => line.startsWith(`${key}=`));
  if (!exampleLine) {
    continue;
  }
  const value = exampleLine.slice(key.length + 1);
  if (!value || !["replace-with-secure-secret", "local"].includes(value)) {
    failures.push(`${key} in .env.example must stay placeholder-only`);
  }
}

if (failures.length) {
  console.error(`Environment contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Environment contract check passed for ${required.length} variables.`);
