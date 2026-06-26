const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const onboardingPath = path.join(rootDir, "frontend", "src", "features", "onboarding", "components", "OnboardingFlow.tsx");
const workspaceStorePath = path.join(rootDir, "frontend", "src", "store", "workspaceStore.ts");
const workspaceActivationPath = path.join(rootDir, "frontend", "src", "features", "workspaces", "components", "WorkspaceActivationPanel.tsx");
const frontendDocPath = path.join(rootDir, "docs", "FRONTEND.md");

const onboarding = fs.readFileSync(onboardingPath, "utf8");
const workspaceStore = fs.readFileSync(workspaceStorePath, "utf8");
const workspaceActivation = fs.readFileSync(workspaceActivationPath, "utf8");
const frontendDoc = fs.readFileSync(frontendDocPath, "utf8");
const failures = [];

const requiredFields = [
  "founderName",
  "companyName",
  "businessType",
  "country",
  "industry",
  "teamSize",
  "productsNeeded",
  "painPoints",
  "revenueStage",
  "preferredPlan",
  "requiredPortals",
  "complianceNeeds",
  "supportNeeds"
];

for (const field of requiredFields) {
  if (!onboarding.includes(`name="${field}"`) && !onboarding.includes(field)) {
    failures.push(`OnboardingFlow.tsx must collect ${field}`);
  }
}

for (const businessType of ["Startup", "School", "College", "SaaS company", "Event company", "Creator business", "Agency", "Consultancy", "Hospital", "Local business", "Enterprise", "Other"]) {
  if (!onboarding.includes(businessType)) {
    failures.push(`OnboardingFlow.tsx must include business type ${businessType}`);
  }
}

for (const required of ["recommendedSuite", "recommendedPlan", "recommendedModules", "setPreview", "formData.getAll"]) {
  if (!onboarding.includes(required)) {
    failures.push(`OnboardingFlow.tsx must include ${required}`);
  }
}

for (const required of ["productsNeeded?: string[]", "requiredPortals?: string[]", "recommendedModules?: string[]", "revenueStage?: string"]) {
  if (!workspaceStore.includes(required)) {
    failures.push(`workspaceStore.ts must preserve onboarding preview field ${required}`);
  }
}

if (!workspaceActivation.includes("Recommended modules") || !workspaceActivation.includes("preview.recommendedModules")) {
  failures.push("WorkspaceActivationPanel.tsx must surface recommended modules from onboarding");
}

for (const required of ["business type", "products needed", "required portals", "recommended modules", "scripts/qa-onboarding-contract.js"]) {
  if (!frontendDoc.includes(required)) {
    failures.push(`FRONTEND.md must mention ${required}`);
  }
}

if (failures.length) {
  console.error(`Onboarding contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Onboarding contract check passed for ${requiredFields.length} onboarding fields.`);
