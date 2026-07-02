import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextFunction, Request, Response } from "express";
import { store } from "../database/in-memory-store";
import { billingService } from "../modules/billing/billing.service";
import { requireUsageLimit } from "../modules/billing/usage-limit.middleware";

async function main() {
  const organizationId = `org-pricing-adoption-${Date.now()}`;
  const customerId = "pricing-adoption-customer";
  const actorId = customerId;

  const plans = billingService.plans(organizationId);
  const free = plans.find((plan) => plan.name === "Free");
  const creator = plans.find((plan) => plan.name === "Creator");
  const professional = plans.find((plan) => plan.name === "Professional");
  const studio = plans.find((plan) => plan.name === "Studio");
  const business = plans.find((plan) => plan.name === "Business");
  const enterprise = plans.find((plan) => plan.name === "Enterprise");

  assert.equal(free?.monthlyPrice, 0);
  assert.equal(free?.limits.agent_run, 1);
  assert.equal(creator?.monthlyPrice, 99900);
  assert.equal(professional?.monthlyPrice, 299900);
  assert.equal(professional?.features.includes("Most Popular"), true);
  assert.equal(studio?.limits.storage_mb, 512000);
  assert.equal(business?.limits.ai_credit, 500000);
  assert.ok(enterprise);
  assert.ok(billingService.priceHistory(organizationId).length >= 6);

  const beforeHistory = billingService.priceHistory(organizationId, professional!.planId).length;
  billingService.updatePlan("billing-admin", organizationId, professional!.planId, { monthlyPrice: professional!.monthlyPrice + 100 });
  assert.equal(billingService.priceHistory(organizationId, professional!.planId).length, beforeHistory + 1);

  const checkout = await billingService.createCheckoutSession({
    organizationId,
    customerId,
    actorId,
    planId: creator!.planId,
    billingCycle: "MONTHLY",
    billingDetails: { name: "Pricing Customer", email: "pricing@example.com" },
    termsAccepted: true
  });
  assert.equal(checkout.priceSummary.gstRatePercent, 18);
  assert.equal(checkout.checkout.status, "PROVIDER_NOT_CONFIGURED");
  assert.equal(checkout.paymentProvider.status, "provider_not_configured");
  assert.equal(billingService.confirmCheckout({ organizationId, customerId, actorId, checkoutSessionId: checkout.checkoutSessionId }).status, "provider_not_configured");

  await billingService.subscribe({ organizationId, customerId: "limited-adoption", actorId, planId: free!.planId, billingCycle: "MONTHLY" });
  billingService.checkAndConsume({ organizationId, customerId: "limited-adoption", actorId, metric: "agent_run", quantity: 1, source: "pricing_adoption", sourceId: "first", credits: 0 });

  let body: any;
  const request = { session: { organizationId, userId: "limited-adoption" }, requestId: "req-pricing-adoption", header: () => undefined } as unknown as Request;
  const response = {
    status(code: number) {
      assert.equal(code, 402);
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    }
  } as Response;
  const next: NextFunction = () => assert.fail("Expected plan limit middleware to block.");
  requireUsageLimit({ metric: "agent_run" })(request, response, next);
  assert.equal(body.error.code, "PLAN_LIMIT_REACHED");
  assert.equal(body.planLimit.currentPlan.name, "Free");
  assert.ok(body.planLimit.requiredPlan.name);
  assert.equal(body.planLimit.upgradeUrl, "/pricing");
  assert.ok(store.customerUsageEvents.some((event) => event.organizationId === organizationId && event.status === "accepted"));

  const workspaceSource = readFileSync(join(process.cwd(), "..", "frontend", "src", "app", "Workspace.tsx"), "utf8");
  assert.equal(/₹\s?(999|2,999|7,999|19,999)|99900|299900|799900|1999900/.test(workspaceSource), false);

  console.log("Pricing adoption readiness test passed for source-of-truth plans, price history, checkout readiness, plan-limit payloads, usage events, and frontend pricing hygiene.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
