const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const readinessPath = path.join(rootDir, "backend", "src", "database", "persistence.service.ts");
const readinessDocPath = path.join(rootDir, "docs", "PRODUCTION-READINESS.md");
const envGuidePath = path.join(rootDir, "docs", "infra", "env-guide.md");
const deploymentPath = path.join(rootDir, "docs", "DEPLOYMENT.md");

const readiness = fs.readFileSync(readinessPath, "utf8");
const readinessDoc = fs.readFileSync(readinessDocPath, "utf8");
const envGuide = fs.readFileSync(envGuidePath, "utf8");
const deployment = fs.readFileSync(deploymentPath, "utf8");

const failures = [];

const readinessContracts = [
  {
    key: "persistence-mode",
    env: ["PERSISTENCE_MODE=postgres"],
    docs: ["Set `PERSISTENCE_MODE=postgres`"]
  },
  {
    key: "database-url",
    env: ["DATABASE_URL"],
    docs: ["production PostgreSQL", "npm run db:migrate:deploy"]
  },
  {
    key: "jwt-secret",
    env: ["JWT_SECRET"],
    docs: ["strong production secret"]
  },
  {
    key: "root-domain",
    env: ["ROOT_DOMAIN"],
    docs: ["final approved root domain"]
  },
  {
    key: "frontend-url",
    env: ["FRONTEND_URL"],
    docs: ["public HTTPS frontend origin"]
  },
  {
    key: "memory-adapter",
    env: ["MEMORY_ADAPTER"],
    docs: ["production memory/cache adapter"]
  },
  {
    key: "realtime-adapter",
    env: ["REALTIME_ADAPTER"],
    docs: ["production realtime adapter"]
  },
  {
    key: "email-provider",
    env: ["EMAIL_PROVIDER"],
    docs: ["approved production email provider"]
  },
  {
    key: "sms-provider",
    env: ["SMS_PROVIDER"],
    docs: ["approved production SMS provider"]
  },
  {
    key: "storage-provider",
    env: ["S3_ENDPOINT"],
    docs: ["approved production object storage"]
  },
  {
    key: "ai-provider",
    env: ["AI_PROVIDER"],
    docs: ["approved production AI provider"]
  },
  {
    key: "payments-provider",
    env: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
    docs: ["production Razorpay credentials"]
  }
];

const repositoryNames = [
  "automation",
  "auth",
  "communication",
  "compliance",
  "crm",
  "creators",
  "finance",
  "hr",
  "intelligence",
  "legal",
  "partners",
  "settings",
  "support",
  "tasks",
  "workspaces"
];

for (const contract of readinessContracts) {
  if (!readiness.includes(`key: "${contract.key}"`) && !readiness.includes(`"${contract.key}"`)) {
    failures.push(`readiness service must expose ${contract.key}`);
  }

  if (!readinessDoc.includes(`\`${contract.key}\``)) {
    failures.push(`PRODUCTION-READINESS.md must document ${contract.key}`);
  }

  for (const envKey of contract.env) {
    if (!readinessDoc.includes(envKey)) {
      failures.push(`PRODUCTION-READINESS.md must mention ${envKey} for ${contract.key}`);
    }
    if (!envGuide.includes(envKey)) {
      failures.push(`env-guide.md must mention ${envKey}`);
    }
  }

  for (const snippet of contract.docs) {
    if (!readinessDoc.includes(snippet)) {
      failures.push(`PRODUCTION-READINESS.md must explain ${snippet}`);
    }
  }
}

for (const repositoryName of repositoryNames) {
  if (!readiness.includes(`${repositoryName}Service.health()`)) {
    failures.push(`readiness service must check ${repositoryName} repository health`);
  }
}

for (const command of [
  "npm ci",
  "npm run prisma:generate --workspace backend",
  "npm run db:migrate:deploy",
  "npm run typecheck",
  "npm test",
  "npm run test:e2e",
  "npm run phase:status",
  "npm run build",
  "npm run launch:readiness"
]) {
  if (!readinessDoc.includes(command) || !deployment.includes(command)) {
    failures.push(`production launch docs must include ${command}`);
  }
}

if (!readinessDoc.includes("ready") || !readinessDoc.includes("exit with code 0")) {
  failures.push("PRODUCTION-READINESS.md must state the ready/zero-exit launch requirement");
}

if (failures.length) {
  console.error(`Production readiness contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Production readiness contract check passed for ${readinessContracts.length} readiness keys and ${repositoryNames.length} repositories.`);
