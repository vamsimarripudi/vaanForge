import assert from "node:assert/strict";
import { store } from "../database/in-memory-store";
import { env } from "../config/env";
import { auditService } from "../modules/audit/audit.service";
import { billingService } from "../modules/billing/billing.service";
import { providerReadinessService } from "../modules/providers/provider-readiness.service";
import { publicTrustService } from "../modules/public-trust/public-trust.service";

async function main() {
  const organizationId = `org-production-data-${Date.now()}`;
  const userId = `user-production-data-${Date.now()}`;
  const actor = { organizationId, userId, role: "Admin" };

  store.organizations.push({ id: organizationId, name: "Production Data Test", suiteType: "VMETRON_SUITE", activePlan: "business", billingStatus: "ACTIVE", createdAt: new Date().toISOString() });
  store.users.push({ id: userId, name: "Production Admin", email: `${userId}@example.com`, passwordHash: "hash", role: "Admin", organizationId, createdAt: new Date().toISOString() });

  const originalOpenAi = process.env.OPENAI_API_KEY;
  const originalParameterStore = env.parameterStoreEnabled;
  process.env.OPENAI_API_KEY = "sk-production-secret-value";
  env.parameterStoreEnabled = true;

  const providers = providerReadinessService.list();
  const openai = providers.find((provider) => provider.provider === "openai");
  assert.ok(openai);
  assert.equal(JSON.stringify(openai).includes("sk-production-secret-value"), false);
  assert.equal(openai?.env[0].maskedValue?.startsWith("sk-"), true);

  const razorpay = providerReadinessService.healthCheck(actor, "razorpay");
  assert.ok(["healthy", "missing_secret", "degraded"].includes(razorpay.status));
  assert.equal(store.providerHealthChecks.some((check) => check.provider === "razorpay"), true);
  assert.equal(auditService.list({ organizationId }).some((entry) => entry.entityType === "ProviderHealthCheck"), true);

  store.legalPages = [];
  store.legalPageVersions = [];
  assert.deepEqual(publicTrustService.legalPages(), []);
  assert.equal(store.legalPages.every((page) => page.status === "draft"), true);

  const creatorPlan = billingService.plans(organizationId).find((plan) => plan.tier === "starter" || plan.name.toLowerCase().includes("creator"));
  assert.ok(creatorPlan, "Creator/Starter plan must be seeded.");
  await billingService.subscribe({ organizationId, customerId: userId, actorId: userId, planId: creatorPlan.planId, billingCycle: "MONTHLY" });
  const first = billingService.checkAndConsume({ organizationId, customerId: userId, actorId: userId, metric: "agent_run", quantity: 1, source: "prompt_7_test", sourceId: "run_1", credits: 2, workspaceId: "workspace_1", idempotencyKey: "prompt7-agent-run-1", metadata: { feature: "provider-readiness" } });
  const duplicate = billingService.checkAndConsume({ organizationId, customerId: userId, actorId: userId, metric: "agent_run", quantity: 1, source: "prompt_7_test", sourceId: "run_1", credits: 2, workspaceId: "workspace_1", idempotencyKey: "prompt7-agent-run-1" });
  assert.equal(first.creditsDeducted, 2);
  assert.equal(duplicate.duplicate, true);
  const events = store.customerUsageEvents.filter((event) => event.organizationId === organizationId && event.idempotencyKey === "prompt7-agent-run-1");
  assert.equal(events.length, 1);
  assert.equal(events[0].workspaceId, "workspace_1");
  assert.equal(events[0].userId, userId);
  assert.equal(events[0].creditsUsed, 2);
  billingService.refund({ organizationId, customerId: userId, actorId: userId, metric: "agent_run", quantity: 1, source: "prompt_7_test", sourceId: "run_1", credits: 2, reason: "Prompt 7 test refund.", idempotencyKey: "prompt7-agent-run-1-refund" });
  assert.equal(store.customerUsageEvents.some((event) => event.organizationId === organizationId && event.status === "refunded"), true);

  process.env.OPENAI_API_KEY = originalOpenAi;
  env.parameterStoreEnabled = originalParameterStore;

  console.log("Production data hardening test passed for provider readiness, secret masking, seed rules, usage idempotency, refunds, and audit logs.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
