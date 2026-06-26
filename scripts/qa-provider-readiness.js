const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const readinessPath = path.join(rootDir, "backend", "src", "database", "persistence.service.ts");
const knownIssuesPath = path.join(rootDir, "docs", "KNOWN-ISSUES.md");
const envGuidePath = path.join(rootDir, "docs", "infra", "env-guide.md");

const providerContracts = [
  {
    service: "backend/src/infrastructure/email/email.service.ts",
    envKeys: ["emailProvider"],
    readinessKey: "email-provider",
    devOnly: "local",
    docs: ["EMAIL_PROVIDER=local", "production email"]
  },
  {
    service: "backend/src/infrastructure/sms/sms.service.ts",
    envKeys: ["smsProvider"],
    readinessKey: "sms-provider",
    devOnly: "local",
    docs: ["SMS_PROVIDER=local", "production email/SMS"]
  },
  {
    service: "backend/src/infrastructure/storage/storage.service.ts",
    envKeys: ["s3Endpoint"],
    readinessKey: "storage-provider",
    devOnly: "local",
    docs: ["S3_ENDPOINT=local", "production file storage"]
  },
  {
    service: "backend/src/infrastructure/ai/ai.service.ts",
    envKeys: ["aiProvider"],
    readinessKey: "ai-provider",
    devOnly: "deterministic",
    docs: ["AI_PROVIDER=deterministic", "reviewed AI provider"]
  },
  {
    service: "backend/src/infrastructure/payments/payments.service.ts",
    envKeys: ["razorpayKeyId", "razorpayKeySecret"],
    readinessKey: "payments-provider",
    devOnly: "local",
    docs: ["RAZORPAY_KEY_ID=local", "RAZORPAY_KEY_SECRET=local", "Production billing"]
  },
  {
    service: "backend/src/infrastructure/realtime/realtime.service.ts",
    envKeys: ["realtimeAdapter"],
    readinessKey: "realtime-adapter",
    devOnly: "external",
    docs: ["REALTIME_ADAPTER=external", "VaanRTC"]
  },
  {
    service: "backend/src/infrastructure/memory/memory.service.ts",
    envKeys: ["memoryAdapter"],
    readinessKey: "memory-adapter",
    devOnly: "external",
    docs: ["MEMORY_ADAPTER=redis", "Vaanis"]
  }
];

const readiness = fs.readFileSync(readinessPath, "utf8");
const knownIssues = fs.readFileSync(knownIssuesPath, "utf8");
const envGuide = fs.readFileSync(envGuidePath, "utf8");
const failures = [];

for (const contract of providerContracts) {
  const servicePath = path.join(rootDir, contract.service);
  const service = fs.readFileSync(servicePath, "utf8");

  for (const envKey of contract.envKeys) {
    if (!service.includes(`env.${envKey}`)) {
      failures.push(`${contract.service} must select its adapter using env.${envKey}`);
    }
    if (!readiness.includes(`env.${envKey}`)) {
      failures.push(`readiness must check env.${envKey}`);
    }
  }

  if (!readiness.includes(`"${contract.readinessKey}"`)) {
    failures.push(`readiness must expose ${contract.readinessKey}`);
  }

  if (!readiness.includes(`"${contract.devOnly}"`)) {
    failures.push(`readiness must treat ${contract.devOnly} as a dev-only or placeholder value`);
  }

  for (const docSnippet of contract.docs) {
    if (!envGuide.includes(docSnippet) && !knownIssues.includes(docSnippet)) {
      failures.push(`provider docs must mention ${docSnippet}`);
    }
  }
}

for (const helper of ["adapterCheck", "providerCheck", "credentialPairCheck"]) {
  if (!readiness.includes(helper)) {
    failures.push(`readiness must keep ${helper}`);
  }
}

if (failures.length) {
  console.error(`Provider readiness contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Provider readiness contract check passed for ${providerContracts.length} provider groups.`);
