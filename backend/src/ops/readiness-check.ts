import { persistenceService, type ReadinessCheck } from "../database/persistence.service";

const readiness = persistenceService.readiness();
const blockingChecks = readiness.checks.filter((check) => check.status === "fail");
const warningChecks = readiness.checks.filter((check) => check.status === "warn");

function printChecks(title: string, checks: ReadinessCheck[]) {
  if (checks.length === 0) {
    return;
  }

  console.log(`\n${title}`);
  for (const check of checks) {
    console.log(`- ${check.key}: ${check.message}`);
  }
}

console.log(`VM Nexus readiness: ${readiness.status}`);
console.log(`Persistence mode: ${readiness.mode}`);
printChecks("Failures", blockingChecks);
printChecks("Warnings", warningChecks);

if (readiness.status !== "ready") {
  process.exitCode = 1;
}
