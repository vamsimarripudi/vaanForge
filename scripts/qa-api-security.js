const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const modulesDir = path.join(rootDir, "backend", "src", "modules");

const publicRoutes = new Set([
  "auth:post:/register",
  "auth:post:/login",
  "auth:post:/forgot-password",
  "auth:post:/reset-password",
  "auth:post:/refresh",
  "auth:post:/verify-email",
  "auth:post:/resend-verification",
  "auth:post:/password-reset/request",
  "auth:post:/password-reset/confirm",
  "billing:get:/plans",
  "enterprise:get:/pricing",
  "marketplace:get:/apps",
  "marketplace:get:/categories",
  "marketplace:get:/apps/:appId",
  "public-trust:docsPublicRouter:get:/",
  "public-trust:docsPublicRouter:get:/categories",
  "public-trust:docsPublicRouter:get:/search",
  "public-trust:docsPublicRouter:get:/:slug",
  "public-trust:statusPublicRouter:get:/",
  "public-trust:statusPublicRouter:get:/services",
  "public-trust:statusPublicRouter:get:/incidents",
  "public-trust:statusPublicRouter:get:/incidents/:incidentId",
  "public-trust:statusPublicRouter:get:/history",
  "public-trust:statusPublicRouter:post:/subscribe",
  "public-trust:legalPagesPublicRouter:get:/pages",
  "public-trust:legalPagesPublicRouter:get:/pages/:slug",
  "public-trust:releasesPublicRouter:get:/",
  "public-trust:releasesPublicRouter:get:/changelog",
  "public-trust:releasesPublicRouter:get:/:releaseId",
  "public-trust:enterprisePublicRouter:post:/contact-sales",
  "public-trust:enterprisePublicRouter:post:/demo-request",
  "public-trust:enterprisePublicRouter:get:/solutions",
  "public-trust:enterprisePublicRouter:get:/security",
  "public-trust:partnersProgramRouter:post:/apply",
  "public-trust:partnersProgramRouter:get:/resources",
  "plans:get:/",
  "plans:get:/:planId",
  "system:get:/readiness"
]);

const authenticatedMutationAllowlist = new Map([
  ["auth:post:/logout", "current user session revocation"],
  ["auth:delete:/sessions/:sessionId", "current user session revocation"],
  ["billing:post:/builder/subscribe", "authenticated customer subscription self-service"],
  ["billing:post:/builder/cancel", "authenticated customer subscription self-service"],
  ["billing:post:/builder/change-plan", "authenticated customer subscription self-service"],
  ["billing:post:/builder/credits/topup", "authenticated customer credit top-up"],
  ["billing:post:/subscribe", "authenticated customer subscription self-service"],
  ["billing:post:/cancel", "authenticated customer subscription self-service"],
  ["billing:post:/change-plan", "authenticated customer subscription self-service"],
  ["billing:post:/credits/topup", "authenticated customer credit top-up"],
  ["builder:post:/projects", "authenticated customer project creation"],
  ["builder:patch:/projects/:projectId", "authenticated customer project update with tenant isolation"],
  ["builder:post:/projects/:projectId/requirements", "authenticated customer requirement submission"],
  ["builder:post:/projects/:projectId/blueprint/approve", "authenticated customer blueprint approval"],
  ["builder:post:/projects/:projectId/blueprint/reject", "authenticated customer blueprint rejection"],
  ["builder:post:/projects/:projectId/change-requests", "authenticated customer change request"],
  ["entitlements:post:/check", "authenticated entitlement lookup"],
  ["notifications:patch:/:notificationId/read", "current user notification state"],
  ["roles:post:/check", "authenticated role-permission lookup"],
  ["support:post:/tickets", "authenticated customer/support ticket creation"],
  ["tasks:patch:/:taskId/status", "authenticated task status update"]
]);

const signedWebhookRoutes = new Map([
  ["billing:post:/razorpay", "verifyRazorpayWebhookSignature"],
  ["billing:post:/webhooks/razorpay", "verifyRazorpayWebhookSignature"],
  ["vformix-agent:post:/agent/webhook", "verifyVFormixAgentWebhookSignature"]
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
  const routerAuth = new Set(
    [...source.matchAll(/(\w+Router)\.use\(([^)]*authMiddleware[^)]*)\)/g)].map((item) => item[1])
  );
  const routerPermission = new Set(
    [...source.matchAll(/(\w+Router)\.use\(([^)]*requirePermission\([^)]*\)[^)]*)\)/g)].map((item) => item[1])
  );
  let match;
  while ((match = routePattern.exec(source))) {
    const [routeStart, routerName, method, routePath] = match;
    const lineEnd = source.indexOf("\n", match.index);
    const signature = source.slice(match.index, lineEnd === -1 ? undefined : lineEnd);
    const key = `${moduleId}:${method}:${routePath}`;
    const scopedKey = `${moduleId}:${routerName}:${method}:${routePath}`;
    const isPublic = publicRoutes.has(key) || publicRoutes.has(scopedKey);
    const signedWebhookMiddleware = signedWebhookRoutes.get(key);
    const isSignedWebhook = Boolean(signedWebhookMiddleware && signature.includes(signedWebhookMiddleware));
    const isMutation = ["post", "patch", "put", "delete"].includes(method);
    const hasAuth = signature.includes("authMiddleware") || routerAuth.has(routerName);
    const hasPermission = signature.includes("requirePermission(") || routerPermission.has(routerName);

    routes.push(key);
    routes.push(scopedKey);

    if (!isPublic && !isSignedWebhook && !hasAuth) {
      failures.push(`${key} must include authMiddleware`);
    }

    if (isMutation && !isPublic && !isSignedWebhook && !hasPermission && !authenticatedMutationAllowlist.has(key)) {
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

for (const [key, middlewareName] of signedWebhookRoutes.entries()) {
  if (!routes.includes(key)) {
    failures.push(`signed webhook allowlist points to missing route ${key}`);
  }
  const route = routes.find((item) => item === key);
  if (!route || !middlewareName) {
    failures.push(`signed webhook route ${key} is missing signature verification middleware`);
  }
}

if (failures.length) {
  console.error(`API security contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`API security contract check passed for ${routes.length} routes.`);
