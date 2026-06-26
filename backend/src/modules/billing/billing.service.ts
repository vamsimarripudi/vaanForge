import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { env } from "../../config/env";
import {
  createId,
  store,
  type StoredBillingPlan,
  type StoredBuilderBillingCycle,
  type StoredCreditTransactionType,
  type StoredCustomerSubscription,
  type StoredUsageEventType
} from "../../database/in-memory-store";
import { paymentsService } from "../../infrastructure/payments/payments.service";
import { auditService } from "../audit/audit.service";
import { plansService } from "../plans/plans.service";

export type BillingCycle = "MONTHLY" | "YEARLY";
export type PaymentStatus = "TRIAL" | "PRICE_PENDING" | "ACTIVE" | "PAST_DUE";
export type RenewalStatus = "TRIAL_ACTIVE" | "PRICE_APPROVAL_REQUIRED" | "READY_FOR_RENEWAL" | "PAST_DUE";

export const builderBillingPlanSchema = z.object({
  tier: z.enum(["free_trial", "starter", "pro", "business", "enterprise", "custom"]),
  name: z.string().min(2),
  description: z.string().min(10),
  monthlyPrice: z.number().int().min(0),
  yearlyPrice: z.number().int().min(0),
  limits: z.record(z.number().int().min(0)),
  creditsIncluded: z.number().int().min(0),
  features: z.array(z.string().min(2)).min(1),
  status: z.enum(["active", "archived"]).default("active"),
  ownerId: z.string().min(2).default("admin"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("HIGH"),
  dueDate: z.string().optional()
});

export const subscribeSchema = z.object({
  planId: z.string().min(2),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY")
});

export const creditTopupSchema = z.object({
  credits: z.number().int().min(1).max(100000),
  paymentReference: z.string().min(2).optional()
});

export const usageCheckSchema = z.object({
  metric: z.enum(["agent_run", "template_use", "build_minute", "ai_credit", "storage_mb", "deployment", "team_member", "regeneration"]),
  quantity: z.number().int().min(1),
  source: z.string().min(2),
  sourceId: z.string().optional(),
  credits: z.number().int().min(0).default(0)
});

const creditCost: Partial<Record<StoredUsageEventType, number>> = {
  agent_run: 25,
  template_use: 10,
  deployment: 50,
  regeneration: 15,
  build_minute: 1,
  ai_credit: 1
};

const defaultPlanSeeds: Array<Omit<StoredBillingPlan, "id" | "createdAt" | "updatedAt" | "activityHistory">> = [
  plan("free-trial", "free_trial", "Free Trial", "Trial access for validating one small builder workflow.", 0, 0, { agent_run: 3, template_use: 2, build_minute: 60, ai_credit: 100, storage_mb: 512, deployment: 0, team_member: 1, regeneration: 3 }, 100),
  plan("starter", "starter", "Starter", "Starter plan for individual builders and small prototype projects.", 199900, 1999000, { agent_run: 20, template_use: 10, build_minute: 600, ai_credit: 1000, storage_mb: 5120, deployment: 2, team_member: 3, regeneration: 10 }, 1000),
  plan("pro", "pro", "Pro", "Pro plan for recurring customer app generation and validation workflows.", 499900, 4999000, { agent_run: 75, template_use: 40, build_minute: 2400, ai_credit: 5000, storage_mb: 20480, deployment: 8, team_member: 10, regeneration: 40 }, 5000),
  plan("business", "business", "Business", "Business plan for teams operating multiple builder projects.", 1299900, 12999000, { agent_run: 250, template_use: 120, build_minute: 9000, ai_credit: 20000, storage_mb: 102400, deployment: 25, team_member: 35, regeneration: 120 }, 20000),
  plan("enterprise", "enterprise", "Enterprise", "Enterprise plan with expanded capacity and admin governance.", 3999900, 39999000, { agent_run: 1000, template_use: 500, build_minute: 40000, ai_credit: 100000, storage_mb: 512000, deployment: 100, team_member: 150, regeneration: 500 }, 100000),
  plan("custom", "custom", "Custom", "Custom negotiated plan for VMNexus enterprise deployments.", 0, 0, { agent_run: 0, template_use: 0, build_minute: 0, ai_credit: 0, storage_mb: 0, deployment: 0, team_member: 0, regeneration: 0 }, 0)
];

export class BillingService {
  summary(input: { organizationId: string; planId?: string }) {
    const plan = plansService.findById(input.planId || "vmetron-growth") || plansService.list()[0];
    const nextRenewalDate = new Date("2026-12-31T00:00:00.000Z").toISOString();
    const paymentStatus: PaymentStatus = plan.monthlyPrice === null ? "PRICE_PENDING" : "TRIAL";
    const renewalStatus: RenewalStatus = plan.monthlyPrice === null ? "PRICE_APPROVAL_REQUIRED" : "TRIAL_ACTIVE";

    return {
      organizationId: input.organizationId,
      activePlan: { planId: plan.planId, name: plan.name, suiteType: plan.suiteType, billingCycle: "MONTHLY" as BillingCycle, currency: plan.currency, amount: plan.monthlyPrice, paymentStatus, nextRenewalDate, renewalStatus },
      invoices: [{ invoiceId: `inv-${input.organizationId}-launch`, number: "VMN-LAUNCH-001", planId: plan.planId, issuedAt: "2026-06-19", dueAt: "2026-12-31", amount: plan.monthlyPrice, currency: plan.currency, status: plan.monthlyPrice === null ? "PRICE_PENDING" : "DRAFT" }],
      renewalReminders: [{ label: "Commercial approval", dueAt: "2026-07-15", status: plan.monthlyPrice === null ? "REQUIRED" : "COMPLETE" }, { label: "Renewal confirmation", dueAt: "2026-12-01", status: "SCHEDULED" }],
      paymentProvider: { provider: "razorpay", mode: "launch-gated", checkoutAvailable: plan.monthlyPrice !== null, reconciliation: "Webhook reconciliation is deferred until production credentials are approved." }
    };
  }

  startTrial(input: { organizationId: string; planId: string }) {
    const plan = plansService.findById(input.planId);
    if (!plan) throw new Error("Plan not found");
    if (!plan.trialAvailable) return { status: "TRIAL_UNAVAILABLE" as const, planId: plan.planId, message: "Trial is not available for this plan." };
    return { status: "TRIAL_STARTED" as const, planId: plan.planId, trialDays: 14, message: "Trial step is ready. Continue to workspace activation." };
  }

  async createCheckout(input: { organizationId: string; planId: string; billingCycle: BillingCycle }) {
    const plan = plansService.findById(input.planId);
    if (!plan) throw new Error("Plan not found");
    const amount = input.billingCycle === "MONTHLY" ? plan.monthlyPrice : plan.yearlyPrice;
    if (amount === null) return { status: "PRICE_PENDING" as const, planId: plan.planId, billingCycle: input.billingCycle, message: "Commercial price is pending approval. Checkout is not available yet." };
    const checkout = await paymentsService.createCheckout({ organizationId: input.organizationId, planId: plan.planId, amount, currency: plan.currency, billingCycle: input.billingCycle });
    return { status: "CHECKOUT_CREATED" as const, planId: plan.planId, billingCycle: input.billingCycle, checkout };
  }

  plans(organizationId?: string, includeArchived = false) {
    this.ensurePlans();
    return store.billingPlans.filter((item) => (!item.organizationId || item.organizationId === organizationId) && (includeArchived || item.status === "active"));
  }

  createPlan(actorId: string, organizationId: string, input: z.input<typeof builderBillingPlanSchema>) {
    this.ensurePlans();
    const parsed = builderBillingPlanSchema.parse(input);
    const now = new Date().toISOString();
    const billingPlan: StoredBillingPlan = {
      id: createId("bpl"),
      planId: createId(`plan_${parsed.tier}`),
      organizationId,
      ...parsed,
      currency: "INR",
      dueDate: parsed.dueDate || inDays(30),
      nextAction: "Plan is active and available for customer subscription.",
      activityHistory: [{ at: now, status: parsed.status, message: "Billing plan created." }],
      createdAt: now,
      updatedAt: now
    };
    store.billingPlans.push(billingPlan);
    this.audit(actorId, organizationId, "BillingPlan", billingPlan.planId, "PLAN_CREATED");
    return billingPlan;
  }

  updatePlan(actorId: string, organizationId: string, planId: string, patch: Partial<z.input<typeof builderBillingPlanSchema>>) {
    this.ensurePlans();
    const plan = store.billingPlans.find((item) => item.planId === planId && (!item.organizationId || item.organizationId === organizationId));
    if (!plan) return undefined;
    Object.assign(plan, patch, {
      updatedAt: new Date().toISOString(),
      nextAction: "Review active subscriptions for limit or price impact.",
      activityHistory: [...plan.activityHistory, { at: new Date().toISOString(), status: plan.status, message: "Billing plan updated." }]
    });
    this.audit(actorId, organizationId, "BillingPlan", planId, "PLAN_UPDATED", { patch });
    return plan;
  }

  async subscribe(input: { organizationId: string; customerId: string; actorId: string; planId: string; billingCycle: StoredBuilderBillingCycle }) {
    this.ensurePlans();
    const plan = store.billingPlans.find((item) => item.planId === input.planId && item.status === "active");
    if (!plan) throw new Error("Billing plan not found.");
    const now = new Date().toISOString();
    const periodEnd = input.billingCycle === "YEARLY" ? inDays(365) : inDays(30);
    const subscription: StoredCustomerSubscription = {
      id: createId("sub"),
      subscriptionId: createId("subscription"),
      organizationId: input.organizationId,
      customerId: input.customerId,
      planId: plan.planId,
      billingCycle: input.billingCycle,
      status: plan.tier === "free_trial" ? "trialing" : "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      cancelAtPeriodEnd: false,
      ownerId: input.customerId,
      priority: "HIGH",
      dueDate: periodEnd,
      nextAction: "Track usage, renewal, invoices, and credits.",
      activityHistory: [{ at: now, status: "active", message: "Customer subscribed to builder plan." }],
      createdAt: now,
      updatedAt: now
    };
    store.customerSubscriptions = store.customerSubscriptions.filter((item) => item.organizationId !== input.organizationId || item.customerId !== input.customerId || !["trialing", "active", "past_due"].includes(item.status));
    store.customerSubscriptions.push(subscription);
    this.resetUsageLimits(subscription, plan);
    this.wallet(input.organizationId, input.customerId);
    if (plan.creditsIncluded > 0) this.credit(input.organizationId, input.customerId, "grant", plan.creditsIncluded, "subscription", subscription.subscriptionId, "Plan credits granted.");
    const amount = input.billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
    const invoice = this.createInvoice(input.organizationId, input.customerId, subscription.subscriptionId, amount, `Subscription ${plan.name}`);
    const checkout = amount > 0 ? await paymentsService.createCheckout({ organizationId: input.organizationId, planId: plan.planId, amount, currency: "INR", billingCycle: input.billingCycle }) : undefined;
    if (checkout) this.createPayment(input.organizationId, input.customerId, subscription.subscriptionId, invoice.invoiceId, amount, checkout.provider as "local" | "razorpay", checkout.checkoutId, "created");
    this.audit(input.actorId, input.organizationId, "CustomerSubscription", subscription.subscriptionId, "SUBSCRIPTION_CREATED", { planId: plan.planId, invoiceId: invoice.invoiceId });
    return { subscription, invoice, checkout };
  }

  cancel(input: { organizationId: string; customerId: string; actorId: string }) {
    const subscription = this.activeSubscription(input.organizationId, input.customerId);
    if (!subscription) throw new Error("Active subscription not found.");
    subscription.cancelAtPeriodEnd = true;
    subscription.status = "cancelled";
    subscription.nextAction = "Subscription cancelled. Access remains until period end if policy allows.";
    subscription.updatedAt = new Date().toISOString();
    this.audit(input.actorId, input.organizationId, "CustomerSubscription", subscription.subscriptionId, "SUBSCRIPTION_CANCELLED");
    return subscription;
  }

  invoices(organizationId: string, customerId?: string) {
    return store.customerInvoices.filter((item) => item.organizationId === organizationId && (!customerId || item.customerId === customerId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  usage(organizationId: string, customerId?: string) {
    const customer = customerId || this.defaultCustomerId(organizationId);
    this.ensureDefaultSubscription(organizationId, customer);
    return {
      limits: store.customerUsageLimits.filter((item) => item.organizationId === organizationId && item.customerId === customer),
      events: store.customerUsageEvents.filter((item) => item.organizationId === organizationId && item.customerId === customer).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50)
    };
  }

  credits(organizationId: string, customerId: string) {
    const wallet = this.wallet(organizationId, customerId);
    return {
      wallet,
      transactions: store.customerCreditTransactions.filter((item) => item.walletId === wallet.walletId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    };
  }

  topup(input: { organizationId: string; customerId: string; actorId: string; credits: number; paymentReference?: string }) {
    const wallet = this.credit(input.organizationId, input.customerId, "topup", input.credits, "credit_topup", input.paymentReference, "Customer credit top-up.");
    const invoice = this.createInvoice(input.organizationId, input.customerId, undefined, input.credits * 100, "AI credit top-up");
    this.createPayment(input.organizationId, input.customerId, undefined, invoice.invoiceId, input.credits * 100, "local", input.paymentReference, "paid");
    this.audit(input.actorId, input.organizationId, "CustomerCreditWallet", wallet.walletId, "CREDITS_TOPPED_UP", { credits: input.credits, invoiceId: invoice.invoiceId });
    return this.credits(input.organizationId, input.customerId);
  }

  checkAndConsume(input: { organizationId: string; customerId: string; actorId: string; metric: StoredUsageEventType; quantity: number; source: string; sourceId?: string; credits?: number }) {
    this.ensureDefaultSubscription(input.organizationId, input.customerId);
    const subscription = this.activeSubscription(input.organizationId, input.customerId);
    if (!subscription) throw new Error("Active builder subscription is required.");
    const limit = store.customerUsageLimits.find((item) => item.organizationId === input.organizationId && item.customerId === input.customerId && item.metric === input.metric);
    if (!limit) throw new Error(`Usage limit for ${input.metric} is not configured.`);
    if (!limit.adminOverride && limit.usedValue + input.quantity > limit.limitValue) {
      this.usageEvent(input.organizationId, input.customerId, subscription.subscriptionId, input.metric, input.quantity, input.source, input.sourceId, "rejected", `Plan limit exceeded for ${input.metric}.`);
      throw new Error(`Plan limit exceeded for ${input.metric}. Used ${limit.usedValue}/${limit.limitValue}.`);
    }
    const cost = input.credits ?? (creditCost[input.metric] || 0) * input.quantity;
    if (cost > 0) this.credit(input.organizationId, input.customerId, "deduct", cost, input.source, input.sourceId, `${input.metric} credit deduction.`);
    limit.usedValue += input.quantity;
    limit.updatedAt = new Date().toISOString();
    this.usageEvent(input.organizationId, input.customerId, subscription.subscriptionId, input.metric, input.quantity, input.source, input.sourceId, "accepted");
    this.audit(input.actorId, input.organizationId, "CustomerUsageEvent", input.sourceId, "USAGE_CONSUMED", { metric: input.metric, quantity: input.quantity, credits: cost });
    return { allowed: true, subscription, limit, creditsDeducted: cost };
  }

  refund(input: { organizationId: string; customerId: string; actorId: string; metric: StoredUsageEventType; quantity: number; source: string; sourceId?: string; credits?: number; reason: string }) {
    const limit = store.customerUsageLimits.find((item) => item.organizationId === input.organizationId && item.customerId === input.customerId && item.metric === input.metric);
    if (limit) {
      limit.usedValue = Math.max(0, limit.usedValue - input.quantity);
      limit.updatedAt = new Date().toISOString();
    }
    const credits = input.credits ?? (creditCost[input.metric] || 0) * input.quantity;
    if (credits > 0) this.credit(input.organizationId, input.customerId, "refund", credits, input.source, input.sourceId, input.reason);
    this.usageEvent(input.organizationId, input.customerId, undefined, input.metric, input.quantity, input.source, input.sourceId, "refunded", input.reason);
    this.audit(input.actorId, input.organizationId, "CustomerCreditWallet", input.sourceId, "CREDITS_REFUNDED", { metric: input.metric, credits });
  }

  handleRazorpayWebhook(input: { signature: string | undefined; payload: Record<string, unknown>; rawBody?: string }) {
    const providerEventId = String(input.payload.id || input.payload.event || createId("rzp_event"));
    const existing = store.razorpayWebhookEvents.find((item) => item.providerEventId === providerEventId);
    if (existing) return { status: "duplicate" as const, event: existing };
    const body = input.rawBody || JSON.stringify(input.payload);
    const signatureVerified = this.verifySignature(body, input.signature);
    if (!signatureVerified) throw new Error("Invalid Razorpay webhook signature.");
    const eventType = String(input.payload.event || "unknown");
    const event = { id: createId("rwh"), webhookEventId: createId("webhook"), eventType, providerEventId, signatureVerified, processed: true, payload: input.payload, createdAt: new Date().toISOString() };
    store.razorpayWebhookEvents.push(event);
    this.applyWebhook(eventType, input.payload);
    return { status: "processed" as const, event };
  }

  private ensurePlans() {
    if (store.billingPlans.length) return;
    const now = new Date().toISOString();
    for (const seed of defaultPlanSeeds) {
      store.billingPlans.push({ id: createId("bpl"), ...seed, activityHistory: [{ at: now, status: seed.status, message: "Default builder billing plan seeded." }], createdAt: now, updatedAt: now });
    }
  }

  private ensureDefaultSubscription(organizationId: string, customerId: string) {
    this.ensurePlans();
    if (this.activeSubscription(organizationId, customerId)) return;
    const freePlan = store.billingPlans.find((item) => item.tier === "free_trial")!;
    const now = new Date().toISOString();
    const periodEnd = inDays(14);
    const subscription: StoredCustomerSubscription = { id: createId("sub"), subscriptionId: createId("subscription"), organizationId, customerId, planId: freePlan.planId, billingCycle: "MONTHLY", status: "trialing", currentPeriodStart: now, currentPeriodEnd: periodEnd, renewalDate: periodEnd, cancelAtPeriodEnd: false, ownerId: customerId, priority: "MEDIUM", dueDate: periodEnd, nextAction: "Upgrade before free trial limits are exhausted.", activityHistory: [{ at: now, status: "trialing", message: "Free trial subscription created automatically." }], createdAt: now, updatedAt: now };
    store.customerSubscriptions.push(subscription);
    this.resetUsageLimits(subscription, freePlan);
    this.credit(organizationId, customerId, "grant", freePlan.creditsIncluded, "free_trial", subscription.subscriptionId, "Free trial credits granted.");
  }

  private activeSubscription(organizationId: string, customerId: string) {
    return store.customerSubscriptions.find((item) => item.organizationId === organizationId && item.customerId === customerId && ["trialing", "active", "past_due"].includes(item.status));
  }

  private resetUsageLimits(subscription: StoredCustomerSubscription, plan: StoredBillingPlan) {
    store.customerUsageLimits = store.customerUsageLimits.filter((item) => item.organizationId !== subscription.organizationId || item.customerId !== subscription.customerId);
    for (const [metric, limitValue] of Object.entries(plan.limits)) {
      store.customerUsageLimits.push({ id: createId("cul"), limitId: createId("limit"), organizationId: subscription.organizationId, customerId: subscription.customerId, planId: plan.planId, metric: metric as StoredUsageEventType, limitValue, usedValue: 0, periodStart: subscription.currentPeriodStart, periodEnd: subscription.currentPeriodEnd, adminOverride: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
  }

  private wallet(organizationId: string, customerId: string) {
    let wallet = store.customerCreditWallets.find((item) => item.organizationId === organizationId && item.customerId === customerId);
    if (!wallet) {
      wallet = { id: createId("cwl"), walletId: createId("wallet"), organizationId, customerId, balance: 0, reserved: 0, lifetimeCredits: 0, lifetimeDebits: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      store.customerCreditWallets.push(wallet);
    }
    return wallet;
  }

  private credit(organizationId: string, customerId: string, type: StoredCreditTransactionType, amount: number, source: string, sourceId: string | undefined, reason: string) {
    const wallet = this.wallet(organizationId, customerId);
    const nextBalance = type === "deduct" ? wallet.balance - amount : wallet.balance + amount;
    if (nextBalance < 0) throw new Error("Insufficient AI credit balance.");
    wallet.balance = nextBalance;
    wallet.lifetimeCredits += ["grant", "refund", "topup", "adjustment"].includes(type) ? amount : 0;
    wallet.lifetimeDebits += type === "deduct" ? amount : 0;
    wallet.updatedAt = new Date().toISOString();
    store.customerCreditTransactions.push({ id: createId("ctx"), transactionId: createId("credit_txn"), walletId: wallet.walletId, organizationId, customerId, type, amount, balanceAfter: wallet.balance, source, sourceId, reason, createdAt: new Date().toISOString() });
    return wallet;
  }

  private usageEvent(organizationId: string, customerId: string, subscriptionId: string | undefined, metric: StoredUsageEventType, quantity: number, source: string, sourceId: string | undefined, status: "accepted" | "rejected" | "refunded", reason?: string) {
    store.customerUsageEvents.push({ id: createId("cue"), eventId: createId("usage_event"), organizationId, customerId, subscriptionId, metric, quantity, source, sourceId, status, reason, createdAt: new Date().toISOString() });
  }

  private createInvoice(organizationId: string, customerId: string, subscriptionId: string | undefined, amount: number, label: string) {
    const invoice = { id: createId("cin"), invoiceId: createId("invoice"), organizationId, customerId, subscriptionId, number: `VMN-BLD-${store.customerInvoices.length + 1}`.padStart(12, "0"), amount, currency: "INR" as const, status: amount > 0 ? "issued" as const : "paid" as const, dueDate: inDays(7), lineItems: [{ label, amount }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    store.customerInvoices.push(invoice);
    return invoice;
  }

  private createPayment(organizationId: string, customerId: string, subscriptionId: string | undefined, invoiceId: string, amount: number, provider: "local" | "razorpay", providerRef: string | undefined, status: "created" | "paid") {
    const payment = { id: createId("cpy"), paymentId: createId("payment"), organizationId, customerId, subscriptionId, invoiceId, provider, providerPaymentId: providerRef, amount, currency: "INR" as const, status, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    store.customerPayments.push(payment);
    const invoice = store.customerInvoices.find((item) => item.invoiceId === invoiceId);
    if (invoice) invoice.paymentId = payment.paymentId;
    return payment;
  }

  private verifySignature(body: string, signature: string | undefined) {
    if (env.razorpayWebhookSecret === "local" && signature === "local") return true;
    if (!signature) return false;
    const expected = createHmac("sha256", env.razorpayWebhookSecret).update(body).digest("hex");
    const actual = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
  }

  private applyWebhook(eventType: string, payload: Record<string, unknown>) {
    const paymentId = String((payload.payload as Record<string, unknown> | undefined)?.payment || payload.paymentId || "");
    if (!paymentId) return;
    const payment = store.customerPayments.find((item) => item.providerPaymentId === paymentId || item.providerOrderId === paymentId);
    if (!payment) return;
    if (eventType.includes("failed")) {
      payment.status = "failed";
      payment.failureReason = "Razorpay webhook reported payment failure.";
    } else if (eventType.includes("paid") || eventType.includes("captured")) {
      payment.status = "paid";
      const invoice = store.customerInvoices.find((item) => item.invoiceId === payment.invoiceId);
      if (invoice) {
        invoice.status = "paid";
        invoice.paidAt = new Date().toISOString();
      }
    }
    payment.updatedAt = new Date().toISOString();
  }

  private defaultCustomerId(organizationId: string) {
    return store.customerSubscriptions.find((item) => item.organizationId === organizationId)?.customerId || "customer";
  }

  private audit(actorId: string, organizationId: string, entityType: string, entityId: string | undefined, billingAction: string, metadata?: Record<string, unknown>) {
    auditService.record({ actorId, organizationId, action: "BILLING_ACTION", entityType, entityId, metadata: { billingAction, ...metadata } });
  }
}

function plan(planId: string, tier: StoredBillingPlan["tier"], name: string, description: string, monthlyPrice: number, yearlyPrice: number, limits: Record<string, number>, creditsIncluded: number) {
  return { planId, tier, name, description, monthlyPrice, yearlyPrice, currency: "INR" as const, limits, creditsIncluded, features: Object.keys(limits).map((key) => `${key.replace(/_/g, " ")} included`), status: "active" as const, ownerId: "system", priority: "HIGH" as const, dueDate: inDays(365), nextAction: "Plan is available for subscription." };
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const billingService = new BillingService();
