import assert from "node:assert/strict";
import { store } from "../database/in-memory-store";
import { localEmailOutbox } from "../infrastructure/email/local-email.adapter";
import { billingService } from "../modules/billing/billing.service";

async function main() {
  const organizationId = `org-checkout-${Date.now()}`;
  const customerId = "billing-customer@kravia.local";
  const actorId = customerId;
  const starter = billingService.plans(organizationId).find((plan) => plan.tier === "starter");
  const pro = billingService.plans(organizationId).find((plan) => plan.tier === "pro");
  assert.ok(starter);
  assert.ok(pro);

  const created = await billingService.subscribe({ organizationId, customerId, actorId, planId: starter.planId, billingCycle: "YEARLY" });
  assert.equal(created.subscription.billingCycle, "YEARLY");
  assert.ok(created.checkout?.providerOrderId);
  assert.equal(created.invoice.gstRatePercent, 18);
  assert.ok(created.invoice.gstAmount! > 0);
  assert.ok(created.invoice.downloadUrl?.includes(created.invoice.invoiceId));
  assert.ok(localEmailOutbox.some((message) => message.to === customerId && message.subject.includes("subscription")));

  const download = billingService.invoiceDownload(organizationId, customerId, created.invoice.invoiceId);
  assert.ok(download?.content.includes("KRAVIA PRIVATE LIMITED"));
  assert.ok(download?.content.includes("GST"));

  const history = billingService.paymentHistory(organizationId, customerId);
  assert.equal(history.payments.length, 1);
  assert.equal(history.attempts.some((attempt) => attempt.status === "pending"), true);
  const payment = history.payments[0];

  const paidPayload = { id: "evt_paid_1", event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: payment.providerOrderId } } } };
  assert.equal(billingService.handleRazorpayWebhook({ signature: "local", payload: paidPayload }).status, "processed");
  assert.equal(billingService.handleRazorpayWebhook({ signature: "local", payload: paidPayload }).status, "duplicate");
  assert.equal(store.customerPayments.find((item) => item.paymentId === payment.paymentId)?.status, "paid");
  assert.equal(store.customerInvoices.find((item) => item.invoiceId === created.invoice.invoiceId)?.status, "paid");
  assert.equal(store.customerSubscriptions.find((item) => item.subscriptionId === created.subscription.subscriptionId)?.status, "active");

  const changed = await billingService.changePlan({ organizationId, customerId, actorId, planId: pro.planId, billingCycle: "MONTHLY" });
  assert.equal(changed.invoice.gstRatePercent, 18);
  assert.ok(changed.proratedAmount >= 0);

  const failedPayment = billingService.paymentHistory(organizationId, customerId).payments[0];
  const failedPayload = { id: "evt_failed_1", event: "payment.failed", payload: { payment: { entity: { id: "pay_failed_1", order_id: failedPayment.providerOrderId, error_description: "Card declined" } } } };
  assert.equal(billingService.handleRazorpayWebhook({ signature: "local", payload: failedPayload }).status, "processed");
  const pastDue = store.customerSubscriptions.find((item) => item.subscriptionId === created.subscription.subscriptionId);
  assert.equal(pastDue?.status, "past_due");
  assert.ok(pastDue?.gracePeriodEndsAt);
  assert.equal(billingService.retryFailedPayments({ organizationId, customerId, actorId }).length >= 1, true);

  pastDue!.renewalDate = new Date(Date.now() - 1000).toISOString();
  pastDue!.status = "active";
  const renewed = await billingService.autoRenew({ organizationId, customerId, actorId, now: new Date() });
  assert.equal(renewed.status, "renewed");
  assert.ok(renewed.invoice?.invoiceId);

  const cancelled = billingService.cancel({ organizationId, customerId, actorId });
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.cancelAtPeriodEnd, true);
  assert.ok(billingService.credits(organizationId, customerId).wallet.balance >= 0);
  assert.ok(store.customerPaymentAttempts.length >= 2);

  console.log("Checkout subscription test passed through Razorpay-style checkout, GST invoices, payment history, invoice download, webhook idempotency, failed-payment grace, retries, auto-renew, plan change, cancellation, wallet, emails, and audits.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
