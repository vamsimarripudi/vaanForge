const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const suiteConfig = fs.readFileSync(path.join(rootDir, "shared", "src", "suites.ts"), "utf8");
const typeConfig = fs.readFileSync(path.join(rootDir, "shared", "src", "types.ts"), "utf8");
const educationBackendPlans = fs.readFileSync(path.join(rootDir, "backend", "src", "config", "plans", "education-suite.plans.ts"), "utf8");
const vmetronBackendPlans = fs.readFileSync(path.join(rootDir, "backend", "src", "config", "plans", "vmetron-suite.plans.ts"), "utf8");
const educationFrontendPlans = fs.readFileSync(path.join(rootDir, "frontend", "src", "config", "plans", "educationSuitePlans.ts"), "utf8");
const vmetronFrontendPlans = fs.readFileSync(path.join(rootDir, "frontend", "src", "config", "plans", "vmetronSuitePlans.ts"), "utf8");
const educationOnboarding = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "education", "onboarding", "page.tsx"), "utf8");
const vmetronOnboarding = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "vmetron", "onboarding", "page.tsx"), "utf8");
const suiteDashboard = fs.readFileSync(path.join(rootDir, "frontend", "src", "features", "dashboard", "components", "SuiteDashboard.tsx"), "utf8");

const failures = [];

for (const product of ["VIDYALUMA", "VAANMEET", "VFORMIX", "VMETRON", "SUPPORT", "CUSTOMER_PORTAL", "CLIENT_PORTAL", "BILLING", "REPORTS", "COMMUNICATION", "PROMOTIONS"]) {
  if (!typeConfig.includes(`"${product}"`) || !suiteConfig.includes(product)) {
    failures.push(`shared suite catalog must include product ${product}`);
  }
}

for (const product of ["VIDYALUMA", "VAANMEET", "VFORMIX", "SUPPORT", "CUSTOMER_PORTAL", "BILLING", "REPORTS", "COMMUNICATION"]) {
  if (!educationBackendPlans.includes(product) || !educationFrontendPlans.includes(product)) {
    failures.push(`Education Suite plans must include ${product}`);
  }
}

for (const product of ["VMETRON", "VAANMEET", "VFORMIX", "SUPPORT", "CLIENT_PORTAL", "CUSTOMER_PORTAL", "BILLING", "PROMOTIONS", "REPORTS"]) {
  if (!vmetronBackendPlans.includes(product) || !vmetronFrontendPlans.includes(product)) {
    failures.push(`VMetron Suite plans must include ${product}`);
  }
}

for (const required of ["Institution name", "Institution type", "Number of students", "Number of teachers", "Admin contact", "Meeting requirements", "Form requirements", "Support requirements", "Preferred plan"]) {
  if (!educationOnboarding.includes(required)) {
    failures.push(`Education onboarding must include ${required}`);
  }
}

for (const required of ["Organization name", "Organizer type", "Event types", "Expected monthly events", "Average attendees", "Online/offline/hybrid", "Registration form needs", "Promotion/collab needs", "Billing needs", "Preferred plan"]) {
  if (!vmetronOnboarding.includes(required)) {
    failures.push(`VMetron onboarding must include ${required}`);
  }
}

for (const required of ["Active students", "Active teachers", "Meetings created", "Create VaanMeet Room", "Create with VFormix", "Total events", "Upcoming events", "Promotion requests", "Attach VFormix Registration Form", "Enable Support Desk"]) {
  if (!suiteDashboard.includes(required)) {
    failures.push(`Suite dashboard must include ${required}`);
  }
}

if (failures.length) {
  console.error(`Commercial suite contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Commercial suite contract check passed for Education Suite and VMetron Suite.");
