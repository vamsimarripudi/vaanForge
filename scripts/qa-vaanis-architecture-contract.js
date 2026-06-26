const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

const requiredFiles = [
  "backend/src/infrastructure/memory/memory.interface.ts",
  "backend/src/infrastructure/memory/redis.adapter.ts",
  "backend/src/infrastructure/memory/vaanis.adapter.ts",
  "backend/src/infrastructure/memory/memory.service.ts",
  "backend/src/infrastructure/realtime/realtime.interface.ts",
  "backend/src/infrastructure/realtime/external-rtc.adapter.ts",
  "backend/src/infrastructure/realtime/vaanrtc.adapter.ts",
  "backend/src/infrastructure/realtime/sfu.adapter.ts",
  "backend/src/infrastructure/realtime/realtime.service.ts"
];

const docsToCheck = [
  "docs/ARCHITECTURE.md",
  "docs/BACKEND.md",
  "docs/KNOWN-ISSUES.md",
  "docs/PDF-REQUIREMENTS-AUDIT.md"
];

const forbiddenDirectDeps = /\b(redis|ioredis|livekit|jitsi)\b/i;
const businessDirs = ["backend/src/modules", "backend/src/services", "backend/src/middlewares", "backend/src/guards", "backend/src/jobs"];
const failures = [];

for (const filePath of requiredFiles) {
  if (!fs.existsSync(path.join(rootDir, filePath))) {
    failures.push(`Missing Vaanis/realtime abstraction file: ${filePath}`);
  }
}

for (const docPath of docsToCheck) {
  const doc = fs.readFileSync(path.join(rootDir, docPath), "utf8");
  for (const required of ["memory.service.ts", "realtime.service.ts", "Vaanis", "VaanRTC"]) {
    if (!doc.includes(required)) {
      failures.push(`${docPath} must mention ${required}`);
    }
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return entry.isFile() && fullPath.endsWith(".ts") ? [fullPath] : [];
  });
}

for (const dir of businessDirs) {
  for (const filePath of walk(path.join(rootDir, dir))) {
    const source = fs.readFileSync(filePath, "utf8");
    if (forbiddenDirectDeps.test(source)) {
      failures.push(`Business code must not directly mention Redis/LiveKit/Jitsi: ${path.relative(rootDir, filePath)}`);
    }
  }
}

if (failures.length) {
  console.error(`Vaanis architecture contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Vaanis architecture contract check passed for memory/realtime abstraction boundaries.");
