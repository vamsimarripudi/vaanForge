import assert from "node:assert/strict";
import { billingService } from "../modules/billing/billing.service";

async function main() {
  const organizationId = `org-builder-billing-${Date.now()}`;
  const customerId = "customer-billing";
  const actorId = customerId;

  const plans = billingService.plans(organizationId);
  assert.ok(plans.some((plan) => plan.tier === "free_trial"));
  const starter = plans.find((plan) => plan.tier === "starter");
  assert.ok(starter);

  const subscription = await billingService.subscribe({ organizationId, customerId, actorId, planId: starter!.planId, billingCycle: "MONTHLY" });
  assert.equal(subscription.subscription.status, "active");
  assert.ok(subscription.invoice.invoiceId);
  assert.ok(subscription.checkout);

  const creditsBefore = billingService.credits(organizationId, customerId).wallet.balance;
  const usage = billingService.checkAndConsume({ organizationId, customerId, actorId, metric: "agent_run", quantity: 1, source: "test", sourceId: "run-1" });
  assert.equal(usage.allowed, true);
  const creditsAfter = billingService.credits(organizationId, customerId).wallet.balance;
  assert.equal(creditsAfter, creditsBefore - 25);

  billingService.refund({ organizationId, customerId, actorId, metric: "agent_run", quantity: 1, source: "test", sourceId: "run-1", reason: "Failed run refund." });
  assert.equal(billingService.credits(organizationId, customerId).wallet.balance, creditsBefore);

  const toppedUp = billingService.topup({ organizationId, customerId, actorId, credits: 50, paymentReference: "manual-topup" });
  assert.equal(toppedUp.wallet.balance, creditsBefore + 50);
  assert.ok(billingService.invoices(organizationId, customerId).length >= 2);

  const custom = billingService.createPlan("admin", organizationId, {
    tier: "custom",
    name: "Custom Metered",
    description: "Custom plan for a metered builder tenant.",
    monthlyPrice: 99900,
    yearlyPrice: 999000,
    limits: { agent_run: 1, template_use: 1, build_minute: 1, ai_credit: 1, storage_mb: 1, deployment: 1, team_member: 1, regeneration: 1 },
    creditsIncluded: 1,
    features: ["Metered builder"],
    ownerId: "admin"
  });
  assert.equal(custom.tier, "custom");
  assert.equal(billingService.updatePlan("admin", organizationId, custom.planId, { monthlyPrice: 100000 })?.monthlyPrice, 100000);

  await billingService.subscribe({ organizationId, customerId: "limited-customer", actorId: "limited-customer", planId: custom.planId, billingCycle: "MONTHLY" });
  billingService.checkAndConsume({ organizationId, customerId: "limited-customer", actorId: "limited-customer", metric: "deployment", quantity: 1, source: "test", sourceId: "deploy-1", credits: 0 });
  assert.throws(
    () => billingService.checkAndConsume({ organizationId, customerId: "limited-customer", actorId: "limited-customer", metric: "deployment", quantity: 1, source: "test", sourceId: "deploy-2", credits: 0 }),
    /Plan limit exceeded/
  );

  const webhook = billingService.handleRazorpayWebhook({ signature: "local", payload: { id: "evt_1", event: "payment.captured" } });
  assert.equal(webhook.status, "processed");
  const duplicate = billingService.handleRazorpayWebhook({ signature: "local", payload: { id: "evt_1", event: "payment.captured" } });
  assert.equal(duplicate.status, "duplicate");

  console.log("Builder billing test passed through plans, subscription, invoices, usage limits, credits, refunds, top-ups, admin plan updates, and Razorpay webhook idempotency.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
