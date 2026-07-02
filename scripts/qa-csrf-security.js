const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const csrfPath = path.join(rootDir, "backend", "src", "middlewares", "csrf.middleware.ts");
const appPath = path.join(rootDir, "backend", "src", "app.ts");
const mainPath = path.join(rootDir, "backend", "src", "main.ts");
const securityRoutesPath = path.join(rootDir, "backend", "src", "modules", "security", "security.routes.ts");

const expectedPublicMutations = [
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  "/api/v1/auth/password-reset/request",
  "/api/v1/auth/password-reset/confirm"
];

const forbiddenPublicMutations = [
  "/api/v1/auth/logout",
  "/api/v1/billing/checkout",
  "/api/v1/entitlements/check",
  "/api/v1/finance/exports",
  "/api/v1/notifications",
  "/api/v1/workspaces"
];

const failures = [];

const csrfSource = fs.readFileSync(csrfPath, "utf8");
const publicBlock = csrfSource.match(/PUBLIC_MUTATION_PATHS = new Set\(\[([\s\S]*?)\]\);/);

if (!publicBlock) {
  failures.push("csrf.middleware.ts must declare PUBLIC_MUTATION_PATHS as a Set");
} else {
  const publicPaths = [...publicBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]).sort();
  const expectedPaths = [...expectedPublicMutations].sort();

  if (JSON.stringify(publicPaths) !== JSON.stringify(expectedPaths)) {
    failures.push(`PUBLIC_MUTATION_PATHS must exactly match ${expectedPaths.join(", ")}`);
  }

  for (const pathValue of forbiddenPublicMutations) {
    if (publicPaths.includes(pathValue)) {
      failures.push(`${pathValue} must not bypass CSRF`);
    }
  }
}

for (const required of [
  'const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])',
  'cookieValue(request.headers.cookie, "kravia_session")',
  "sessionService.verify(sessionToken)",
  "sessionService.isRevoked(session)",
  'request.header("x-csrf-token")',
  'cookieValue(request.headers.cookie, "kravia_csrf")',
  "headerToken !== cookieToken",
  "csrfService.verify(session.userId, headerToken)",
  "request.session = session"
]) {
  if (!csrfSource.includes(required)) {
    failures.push(`csrf.middleware.ts must include ${required}`);
  }
}

const appSource = fs.readFileSync(appPath, "utf8");
const csrfIndex = appSource.indexOf("app.use(csrfMiddleware)");
const apiIndex = appSource.indexOf('app.use("/api/v1", apiRouter)');
if (csrfIndex === -1 || apiIndex === -1 || csrfIndex > apiIndex) {
  failures.push("csrfMiddleware must be mounted before /api/v1 routes in backend/src/app.ts");
}

const mainSource = fs.readFileSync(mainPath, "utf8");
if (!mainSource.includes('import { createApp } from "./app"') || !mainSource.includes("const app = createApp()")) {
  failures.push("backend/src/main.ts must use createApp() so runtime middleware matches tested app wiring");
}

const securityRoutesSource = fs.readFileSync(securityRoutesPath, "utf8");
for (const required of [
  'securityRouter.get("/csrf", authMiddleware',
  'response.cookie("kravia_csrf", token, csrfCookieOptions)',
  "csrfService.sign(request.session!.userId)"
]) {
  if (!securityRoutesSource.includes(required)) {
    failures.push(`security.routes.ts must include ${required}`);
  }
}

if (failures.length) {
  console.error(`CSRF security contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`CSRF security contract check passed for ${expectedPublicMutations.length} public mutation exceptions.`);
