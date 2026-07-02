const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const workspace = fs.readFileSync(path.join(rootDir, "frontend", "src", "app", "Workspace.tsx"), "utf8");
const brandReadme = fs.readFileSync(path.join(rootDir, "frontend", "public", "assets", "brand", "README.md"), "utf8");
const failures = [];

for (const state of ["Loading", "Empty", "Error", "Permission denied", "Plan limit", "Success"]) {
  if (!workspace.includes(state)) failures.push(`Workspace state model must include ${state}`);
}

for (const asset of ["states/loading.svg", "states/empty.svg", "states/success.svg", "states/error.svg", "states/plan-limit.svg"]) {
  if (!fs.existsSync(path.join(rootDir, "frontend", "public", "assets", "brand", asset))) {
    failures.push(`Missing state asset ${asset}`);
  }
}

for (const required of ["loading", "empty", "success", "error", "plan-limit"]) {
  if (!brandReadme.toLowerCase().includes(required)) failures.push(`Brand README must mention ${required} state asset`);
}

if (failures.length) {
  console.error(`State contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("State contract check passed for VaanForge state surfaces.");
