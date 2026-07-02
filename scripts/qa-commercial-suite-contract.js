const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const planConfiguration = fs.readFileSync(path.join(rootDir, "backend", "src", "modules", "billing", "plan-configuration.service.ts"), "utf8");
const billingService = fs.readFileSync(path.join(rootDir, "backend", "src", "modules", "billing", "billing.service.ts"), "utf8");
const workspace = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "Workspace.tsx"), "utf8");
const pricingDoc = fs.readFileSync(path.join(rootDir, "docs", "product", "pricing.md"), "utf8");

const failures = [];

for (const plan of ["Free", "Creator", "Professional", "Studio", "Business", "Enterprise"]) {
  if (!planConfiguration.includes(plan)) failures.push(`central plan configuration must include ${plan}`);
  if (!workspace.includes(plan)) failures.push(`pricing UI must include ${plan}`);
  if (!pricingDoc.includes(plan)) failures.push(`pricing docs must include ${plan}`);
}

for (const price of ["999", "2999", "7999", "19999"]) {
  if (!planConfiguration.includes(price)) failures.push(`central plan configuration must include INR price ${price}`);
}

for (const required of ["creditsIncluded", "limits", "features", "billingPlanSeeds", "usage", "credits", "topup"]) {
  if (!planConfiguration.includes(required) && !billingService.includes(required)) {
    failures.push(`billing backend must include ${required}`);
  }
}

for (const required of ["Billing dashboard", "Secure checkout", "Usage and limits", "Credit wallet", "Most Popular"]) {
  if (!workspace.includes(required)) failures.push(`billing UI must include ${required}`);
}

if (failures.length) {
  console.error(`Commercial suite contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Commercial suite contract check passed for VaanForge pricing and billing surfaces.");
