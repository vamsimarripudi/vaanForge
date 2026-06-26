const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const backendDoc = fs.readFileSync(path.join(rootDir, "docs", "BACKEND.md"), "utf8");

const requiredSrcFolders = ["config", "modules", "common", "middlewares", "guards", "interceptors", "validators", "jobs", "database", "services", "utils"];
const requiredModules = ["auth", "users", "roles", "finance", "crm", "support", "hr", "legal", "compliance"];
const requiredModuleSubfolders = ["controller", "service", "repository", "dto", "validation", "routes"];
const failures = [];

for (const folder of requiredSrcFolders) {
  if (!fs.existsSync(path.join(rootDir, "backend", "src", folder))) {
    failures.push(`Missing backend/src/${folder}`);
  }
}

for (const moduleName of requiredModules) {
  for (const subfolder of requiredModuleSubfolders) {
    if (!fs.existsSync(path.join(rootDir, "backend", "src", "modules", moduleName, subfolder))) {
      failures.push(`Missing backend module subfolder: backend/src/modules/${moduleName}/${subfolder}`);
    }
  }
}

for (const required of ["controller", "service", "repository", "dto", "validation", "routes"]) {
  if (!backendDoc.includes(required)) {
    failures.push(`docs/BACKEND.md must document module subfolder ${required}`);
  }
}

if (failures.length) {
  console.error(`Backend structure contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Backend structure contract check passed for ${requiredSrcFolders.length} src folders and ${requiredModules.length} modules.`);
