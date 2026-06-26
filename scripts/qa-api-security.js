const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const modulesDir = path.join(rootDir, "backend", "src", "modules");

const publicRoutes = new Set([
  "auth:post:/register",
  "auth:post:/login",
  "auth:post:/password-reset/request",
  "auth:post:/password-reset/confirm",
  "plans:get:/",
  "plans:get:/:planId",
  "system:get:/readiness"
]);

const authenticatedMutationAllowlist = new Map([
  ["auth:post:/logout", "current user session revocation"],
  ["entitlements:post:/check", "authenticated entitlement lookup"],
  ["notifications:patch:/:notificationId/read", "current user notification state"],
  ["roles:post:/check", "authenticated role-permission lookup"],
  ["support:post:/tickets", "authenticated customer/support ticket creation"],
  ["tasks:patch:/:taskId/status", "authenticated task status update"]
]);

function listRouteFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listRouteFiles(entryPath);
    }
    return entry.name.endsWith(".routes.ts") ? [entryPath] : [];
  });
}

function moduleName(filePath) {
  return path.basename(path.dirname(filePath));
}

const failures = [];
const routes = [];
const routePattern = /(\w+Router)\.(get|post|patch|put|delete)\("([^"]+)"/g;

for (const filePath of listRouteFiles(modulesDir)) {
  const source = fs.readFileSync(filePath, "utf8");
  const moduleId = moduleName(filePath);
  let match;
  while ((match = routePattern.exec(source))) {
    const [routeStart, , method, routePath] = match;
    const lineEnd = source.indexOf("\n", match.index);
    const signature = source.slice(match.index, lineEnd === -1 ? undefined : lineEnd);
    const key = `${moduleId}:${method}:${routePath}`;
    const isPublic = publicRoutes.has(key);
    const isMutation = ["post", "patch", "put", "delete"].includes(method);
    const hasAuth = signature.includes("authMiddleware");
    const hasPermission = signature.includes("requirePermission(");

    routes.push(key);

    if (!isPublic && !hasAuth) {
      failures.push(`${key} must include authMiddleware`);
    }

    if (isMutation && !isPublic && !hasPermission && !authenticatedMutationAllowlist.has(key)) {
      failures.push(`${key} must include requirePermission(...) or be added to the authenticated mutation allowlist`);
    }

    routePattern.lastIndex = match.index + routeStart.length;
  }
}

for (const key of publicRoutes) {
  if (!routes.includes(key)) {
    failures.push(`public route allowlist points to missing route ${key}`);
  }
}

for (const key of authenticatedMutationAllowlist.keys()) {
  if (!routes.includes(key)) {
    failures.push(`authenticated mutation allowlist points to missing route ${key}`);
  }
}

if (failures.length) {
  console.error(`API security contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`API security contract check passed for ${routes.length} routes.`);
