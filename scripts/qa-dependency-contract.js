const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const rootPackage = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const frontendPackage = JSON.parse(fs.readFileSync(path.join(rootDir, "frontend", "package.json"), "utf8"));
const backendPackage = JSON.parse(fs.readFileSync(path.join(rootDir, "backend", "package.json"), "utf8"));
const packageLock = JSON.parse(fs.readFileSync(path.join(rootDir, "package-lock.json"), "utf8"));
const knownIssues = fs.readFileSync(path.join(rootDir, "docs", "KNOWN-ISSUES.md"), "utf8");
const finalAudit = fs.readFileSync(path.join(rootDir, "docs", "FINAL-AUDIT.md"), "utf8");

const failures = [];

const expectedWorkspaces = ["frontend", "backend", "shared", "design-system"];
if (JSON.stringify(rootPackage.workspaces) !== JSON.stringify(expectedWorkspaces)) {
  failures.push(`root package.json workspaces must be ${expectedWorkspaces.join(", ")}`);
}

if (rootPackage.engines?.node !== ">=20.0.0") {
  failures.push("root package.json must require Node >=20.0.0");
}

for (const script of ["build", "typecheck", "test", "test:e2e", "phase:status", "launch:readiness", "db:migrate:deploy"]) {
  if (!rootPackage.scripts?.[script]) {
    failures.push(`root package.json must expose ${script}`);
  }
}

for (const dependency of ["react", "react-dom", "zod"]) {
  if (!frontendPackage.dependencies?.[dependency]) {
    failures.push(`frontend package.json must depend on ${dependency}`);
  }
}

for (const dependency of ["vite", "@vitejs/plugin-react", "typescript-eslint"]) {
  if (!frontendPackage.devDependencies?.[dependency]) {
    failures.push(`frontend package.json must include Vite React tooling dependency ${dependency}`);
  }
}

if (frontendPackage.dependencies?.next || frontendPackage.devDependencies?.next || frontendPackage.devDependencies?.["eslint-config-next"]) {
  failures.push("frontend package.json must not depend on the retired app-router framework after the Vite migration");
}

for (const dependency of ["express", "helmet", "cors", "jsonwebtoken", "zod", "@prisma/client"]) {
  if (!backendPackage.dependencies?.[dependency]) {
    failures.push(`backend package.json must depend on ${dependency}`);
  }
}

const lockRoot = packageLock.packages?.[""];
if (!lockRoot?.workspaces || JSON.stringify(lockRoot.workspaces) !== JSON.stringify(expectedWorkspaces)) {
  failures.push("package-lock root workspace metadata must match package.json");
}

const lockedVite = packageLock.packages?.["node_modules/vite"] || packageLock.packages?.["frontend/node_modules/vite"];
if (!lockedVite) {
  failures.push("package-lock must include Vite");
}

const lockedPluginReact = packageLock.packages?.["node_modules/@vitejs/plugin-react"] || packageLock.packages?.["frontend/node_modules/@vitejs/plugin-react"];
if (!lockedPluginReact) {
  failures.push("package-lock must include @vitejs/plugin-react");
}

const lockedPostcss = packageLock.packages?.["node_modules/postcss"] || packageLock.packages?.["frontend/node_modules/postcss"];
if (!lockedPostcss) {
  failures.push("package-lock must include PostCSS through Tailwind/Vite tooling");
}

for (const required of ["npm audit", "Vite React", "low severity vulnerabilities"]) {
  if (!knownIssues.includes(required) && !finalAudit.includes(required)) {
    failures.push(`dependency risk docs must mention ${required}`);
  }
}

if (failures.length) {
  console.error(`Dependency contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Dependency contract check passed for workspace, Vite React runtime, and dependency risk documentation.");
