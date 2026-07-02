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
import { emailService } from "../../infrastructure/email/email.service";
import { auditService } from "../audit/audit.service";
import { plansService } from "../plans/plans.service";
import { planConfigurationService } from "./plan-configuration.service";

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

export const planChangeSchema = z.object({
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

export const planFeatureFlagsPatchSchema = z.object({
  flags: z.record(z.boolean())
});

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

  featureFlags(organizationId: string | undefined, planId: string) {
    this.ensurePlans();
    return store.planFeatureFlags.filter((item) => item.planId === planId && (!item.organizationId || item.organizationId === organizationId));
  }

  usagePolicies(organizationId: string | undefined, planId: string) {
    this.ensurePlans();
    return store.planUsagePolicies.filter((item) => item.planId === planId && (!item.organizationId || item.organizationId === organizationId));
  }

  updateFeatureFlags(actorId: string, organizationId: string, planId: string, flags: Record<string, boolean>) {
    this.ensurePlans();
    const plan = store.billingPlans.find((item) => item.planId === planId && (!item.organizationId || item.organizationId === organizationId));
    if (!plan) return undefined;
    const now = new Date().toISOString();
    for (const [key, enabled] of Object.entries(flags)) {
      let flag = store.planFeatureFlags.find((item) => item.planId === planId && item.key === key && (!item.organizationId || item.organizationId === organizationId));
      if (!flag) {
        flag = { id: createId("pff"), flagId: createId("plan_flag"), organizationId, planId, key, enabled, description: "Admin-created plan feature flag.", ownerId: actorId, updatedBy: actorId, createdAt: now, updatedAt: now };
        store.planFeatureFlags.push(flag);
      } else {
        flag.enabled = enabled;
        flag.updatedBy = actorId;
        flag.updatedAt = now;
      }
    }
    this.audit(actorId, organizationId, "PlanFeatureFlag", planId, "PLAN_FEATURE_FLAGS_UPDATED", { flags });
    return this.featureFlags(organizationId, planId);
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
    const idempotencyKey = this.idempotencyKey(input.organizationId, input.customerId, plan.planId, input.billingCycle, "subscribe");
    const subscription: StoredCustomerSubscription = {
      id: createId("sub"),
      subscriptionId: createId("subscription"),
      organizationId: input.organizationId,
      customerId: input.customerId,
      planId: plan.planId,
      billingCycle: input.billingCycle,
      status: plan.tier === "free_trial" ? "trialing" : "active",
      providerCheckoutId: idempotencyKey,
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
    const checkout = amount > 0 ? await paymentsService.createCheckout({ organizationId: input.organizationId, customerId: input.customerId, subscriptionId: subscription.subscriptionId, planId: plan.planId, amount, currency: "INR", billingCycle: input.billingCycle, idempotencyKey }) : undefined;
    if (checkout) {
      subscription.razorpaySubscriptionId = checkout.providerSubscriptionId;
      subscription.providerCheckoutId = checkout.checkoutId;
      this.createPayment(input.organizationId, input.customerId, subscription.subscriptionId, invoice.invoiceId, amount, checkout.provider as "local" | "razorpay", checkout.checkoutId, "created", { providerOrderId: checkout.providerOrderId, providerSubscriptionId: checkout.providerSubscriptionId, idempotencyKey });
      this.paymentAttempt(input.organizationId, input.customerId, subscription.subscriptionId, invoice.invoiceId, undefined, checkout.provider as "local" | "razorpay", amount, "pending", idempotencyKey, { providerOrderId: checkout.providerOrderId });
    }
    void this.sendBillingEmail(input.customerId, "KRAVIA subscription started", `Your ${plan.name} ${input.billingCycle.toLowerCase()} subscription is ready. Invoice ${invoice.number} has been generated.`);
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

  async changePlan(input: { organizationId: string; customerId: string; actorId: string; planId: string; billingCycle: StoredBuilderBillingCycle }) {
    const current = this.activeSubscription(input.organizationId, input.customerId);
    if (!current) throw new Error("Active subscription not found.");
    const nextPlan = store.billingPlans.find((item) => item.planId === input.planId && item.status === "active");
    if (!nextPlan) throw new Error("Target billing plan not found.");
    const currentPlan = store.billingPlans.find((item) => item.planId === current.planId);
    const now = new Date();
    const periodEnd = new Date(current.currentPeriodEnd);
    const remainingRatio = Math.max(0, periodEnd.getTime() - now.getTime()) / Math.max(1, periodEnd.getTime() - new Date(current.currentPeriodStart).getTime());
    const currentAmount = currentPlan ? (current.billingCycle === "YEARLY" ? currentPlan.yearlyPrice : currentPlan.monthlyPrice) : 0;
    const nextAmount = input.billingCycle === "YEARLY" ? nextPlan.yearlyPrice : nextPlan.monthlyPrice;
    const proratedAmount = Math.max(0, Math.round(nextAmount - currentAmount * remainingRatio));
    current.pendingPlanId = input.planId;
    current.pendingBillingCycle = input.billingCycle;
    current.nextAction = proratedAmount > 0 ? "Collect prorated invoice before applying plan change." : "Plan change can be applied immediately.";
    current.updatedAt = new Date().toISOString();
    const invoice = this.createInvoice(input.organizationId, input.customerId, current.subscriptionId, proratedAmount, `Prorated plan change to ${nextPlan.name}`);
    if (proratedAmount === 0) {
      current.planId = nextPlan.planId;
      current.billingCycle = input.billingCycle;
      current.pendingPlanId = undefined;
      current.pendingBillingCycle = undefined;
      this.resetUsageLimits(current, nextPlan);
    }
    this.audit(input.actorId, input.organizationId, "CustomerSubscription", current.subscriptionId, "SUBSCRIPTION_PLAN_CHANGE_REQUESTED", { fromPlanId: currentPlan?.planId, toPlanId: nextPlan.planId, proratedAmount, invoiceId: invoice.invoiceId });
    return { subscription: current, invoice, proratedAmount };
  }

  invoices(organizationId: string, customerId?: string) {
    return store.customerInvoices.filter((item) => item.organizationId === organizationId && (!customerId || item.customerId === customerId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  invoiceDownload(organizationId: string, customerId: string, invoiceId: string) {
    const invoice = store.customerInvoices.find((item) => item.organizationId === organizationId && item.customerId === customerId && item.invoiceId === invoiceId);
    if (!invoice) return undefined;
    return {
      invoiceId: invoice.invoiceId,
      fileName: `${invoice.number}.txt`,
      mimeType: "text/plain",
      content: invoice.pdfContent || this.invoiceContent(invoice)
    };
  }

  paymentHistory(organizationId: string, customerId?: string) {
    return {
      payments: store.customerPayments.filter((item) => item.organizationId === organizationId && (!customerId || item.customerId === customerId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      attempts: store.customerPaymentAttempts.filter((item) => item.organizationId === organizationId && (!customerId || item.customerId === customerId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    };
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

  async autoRenew(input: { organizationId: string; customerId: string; actorId: string; now?: Date }) {
    const subscription = this.activeSubscription(input.organizationId, input.customerId);
    if (!subscription) throw new Error("Active subscription not found.");
    if (subscription.cancelAtPeriodEnd) return { status: "cancelled_at_period_end" as const, subscription };
    const now = input.now || new Date();
    if (new Date(subscription.renewalDate).getTime() > now.getTime()) return { status: "not_due" as const, subscription };
    const plan = store.billingPlans.find((item) => item.planId === subscription.planId);
    if (!plan) throw new Error("Billing plan not found.");
    const amount = subscription.billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
    const invoice = this.createInvoice(input.organizationId, input.customerId, subscription.subscriptionId, amount, `Auto-renewal ${plan.name}`);
    subscription.currentPeriodStart = now.toISOString();
    subscription.currentPeriodEnd = subscription.billingCycle === "YEARLY" ? inDaysFrom(now, 365) : inDaysFrom(now, 30);
    subscription.renewalDate = subscription.currentPeriodEnd;
    subscription.status = "active";
    subscription.updatedAt = new Date().toISOString();
    this.resetUsageLimits(subscription, plan);
    this.audit(input.actorId, input.organizationId, "CustomerSubscription", subscription.subscriptionId, "SUBSCRIPTION_AUTO_RENEWED", { invoiceId: invoice.invoiceId });
    return { status: "renewed" as const, subscription, invoice };
  }

  retryFailedPayments(input: { organizationId: string; customerId: string; actorId: string }) {
    const attempts = store.customerPaymentAttempts.filter((item) => item.organizationId === input.organizationId && item.customerId === input.customerId && item.status === "retry_scheduled");
    for (const attempt of attempts) {
      attempt.retryCount += 1;
      attempt.status = attempt.retryCount >= 3 ? "failed" : "retry_scheduled";
      attempt.nextRetryAt = attempt.status === "retry_scheduled" ? inDays(1) : undefined;
      attempt.updatedAt = new Date().toISOString();
    }
    this.audit(input.actorId, input.organizationId, "CustomerPaymentAttempt", input.customerId, "PAYMENT_RETRY_PROCESSED", { attempts: attempts.length });
    return attempts;
  }

  topup(input: { organizationId: string; customerId: string; actorId: string; credits: number; paymentReference?: string }) {
    const wallet = this.credit(input.organizationId, input.customerId, "topup", input.credits, "credit_topup", input.paymentReference, "Customer credit top-up.");
    const invoice = this.createInvoice(input.organizationId, input.customerId, undefined, input.credits * 100, "AI credit top-up");
    this.createPayment(input.organizationId, input.customerId, undefined, invoice.invoiceId, input.credits * 100, "local", input.paymentReference, "paid");
    this.audit(input.actorId, input.organizationId, "CustomerCreditWallet", wallet.walletId, "CREDITS_TOPPED_UP", { credits: input.credits, invoiceId: invoice.invoiceId });
    return this.credits(input.organizationId, input.customerId);
  }

  canConsume(input: { organizationId: string; customerId: string; metric: StoredUsageEventType; quantity: number; credits?: number }) {
    this.ensureDefaultSubscription(input.organizationId, input.customerId);
    const subscription = this.activeSubscription(input.organizationId, input.customerId);
    if (!subscription) return { allowed: false, reason: "Active builder subscription is required." };
    const limit = store.customerUsageLimits.find((item) => item.organizationId === input.organizationId && item.customerId === input.customerId && item.metric === input.metric);
    if (!limit) return { allowed: false, reason: `Usage limit for ${input.metric} is not configured.` };
    if (!limit.adminOverride && limit.usedValue + input.quantity > limit.limitValue) return { allowed: false, reason: `Plan limit exceeded for ${input.metric}. Used ${limit.usedValue}/${limit.limitValue}.`, subscription, limit };
    const credits = input.credits ?? this.creditCost(subscription.planId, input.metric) * input.quantity;
    const wallet = this.wallet(input.organizationId, input.customerId);
    if (credits > wallet.balance) return { allowed: false, reason: "Insufficient AI credit balance.", subscription, limit, creditsRequired: credits, creditBalance: wallet.balance };
    return { allowed: true, subscription, limit, creditsRequired: credits, creditBalance: wallet.balance };
  }

  checkAndConsume(input: { organizationId: string; customerId: string; actorId: string; metric: StoredUsageEventType; quantity: number; source: string; sourceId?: string; credits?: number; workspaceId?: string; idempotencyKey?: string; metadata?: Record<string, unknown> }) {
    this.ensureDefaultSubscription(input.organizationId, input.customerId);
    const subscription = this.activeSubscription(input.organizationId, input.customerId);
    if (!subscription) throw new Error("Active builder subscription is required.");
    const duplicate = input.idempotencyKey ? store.customerUsageEvents.find((event) => event.organizationId === input.organizationId && event.idempotencyKey === input.idempotencyKey) : undefined;
    if (duplicate?.status === "accepted") return { allowed: true, subscription, limit: store.customerUsageLimits.find((item) => item.organizationId === input.organizationId && item.customerId === input.customerId && item.metric === input.metric), creditsDeducted: duplicate.creditsUsed || 0, duplicate: true };
    const limit = store.customerUsageLimits.find((item) => item.organizationId === input.organizationId && item.customerId === input.customerId && item.metric === input.metric);
    if (!limit) throw new Error(`Usage limit for ${input.metric} is not configured.`);
    if (!limit.adminOverride && limit.usedValue + input.quantity > limit.limitValue) {
      this.usageEvent({ organizationId: input.organizationId, customerId: input.customerId, userId: input.actorId, workspaceId: input.workspaceId, subscriptionId: subscription.subscriptionId, planId: subscription.planId, metric: input.metric, quantity: input.quantity, source: input.source, sourceId: input.sourceId, status: "rejected", reason: `Plan limit exceeded for ${input.metric}.`, idempotencyKey: input.idempotencyKey, metadata: input.metadata });
      throw new Error(`Plan limit exceeded for ${input.metric}. Used ${limit.usedValue}/${limit.limitValue}.`);
    }
    const cost = input.credits ?? this.creditCost(subscription.planId, input.metric) * input.quantity;
    if (cost > 0) this.credit(input.organizationId, input.customerId, "deduct", cost, input.source, input.sourceId, `${input.metric} credit deduction.`);
    limit.usedValue += input.quantity;
    limit.updatedAt = new Date().toISOString();
    this.usageEvent({ organizationId: input.organizationId, customerId: input.customerId, userId: input.actorId, workspaceId: input.workspaceId, subscriptionId: subscription.subscriptionId, planId: subscription.planId, metric: input.metric, quantity: input.quantity, source: input.source, sourceId: input.sourceId, status: "accepted", creditsUsed: cost, idempotencyKey: input.idempotencyKey, metadata: input.metadata });
    this.audit(input.actorId, input.organizationId, "CustomerUsageEvent", input.sourceId, "USAGE_CONSUMED", { metric: input.metric, quantity: input.quantity, credits: cost });
    return { allowed: true, subscription, limit, creditsDeducted: cost };
  }

  refund(input: { organizationId: string; customerId: string; actorId: string; metric: StoredUsageEventType; quantity: number; source: string; sourceId?: string; credits?: number; reason: string; workspaceId?: string; idempotencyKey?: string; metadata?: Record<string, unknown> }) {
    const limit = store.customerUsageLimits.find((item) => item.organizationId === input.organizationId && item.customerId === input.customerId && item.metric === input.metric);
    if (limit) {
      limit.usedValue = Math.max(0, limit.usedValue - input.quantity);
      limit.updatedAt = new Date().toISOString();
    }
    const subscription = this.activeSubscription(input.organizationId, input.customerId);
    const credits = input.credits ?? this.creditCost(subscription?.planId, input.metric) * input.quantity;
    if (credits > 0) this.credit(input.organizationId, input.customerId, "refund", credits, input.source, input.sourceId, input.reason);
    this.usageEvent({ organizationId: input.organizationId, customerId: input.customerId, userId: input.actorId, workspaceId: input.workspaceId, subscriptionId: subscription?.subscriptionId, planId: subscription?.planId, metric: input.metric, quantity: input.quantity, source: input.source, sourceId: input.sourceId, status: "refunded", creditsUsed: credits, reason: input.reason, idempotencyKey: input.idempotencyKey, metadata: input.metadata });
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
    if (store.billingPlans.length) {
      this.ensurePlanControls();
      return;
    }
    const now = new Date().toISOString();
    for (const seed of planConfigurationService.billingPlanSeeds()) {
      store.billingPlans.push({ id: createId("bpl"), ...seed, activityHistory: [{ at: now, status: seed.status, message: "Default builder billing plan seeded." }], createdAt: now, updatedAt: now });
    }
    this.ensurePlanControls();
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

  private usageEvent(input: { organizationId: string; customerId: string; workspaceId?: string; userId?: string; subscriptionId?: string; planId?: string; metric: StoredUsageEventType; quantity: number; source: string; sourceId?: string; status: "accepted" | "rejected" | "refunded"; reason?: string; creditsUsed?: number; idempotencyKey?: string; metadata?: Record<string, unknown> }) {
    if (input.idempotencyKey && store.customerUsageEvents.some((event) => event.organizationId === input.organizationId && event.idempotencyKey === input.idempotencyKey)) return;
    store.customerUsageEvents.push({ id: createId("cue"), eventId: createId("usage_event"), organizationId: input.organizationId, customerId: input.customerId, workspaceId: input.workspaceId, userId: input.userId, subscriptionId: input.subscriptionId, metric: input.metric, action: input.source, quantity: input.quantity, unit: input.metric, planId: input.planId, creditsUsed: input.creditsUsed || 0, source: input.source, sourceId: input.sourceId, idempotencyKey: input.idempotencyKey, metadata: input.metadata, status: input.status, reason: input.reason, createdAt: new Date().toISOString() });
  }

  private createInvoice(organizationId: string, customerId: string, subscriptionId: string | undefined, amount: number, label: string) {
    const subtotal = Math.round(amount / 1.18);
    const gstAmount = Math.max(0, amount - subtotal);
    const invoice = { id: createId("cin"), invoiceId: createId("invoice"), organizationId, customerId, subscriptionId, number: `KRV-BLD-${String(store.customerInvoices.length + 1).padStart(6, "0")}`, gstin: env.nodeEnv === "production" ? undefined : "LOCAL-GSTIN-PENDING", amount, subtotal, gstRatePercent: 18, gstAmount, currency: "INR" as const, status: amount > 0 ? "issued" as const : "paid" as const, dueDate: inDays(7), downloadUrl: "", pdfContent: "", lineItems: [{ label, subtotal, gstRatePercent: 18, gstAmount, amount }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    invoice.downloadUrl = `/api/builder/billing/invoices/${invoice.invoiceId}/download`;
    invoice.pdfContent = this.invoiceContent(invoice);
    store.customerInvoices.push(invoice);
    return invoice;
  }

  private createPayment(organizationId: string, customerId: string, subscriptionId: string | undefined, invoiceId: string, amount: number, provider: "local" | "razorpay", providerRef: string | undefined, status: "created" | "paid", options: { providerOrderId?: string; providerSubscriptionId?: string; idempotencyKey?: string; failureReason?: string } = {}) {
    const existing = options.idempotencyKey ? store.customerPayments.find((item) => item.idempotencyKey === options.idempotencyKey) : undefined;
    if (existing) return existing;
    const payment = { id: createId("cpy"), paymentId: createId("payment"), organizationId, customerId, subscriptionId, invoiceId, provider, providerPaymentId: providerRef, providerOrderId: options.providerOrderId, providerSubscriptionId: options.providerSubscriptionId, idempotencyKey: options.idempotencyKey, amount, currency: "INR" as const, status, failureReason: options.failureReason, retryCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    store.customerPayments.push(payment);
    const invoice = store.customerInvoices.find((item) => item.invoiceId === invoiceId);
    if (invoice) invoice.paymentId = payment.paymentId;
    return payment;
  }

  private paymentAttempt(organizationId: string, customerId: string, subscriptionId: string | undefined, invoiceId: string | undefined, paymentId: string | undefined, provider: "local" | "razorpay", amount: number, status: "pending" | "succeeded" | "failed" | "retry_scheduled", idempotencyKey: string, options: { providerPaymentId?: string; providerOrderId?: string; failureReason?: string; nextRetryAt?: string } = {}) {
    const existing = store.customerPaymentAttempts.find((item) => item.idempotencyKey === idempotencyKey && item.status === status);
    if (existing) return existing;
    const attempt = { id: createId("cpa"), attemptId: createId("payment_attempt"), organizationId, customerId, subscriptionId, invoiceId, paymentId, provider, providerPaymentId: options.providerPaymentId, providerOrderId: options.providerOrderId, idempotencyKey, amount, currency: "INR" as const, status, failureReason: options.failureReason, retryCount: 0, nextRetryAt: options.nextRetryAt, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    store.customerPaymentAttempts.push(attempt);
    return attempt;
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
    const entity = this.razorpayPaymentEntity(payload);
    const paymentId = String(entity.id || payload.paymentId || "");
    const orderId = String(entity.order_id || payload.orderId || "");
    if (!paymentId && !orderId) return;
    const payment = store.customerPayments.find((item) => item.providerPaymentId === paymentId || item.providerOrderId === orderId || item.providerPaymentId === orderId);
    if (!payment) return;
    if (eventType.includes("failed")) {
      payment.status = "failed";
      payment.failureReason = String(entity.error_description || entity.error_reason || "Razorpay webhook reported payment failure.");
      payment.retryCount = (payment.retryCount || 0) + 1;
      payment.nextRetryAt = inDays(1);
      payment.gracePeriodEndsAt = inDays(7);
      this.paymentAttempt(payment.organizationId, payment.customerId, payment.subscriptionId, payment.invoiceId, payment.paymentId, payment.provider, payment.amount, "retry_scheduled", `${payment.idempotencyKey || payment.paymentId}:failed:${payment.retryCount}`, { providerPaymentId: paymentId, providerOrderId: orderId, failureReason: payment.failureReason, nextRetryAt: payment.nextRetryAt });
      const subscription = payment.subscriptionId ? store.customerSubscriptions.find((item) => item.subscriptionId === payment.subscriptionId) : undefined;
      if (subscription) {
        subscription.status = "past_due";
        subscription.gracePeriodEndsAt = payment.gracePeriodEndsAt;
        subscription.retryCount = payment.retryCount;
        subscription.lastPaymentFailureReason = payment.failureReason;
        subscription.nextAction = "Payment failed. Retry payment within grace period to avoid expiry.";
        subscription.updatedAt = new Date().toISOString();
      }
      const invoice = payment.invoiceId ? store.customerInvoices.find((item) => item.invoiceId === payment.invoiceId) : undefined;
      if (invoice) {
        invoice.status = "failed";
        invoice.updatedAt = new Date().toISOString();
      }
      this.audit("razorpay", payment.organizationId, "CustomerPayment", payment.paymentId, "PAYMENT_FAILED", { reason: payment.failureReason, nextRetryAt: payment.nextRetryAt });
    } else if (eventType.includes("paid") || eventType.includes("captured")) {
      payment.status = "paid";
      payment.providerPaymentId = paymentId || payment.providerPaymentId;
      const invoice = store.customerInvoices.find((item) => item.invoiceId === payment.invoiceId);
      if (invoice) {
        invoice.status = "paid";
        invoice.paidAt = new Date().toISOString();
        invoice.updatedAt = new Date().toISOString();
      }
      const subscription = payment.subscriptionId ? store.customerSubscriptions.find((item) => item.subscriptionId === payment.subscriptionId) : undefined;
      if (subscription) {
        const pendingPlan = subscription.pendingPlanId ? store.billingPlans.find((item) => item.planId === subscription.pendingPlanId) : undefined;
        if (pendingPlan) {
          subscription.planId = pendingPlan.planId;
          subscription.billingCycle = subscription.pendingBillingCycle || subscription.billingCycle;
          subscription.pendingPlanId = undefined;
          subscription.pendingBillingCycle = undefined;
          this.resetUsageLimits(subscription, pendingPlan);
        }
        subscription.status = "active";
        subscription.gracePeriodEndsAt = undefined;
        subscription.retryCount = 0;
        subscription.lastPaymentFailureReason = undefined;
        subscription.nextAction = "Subscription payment is current.";
        subscription.updatedAt = new Date().toISOString();
      }
      this.paymentAttempt(payment.organizationId, payment.customerId, payment.subscriptionId, payment.invoiceId, payment.paymentId, payment.provider, payment.amount, "succeeded", `${payment.idempotencyKey || payment.paymentId}:paid`, { providerPaymentId: paymentId, providerOrderId: orderId });
      this.audit("razorpay", payment.organizationId, "CustomerPayment", payment.paymentId, "PAYMENT_CAPTURED", { invoiceId: payment.invoiceId });
    }
    payment.updatedAt = new Date().toISOString();
  }

  private defaultCustomerId(organizationId: string) {
    return store.customerSubscriptions.find((item) => item.organizationId === organizationId)?.customerId || "customer";
  }

  private audit(actorId: string, organizationId: string, entityType: string, entityId: string | undefined, billingAction: string, metadata?: Record<string, unknown>) {
    auditService.record({ actorId, organizationId, action: "BILLING_ACTION", entityType, entityId, metadata: { billingAction, ...metadata } });
  }

  private ensurePlanControls() {
    const now = new Date().toISOString();
    for (const plan of store.billingPlans) {
      for (const seed of planConfigurationService.featureFlagsFor(plan.planId)) {
        if (!store.planFeatureFlags.some((flag) => flag.planId === seed.planId && flag.key === seed.key && flag.organizationId === plan.organizationId)) {
          store.planFeatureFlags.push({ id: createId("pff"), flagId: createId("plan_flag"), organizationId: plan.organizationId, ...seed, ownerId: plan.ownerId, createdAt: now, updatedAt: now });
        }
      }
      for (const seed of planConfigurationService.usagePoliciesFor(plan.planId, plan.limits)) {
        if (!store.planUsagePolicies.some((policy) => policy.planId === seed.planId && policy.metric === seed.metric && policy.organizationId === plan.organizationId)) {
          store.planUsagePolicies.push({ id: createId("pup"), policyId: createId("plan_policy"), organizationId: plan.organizationId, ...seed, ownerId: plan.ownerId, createdAt: now, updatedAt: now });
        }
      }
    }
  }

  private creditCost(planId: string | undefined, metric: StoredUsageEventType) {
    const policy = planId ? store.planUsagePolicies.find((item) => item.planId === planId && item.metric === metric && item.enabled) : undefined;
    return policy?.creditCost ?? planConfigurationService.creditCost(metric);
  }

  private idempotencyKey(organizationId: string, customerId: string, planId: string, billingCycle: StoredBuilderBillingCycle, action: string) {
    return `${organizationId}:${customerId}:${planId}:${billingCycle}:${action}`;
  }

  private invoiceContent(invoice: { number: string; invoiceId: string; amount: number; subtotal?: number; gstRatePercent?: number; gstAmount?: number; currency: "INR"; status: string; dueDate: string; lineItems: Array<Record<string, unknown>> }) {
    return [
      "KRAVIA PRIVATE LIMITED",
      `Invoice: ${invoice.number}`,
      `Invoice ID: ${invoice.invoiceId}`,
      `Status: ${invoice.status}`,
      `Due date: ${invoice.dueDate}`,
      `Subtotal: ${invoice.currency} ${invoice.subtotal || 0}`,
      `GST (${invoice.gstRatePercent || 0}%): ${invoice.currency} ${invoice.gstAmount || 0}`,
      `Total: ${invoice.currency} ${invoice.amount}`,
      `Line items: ${JSON.stringify(invoice.lineItems)}`
    ].join("\n");
  }

  private razorpayPaymentEntity(payload: Record<string, unknown>) {
    const payloadRoot = payload.payload as Record<string, unknown> | undefined;
    const payment = payloadRoot?.payment as Record<string, unknown> | undefined;
    const entity = payment?.entity as Record<string, unknown> | undefined;
    return entity || payment || payload;
  }

  private async sendBillingEmail(customerId: string, subject: string, text: string) {
    const to = customerId.includes("@") ? customerId : `billing+${customerId}@kravia.local`;
    try {
      return await emailService.send({ to, subject, text });
    } catch (error) {
      return { provider: "unavailable", delivered: false, messageId: error instanceof Error ? error.message : "unknown" };
    }
  }
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function inDaysFrom(from: Date, days: number) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const billingService = new BillingService();
