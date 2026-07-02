import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";
import { store } from "../database/in-memory-store";
import { billingService } from "../modules/billing/billing.service";
import { planConfigurationService } from "../modules/billing/plan-configuration.service";
import { requireUsageLimit } from "../modules/billing/usage-limit.middleware";

async function main() {
  const organizationId = `org-pricing-foundation-${Date.now()}`;
  const customerId = "pricing-customer";
  const actorId = customerId;

  const plans = billingService.plans(organizationId);
  assert.deepEqual(
    plans.map((plan) => plan.tier).sort(),
    ["business", "custom", "enterprise", "free_trial", "pro", "starter"].sort()
  );

  const starter = plans.find((plan) => plan.tier === "starter");
  assert.ok(starter, "Starter plan must be seeded");
  assert.equal(starter.monthlyPrice, planConfigurationService.billingPlanSeeds().find((plan) => plan.planId === "starter")?.monthlyPrice);
  assert.ok(billingService.featureFlags(organizationId, starter.planId).some((flag) => flag.key === "agent.coding_execution" && flag.enabled));
  assert.equal(billingService.usagePolicies(organizationId, starter.planId).find((policy) => policy.metric === "agent_run")?.creditCost, 25);

  const updatedFlags = billingService.updateFeatureFlags(actorId, organizationId, starter.planId, { "deployment.agent": true });
  assert.ok(updatedFlags?.some((flag) => flag.key === "deployment.agent" && flag.enabled));

  await billingService.subscribe({ organizationId, customerId, actorId, planId: starter.planId, billingCycle: "MONTHLY" });
  const allowed = billingService.canConsume({ organizationId, customerId, metric: "agent_run", quantity: 1 });
  assert.equal(allowed.allowed, true);
  const before = billingService.credits(organizationId, customerId).wallet.balance;
  billingService.checkAndConsume({ organizationId, customerId, actorId, metric: "agent_run", quantity: 1, source: "pricing_test", sourceId: "run-1" });
  assert.equal(billingService.credits(organizationId, customerId).wallet.balance, before - 25);

  const custom = billingService.createPlan(actorId, organizationId, {
    tier: "custom",
    name: "One Run Plan",
    description: "Plan used to verify middleware blocks over-limit protected actions.",
    monthlyPrice: 1,
    yearlyPrice: 1,
    limits: { agent_run: 1, template_use: 1, build_minute: 1, ai_credit: 1, storage_mb: 1, deployment: 1, team_member: 1, regeneration: 1 },
    creditsIncluded: 100,
    features: ["One run"]
  });
  await billingService.subscribe({ organizationId, customerId: "limited-pricing-customer", actorId, planId: custom.planId, billingCycle: "MONTHLY" });
  billingService.checkAndConsume({ organizationId, customerId: "limited-pricing-customer", actorId, metric: "agent_run", quantity: 1, source: "pricing_test", sourceId: "limited-1" });

  let nextCalled = false;
  let statusCode = 200;
  let body: unknown;
  const request = {
    session: { organizationId, userId: "limited-pricing-customer" }
  } as unknown as Request;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    }
  } as Response;
  const next: NextFunction = () => {
    nextCalled = true;
  };

  requireUsageLimit({ metric: "agent_run" })(request, response, next);
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 402);
  assert.match(JSON.stringify(body), /Plan limit exceeded/);
  assert.ok(store.planFeatureFlags.length > 0);
  assert.ok(store.planUsagePolicies.length > 0);

  console.log("Pricing foundation test passed for plan seeding, admin flags, usage policies, credit deductions, and middleware enforcement.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
