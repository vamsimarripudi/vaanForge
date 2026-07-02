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
  "VITE_API_BASE_URL",
  "VAANFORGE_PUBLIC_URL",
  "VAANFORGE_WWW_URL",
  "VAANFORGE_APP_URL",
  "VAANFORGE_AUTH_URL",
  "VAANFORGE_PROFILE_URL",
  "VAANFORGE_SETTINGS_URL",
  "VAANFORGE_PLANS_URL",
  "VAANFORGE_SUPPORT_URL",
  "VAANFORGE_ADMIN_URL",
  "VAANFORGE_DOCS_URL",
  "VAANFORGE_STATUS_URL",
  "VAANFORGE_DEVELOPERS_URL",
  "VAANFORGE_MARKETPLACE_URL",
  "VAANFORGE_API_URL",
  "VAANFORGE_ASSETS_URL",
  "VAANFORGE_CDN_URL",
  "VAANFORGE_UPLOADS_URL",
  "VAANFORGE_FILES_URL",
  "VAANFORGE_WEBHOOKS_URL",
  "VAANFORGE_EVENTS_URL",
  "VAANFORGE_BILLING_URL",
  "VAANFORGE_CHECKOUT_URL",
  "VAANFORGE_CONSOLE_URL",
  "VAANFORGE_FACTORY_URL",
  "VAANFORGE_AGENTS_URL",
  "VAANFORGE_DEPLOY_URL",
  "VAANFORGE_RELEASES_URL",
  "VAANFORGE_LEGAL_URL",
  "VAANFORGE_FEEDBACK_URL",
  "VAANFORGE_LEARN_URL",
  "VAANFORGE_BLOG_URL",
  "VAANFORGE_PARTNERS_URL",
  "VAANFORGE_ENTERPRISE_URL",
  "VAANFORGE_COOKIE_DOMAIN",
  "CORS_EXTRA_ORIGINS",
  "PORT",
  "PERSISTENCE_MODE",
  "DATABASE_URL",
  "AWS_REGION",
  "PARAMETER_STORE_ENABLED",
  "PARAMETER_STORE_PREFIX",
  "ALLOW_LOCAL_ENV_IN_PRODUCTION",
  "JWT_SECRET",
  "SESSION_TTL_SECONDS",
  "PASSWORD_RESET_TTL_SECONDS",
  "MEMORY_ADAPTER",
  "REALTIME_ADAPTER",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "EMAIL_PROVIDER",
  "SMS_PROVIDER",
  "S3_ENDPOINT",
  "AI_PROVIDER",
  "VFORMIX_AGENT_WEBHOOK_TOKEN"
];

const failures = [];

const frontendOnly = new Set([
  "VITE_API_BASE_URL",
  "VAANFORGE_WWW_URL",
  "VAANFORGE_PROFILE_URL",
  "VAANFORGE_SETTINGS_URL",
  "VAANFORGE_PLANS_URL",
  "VAANFORGE_SUPPORT_URL",
  "VAANFORGE_DOCS_URL",
  "VAANFORGE_STATUS_URL",
  "VAANFORGE_DEVELOPERS_URL",
  "VAANFORGE_MARKETPLACE_URL",
  "VAANFORGE_ASSETS_URL",
  "VAANFORGE_CDN_URL",
  "VAANFORGE_UPLOADS_URL",
  "VAANFORGE_FILES_URL",
  "VAANFORGE_WEBHOOKS_URL",
  "VAANFORGE_EVENTS_URL",
  "VAANFORGE_BILLING_URL",
  "VAANFORGE_CHECKOUT_URL",
  "VAANFORGE_CONSOLE_URL",
  "VAANFORGE_FACTORY_URL",
  "VAANFORGE_AGENTS_URL",
  "VAANFORGE_DEPLOY_URL",
  "VAANFORGE_RELEASES_URL",
  "VAANFORGE_LEGAL_URL",
  "VAANFORGE_FEEDBACK_URL",
  "VAANFORGE_LEARN_URL",
  "VAANFORGE_BLOG_URL",
  "VAANFORGE_PARTNERS_URL",
  "VAANFORGE_ENTERPRISE_URL"
]);

for (const key of required) {
  if (!discovered.has(key) && !frontendOnly.has(key)) {
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

for (const key of ["JWT_SECRET", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET", "VFORMIX_AGENT_WEBHOOK_TOKEN"]) {
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
