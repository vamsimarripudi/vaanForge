const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(rootDir, ...parts), "utf8");

const workspace = read("frontend", "src", "app", "Workspace.tsx");
const shells = read("frontend", "src", "app", "domainShells.tsx");
const theme = read("frontend", "src", "styles", "theme.css");
const packageJson = read("package.json");

const requiredFiles = [
  "docs/audits/ui-ux-finalization-audit.md",
  "docs/frontend/design-system.md",
  "docs/frontend/motion-system.md",
  "docs/frontend/page-states.md",
  "docs/frontend/responsive-guidelines.md",
  "docs/design/figma-asset-integration.md"
];

const checks = [
  [workspace.includes('apiClient<Array<Record<string, any>>>("/builder/projects")'), "Projects view must load backend projects."],
  [workspace.includes('apiClient<unknown>("/agents/runs")'), "Builds view must load backend agent runs."],
  [workspace.includes("function StateBlock"), "Shared StateBlock must exist for loading/error/empty states."],
  [workspace.includes("No project chats yet"), "Sidebar must show an honest empty chat-history state."],
  [!workspace.includes("const BUILDS = ["), "Static build rows must not exist in production UI."],
  [!workspace.includes("EcommerceAPI") && !workspace.includes("AuthService"), "Sample build/project names must not render in production UI."],
  [!workspace.includes("Arjun Varma") && !workspace.includes("Professional workspace"), "Fake profile labels must not render in production UI."],
  [workspace.includes('apiClient<CheckoutSessionSummary>("/billing/checkout/session")'), "Pricing/checkout must remain backend-driven."],
  [shells.includes('["Workspace:settings", "Team:settings", "Billing:billing", "Security:admin-security", "Privacy:privacy", "Support:support"]'), "Settings shell navigation must stay simplified."],
  [shells.includes('["Dashboard:admin", "Billing:admin-billing", "Support:support", "Agents:admin-agents", "Audit:admin-audit", "Security:admin-security", "Operations:admin-operations"]'), "Admin shell navigation must stay focused."],
  [theme.includes("prefers-reduced-motion"), "Reduced motion support must be present."],
  [theme.includes(":focus-visible"), "Keyboard focus visibility must be present."],
  [packageJson.includes("qa-ui-finalization-contract.js"), "E2E script must include the UI finalization contract."]
];

for (const file of requiredFiles) {
  checks.push([fs.existsSync(path.join(rootDir, file)), `Required UI finalization doc missing: ${file}`]);
}

const failures = checks.filter(([ok]) => !ok).map(([, message]) => message);

if (failures.length) {
  console.error(`UI finalization contract failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("UI finalization contract passed.");
