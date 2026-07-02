const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const shellSource = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "domainShells.tsx"), "utf8");
const appSource = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "App.tsx"), "utf8");
const rootDomainConfig = fs.readFileSync(path.join(rootDir, "config", "domains.ts"), "utf8");
const subdomainDocs = fs.readFileSync(path.join(rootDir, "docs", "deployment", "subdomain-routing.md"), "utf8");
const routeMap = fs.readFileSync(path.join(rootDir, "docs", "product", "domain-route-map.md"), "utf8");
const navigationDocs = fs.readFileSync(path.join(rootDir, "docs", "product", "navigation-architecture.md"), "utf8");
const envExample = fs.readFileSync(path.join(rootDir, ".env.example"), "utf8");

const failures = [];

const officialKeys = [
  "root", "www", "app", "auth", "profile", "settings", "plans", "support", "admin", "docs", "status",
  "developers", "marketplace", "api", "assets", "cdn", "uploads", "files", "webhooks", "events", "billing",
  "checkout", "console", "factory", "agents", "deploy", "releases", "legal", "feedback", "learn", "blog",
  "partners", "enterprise"
];

const guards = [
  "public",
  "authenticated",
  "workspace_member",
  "billing_required",
  "developer_access",
  "admin_access",
  "super_admin_access",
  "support_access",
  "internal_service"
];

const states = [
  "loading",
  "empty",
  "error",
  "permission-denied",
  "plan-limit",
  "not-found",
  "maintenance",
  "offline",
  "session-expired"
];

for (const key of officialKeys) {
  if (!rootDomainConfig.includes(`domain("${key}"`)) failures.push(`config/domains.ts must define ${key}`);
  if (!shellSource.includes(`shell("${key}"`)) failures.push(`domainShells.tsx must define shell for ${key}`);
  if (!shellSource.includes(`${key}: urlFromEnv("VITE_VAANFORGE_`) && !["root", "www"].includes(key)) {
    failures.push(`DOMAIN_URLS must use VITE env URL for ${key}`);
  }
  if (!subdomainDocs.includes(`${key === "root" ? "vaanforge.com" : `${key}.vaanforge.com`}`) && key !== "www") {
    failures.push(`subdomain-routing.md must mention ${key}`);
  }
  if (!routeMap.includes(`${key === "root" ? "vaanforge.com" : `${key}.vaanforge.com`}`) && key !== "www") {
    failures.push(`domain-route-map.md must mention ${key}`);
  }
}

for (const guard of guards) {
  if (!shellSource.includes(`| "${guard}"`) && !shellSource.includes(`case "${guard}"`)) {
    failures.push(`route guard system must include ${guard}`);
  }
}

for (const state of states) {
  if (!shellSource.includes(`${state}:`) && !shellSource.includes(`"${state}":`)) {
    failures.push(`shared states must include ${state}`);
  }
}

for (const required of [
  "auth.vaanforge.com/login",
  "plans.vaanforge.com/upgrade",
  "permission-denied",
  "admin_access",
  "super_admin_access",
  "internal_service",
  "shellForHost",
  "applyShellMetadata",
  "robots",
  "openGraph",
  "canonicalUrl"
]) {
  if (!shellSource.includes(required) && !appSource.includes(required) && !navigationDocs.includes(required)) {
    failures.push(`subdomain shell/redirect evidence missing: ${required}`);
  }
}

for (const envKey of [
  "VITE_VAANFORGE_PUBLIC_URL",
  "VITE_VAANFORGE_APP_URL",
  "VITE_VAANFORGE_AUTH_URL",
  "VITE_VAANFORGE_ADMIN_URL",
  "VITE_VAANFORGE_MARKETPLACE_URL",
  "VITE_VAANFORGE_WEBHOOKS_URL",
  "VITE_VAANFORGE_EVENTS_URL"
]) {
  if (!envExample.includes(`${envKey}=`)) failures.push(`.env.example must include ${envKey}`);
}

for (const required of [
  "Subdomain-aware navigation",
  "Redirect behavior",
  "Route guard",
  "Page shell",
  "Permission denied",
  "Plan limit"
]) {
  if (!navigationDocs.includes(required)) failures.push(`navigation architecture docs must include ${required}`);
}

if (failures.length) {
  console.error(`Subdomain shell contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Subdomain shell contract check passed for ${officialKeys.length} official domains, ${guards.length} guards, and ${states.length} shared states.`);
