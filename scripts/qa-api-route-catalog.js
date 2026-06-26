const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const routesSource = fs.readFileSync(path.join(rootDir, "backend", "src", "routes.ts"), "utf8");
const apiDoc = fs.readFileSync(path.join(rootDir, "docs", "API.md"), "utf8");

const requiredPdfRoutes = [
  "/auth",
  "/onboarding",
  "/organizations",
  "/workspaces",
  "/users",
  "/roles",
  "/plans",
  "/billing",
  "/revenue",
  "/expenses",
  "/pnl",
  "/gst",
  "/cash-flow",
  "/customers",
  "/clients",
  "/leads",
  "/sales",
  "/support",
  "/hr",
  "/candidates",
  "/interviews",
  "/employees",
  "/tasks",
  "/projects",
  "/documents",
  "/legal",
  "/compliance",
  "/creators",
  "/partners",
  "/reports",
  "/automation",
  "/settings",
  "/notifications",
  "/audit"
];

const failures = [];

for (const route of requiredPdfRoutes) {
  if (!routesSource.includes(`apiRouter.use("${route}"`)) {
    failures.push(`backend/src/routes.ts must mount PDF API route group ${route}`);
  }

  if (!apiDoc.includes(`/api/v1${route}`)) {
    failures.push(`docs/API.md must document PDF API route group ${route}`);
  }
}

if (!routesSource.includes('apiRouter.get("/health"') || !apiDoc.includes("/api/v1/health")) {
  failures.push("API base health route must remain mounted and documented");
}

if (failures.length) {
  console.error(`API route catalog contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`API route catalog contract check passed for ${requiredPdfRoutes.length} PDF route groups.`);
