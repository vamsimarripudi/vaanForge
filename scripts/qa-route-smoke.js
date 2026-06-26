const fs = require("fs");
const path = require("path");

const appDir = path.join(__dirname, "..", "frontend", "src", "app");
const requiredRoutes = [
  "page.tsx",
  "about/page.tsx",
  "account/page.tsx",
  "account/reset-password/page.tsx",
  "admin/page.tsx",
  "automation/page.tsx",
  "billing/page.tsx",
  "client/page.tsx",
  "communication/page.tsx",
  "compliance/page.tsx",
  "contact/page.tsx",
  "creator/page.tsx",
  "crm/page.tsx",
  "customer/page.tsx",
  "data-policy/page.tsx",
  "education/page.tsx",
  "education/dashboard/page.tsx",
  "education/forms/page.tsx",
  "education/meetings/page.tsx",
  "education/onboarding/page.tsx",
  "education/settings/page.tsx",
  "education/students/page.tsx",
  "education/support/page.tsx",
  "education/teachers/page.tsx",
  "finance/page.tsx",
  "founder/dashboard/page.tsx",
  "features/page.tsx",
  "hiring/page.tsx",
  "hr/page.tsx",
  "intelligence/page.tsx",
  "interviews/page.tsx",
  "legal/page.tsx",
  "marketing/page.tsx",
  "onboarding/page.tsx",
  "operations/page.tsx",
  "partners/page.tsx",
  "planning/page.tsx",
  "pricing/page.tsx",
  "privacy/page.tsx",
  "registrations/page.tsx",
  "refund/page.tsx",
  "reports/page.tsx",
  "settings/page.tsx",
  "support/page.tsx",
  "terms/page.tsx",
  "vmetron/page.tsx",
  "vmetron/dashboard/page.tsx",
  "vmetron/events/page.tsx",
  "vmetron/forms/page.tsx",
  "vmetron/meetings/page.tsx",
  "vmetron/onboarding/page.tsx",
  "vmetron/promotions/page.tsx",
  "vmetron/registrations/page.tsx",
  "vmetron/settings/page.tsx",
  "vmetron/support/page.tsx"
];

const missing = requiredRoutes.filter((route) => !fs.existsSync(path.join(appDir, route)));

if (missing.length) {
  console.error(`Missing routes:\n${missing.join("\n")}`);
  process.exit(1);
}

const manifestPath = path.join(__dirname, "..", "frontend", ".next", "app-path-routes-manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifestMtime = fs.statSync(manifestPath).mtimeMs;
  const latestRouteMtime = Math.max(...requiredRoutes.map((route) => fs.statSync(path.join(appDir, route)).mtimeMs));
  if (manifestMtime >= latestRouteMtime) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const routeValues = new Set(Object.values(manifest));
    const missingBuiltRoutes = requiredRoutes
      .filter((route) => route.endsWith("page.tsx"))
      .map((route) => `/${route.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "")}`.replace(/\/$/, "") || "/")
      .filter((route) => !routeValues.has(route));
    if (missingBuiltRoutes.length) {
      console.error(`Missing built routes:\n${missingBuiltRoutes.join("\n")}`);
      process.exit(1);
    }
  }
}

console.log(`Route smoke check passed for ${requiredRoutes.length} app routes.`);
