import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { store } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { billingService, builderBillingPlanSchema, creditTopupSchema, planChangeSchema, planFeatureFlagsPatchSchema, subscribeSchema } from "./billing.service";

export const billingRouter = Router();
export const builderBillingRouter = Router();
export const agentBillingAdminRouter = Router();
export const billingWebhookRouter = Router();

builderBillingRouter.use(authMiddleware);
builderBillingRouter.get("/plans", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.plans(organizationId) });
});
builderBillingRouter.post("/subscribe", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = subscribeSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) return response.status(400).json({ error: "Invalid subscription request", issues: parsed.success ? [] : parsed.error.issues });
  try {
    response.status(201).json({ data: await billingService.subscribe({ organizationId, customerId: actorId, actorId, ...parsed.data }) });
  } catch (error) {
    response.status(400).json({ error: "Subscription failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
builderBillingRouter.post("/cancel", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  try {
    response.json({ data: billingService.cancel({ organizationId, customerId: actorId, actorId }) });
  } catch (error) {
    response.status(400).json({ error: "Cancellation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
builderBillingRouter.post("/change-plan", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = planChangeSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) return response.status(400).json({ error: "Invalid plan change", issues: parsed.success ? [] : parsed.error.issues });
  try {
    response.status(201).json({ data: await billingService.changePlan({ organizationId, customerId: actorId, actorId, ...parsed.data }) });
  } catch (error) {
    response.status(400).json({ error: "Plan change failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
builderBillingRouter.get("/invoices", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.invoices(organizationId, actorId) });
});
builderBillingRouter.get("/invoices/:invoiceId/download", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  const download = billingService.invoiceDownload(organizationId, actorId, String(request.params.invoiceId));
  if (!download) return response.status(404).json({ error: "Invoice not found" });
  response.setHeader("content-type", download.mimeType);
  response.setHeader("content-disposition", `attachment; filename="${download.fileName}"`);
  response.send(download.content);
});
builderBillingRouter.get("/payments", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.paymentHistory(organizationId, actorId) });
});
builderBillingRouter.get("/usage", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.usage(organizationId, actorId) });
});
builderBillingRouter.get("/credits", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.credits(organizationId, actorId) });
});
builderBillingRouter.post("/credits/topup", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = creditTopupSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) return response.status(400).json({ error: "Invalid credit top-up", issues: parsed.success ? [] : parsed.error.issues });
  response.status(201).json({ data: billingService.topup({ organizationId, customerId: actorId, actorId, ...parsed.data }) });
});

agentBillingAdminRouter.use(authMiddleware, requirePermission("billing:manage"));
agentBillingAdminRouter.get("/plans", authMiddleware, requirePermission("billing:manage"), (request, response) => response.json({ data: billingService.plans(request.session?.organizationId, true) }));
agentBillingAdminRouter.post("/plans", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = builderBillingPlanSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) return response.status(400).json({ error: "Invalid billing plan", issues: parsed.success ? [] : parsed.error.issues });
  response.status(201).json({ data: billingService.createPlan(actorId, organizationId, parsed.data) });
});
agentBillingAdminRouter.patch("/plans/:planId", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  const plan = billingService.updatePlan(actorId, organizationId, String(request.params.planId), request.body || {});
  if (!plan) response.status(404).json({ error: "Billing plan not found" });
  else response.json({ data: plan });
});
agentBillingAdminRouter.get("/plans/:planId/feature-flags", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  response.json({ data: billingService.featureFlags(request.session?.organizationId, String(request.params.planId)) });
});
agentBillingAdminRouter.patch("/plans/:planId/feature-flags", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = planFeatureFlagsPatchSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) return response.status(400).json({ error: "Invalid plan feature flags", issues: parsed.success ? [] : parsed.error.issues });
  const flags = billingService.updateFeatureFlags(actorId, organizationId, String(request.params.planId), parsed.data.flags);
  if (!flags) response.status(404).json({ error: "Billing plan not found" });
  else response.json({ data: flags });
});
agentBillingAdminRouter.get("/plans/:planId/usage-policies", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  response.json({ data: billingService.usagePolicies(request.session?.organizationId, String(request.params.planId)) });
});
agentBillingAdminRouter.get("/usage", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.usage(organizationId) });
});
agentBillingAdminRouter.post("/subscriptions/:customerId/retry", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.retryFailedPayments({ organizationId, customerId: String(request.params.customerId), actorId }) });
});
agentBillingAdminRouter.post("/subscriptions/:customerId/renew", authMiddleware, requirePermission("billing:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  try {
    response.json({ data: await billingService.autoRenew({ organizationId, customerId: String(request.params.customerId), actorId, now: new Date() }) });
  } catch (error) {
    response.status(400).json({ error: "Renewal failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

billingWebhookRouter.post("/razorpay", verifyRazorpayWebhookSignature, (request, response) => {
  try {
    response.json({ data: billingService.handleRazorpayWebhook({ signature: request.header("x-razorpay-signature"), payload: request.body || {}, rawBody: request.rawBody }) });
  } catch (error) {
    response.status(400).json({ error: "Razorpay webhook rejected", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

billingRouter.get("/plans", (_request, response) => {
  response.json({ data: billingService.plans(undefined) });
});

billingRouter.post("/subscribe", authMiddleware, requirePermission("billing:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = subscribeSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) {
    response.status(400).json({ error: "Invalid subscription request", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  try {
    response.status(201).json({ data: await billingService.subscribe({ organizationId, customerId: actorId, actorId, ...parsed.data }) });
  } catch (error) {
    response.status(400).json({ error: "Subscription failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

billingRouter.post("/cancel", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  try {
    response.json({ data: billingService.cancel({ organizationId, customerId: actorId, actorId }) });
  } catch (error) {
    response.status(400).json({ error: "Cancellation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

billingRouter.get("/subscription", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: store.customerSubscriptions.find((item) => item.organizationId === organizationId && item.customerId === actorId && item.status === "active") || null });
});

billingRouter.get("/invoices", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.invoices(organizationId, actorId) });
});

billingRouter.get("/usage", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.usage(organizationId, actorId) });
});

billingRouter.get("/credits", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.credits(organizationId, actorId) });
});

billingRouter.post("/credits/topup", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = creditTopupSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) {
    response.status(400).json({ error: "Invalid credit top-up", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.status(201).json({ data: billingService.topup({ organizationId, customerId: actorId, actorId, ...parsed.data }) });
});

billingRouter.get("/builder/plans", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.plans(organizationId) });
});

billingRouter.post("/builder/subscribe", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = subscribeSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) {
    response.status(400).json({ error: "Invalid subscription request", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  try {
    response.status(201).json({ data: await billingService.subscribe({ organizationId, customerId: actorId, actorId, ...parsed.data }) });
  } catch (error) {
    response.status(400).json({ error: "Subscription failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

billingRouter.post("/builder/cancel", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  try {
    response.json({ data: billingService.cancel({ organizationId, customerId: actorId, actorId }) });
  } catch (error) {
    response.status(400).json({ error: "Cancellation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
billingRouter.post("/builder/change-plan", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = planChangeSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) {
    response.status(400).json({ error: "Invalid plan change", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  try {
    response.status(201).json({ data: await billingService.changePlan({ organizationId, customerId: actorId, actorId, ...parsed.data }) });
  } catch (error) {
    response.status(400).json({ error: "Plan change failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

billingRouter.get("/builder/invoices", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.invoices(organizationId, actorId) });
});
billingRouter.get("/builder/invoices/:invoiceId/download", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  const download = billingService.invoiceDownload(organizationId, actorId, String(request.params.invoiceId));
  if (!download) return response.status(404).json({ error: "Invoice not found" });
  response.setHeader("content-type", download.mimeType);
  response.setHeader("content-disposition", `attachment; filename="${download.fileName}"`);
  response.send(download.content);
});
billingRouter.get("/builder/payments", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.paymentHistory(organizationId, actorId) });
});

billingRouter.get("/builder/usage", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.usage(organizationId, actorId) });
});

billingRouter.get("/builder/credits", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.credits(organizationId, actorId) });
});

billingRouter.post("/builder/credits/topup", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = creditTopupSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) {
    response.status(400).json({ error: "Invalid credit top-up", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.status(201).json({ data: billingService.topup({ organizationId, customerId: actorId, actorId, ...parsed.data }) });
});

billingRouter.get("/admin/agent/plans", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  response.json({ data: billingService.plans(request.session?.organizationId, true) });
});

billingRouter.post("/admin/agent/plans", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = builderBillingPlanSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) {
    response.status(400).json({ error: "Invalid billing plan", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  response.status(201).json({ data: billingService.createPlan(actorId, organizationId, parsed.data) });
});

billingRouter.patch("/admin/agent/plans/:planId", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  const plan = billingService.updatePlan(actorId, organizationId, String(request.params.planId), request.body || {});
  if (!plan) response.status(404).json({ error: "Billing plan not found" });
  else response.json({ data: plan });
});
billingRouter.get("/admin/agent/plans/:planId/feature-flags", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  response.json({ data: billingService.featureFlags(request.session?.organizationId, String(request.params.planId)) });
});
billingRouter.patch("/admin/agent/plans/:planId/feature-flags", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = planFeatureFlagsPatchSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) {
    response.status(400).json({ error: "Invalid plan feature flags", issues: parsed.success ? [] : parsed.error.issues });
    return;
  }
  const flags = billingService.updateFeatureFlags(actorId, organizationId, String(request.params.planId), parsed.data.flags);
  if (!flags) response.status(404).json({ error: "Billing plan not found" });
  else response.json({ data: flags });
});
billingRouter.get("/admin/agent/plans/:planId/usage-policies", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  response.json({ data: billingService.usagePolicies(request.session?.organizationId, String(request.params.planId)) });
});

billingRouter.get("/admin/agent/usage", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.usage(organizationId) });
});
billingRouter.post("/admin/agent/subscriptions/:customerId/retry", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.retryFailedPayments({ organizationId, customerId: String(request.params.customerId), actorId }) });
});
billingRouter.post("/admin/agent/subscriptions/:customerId/renew", authMiddleware, requirePermission("billing:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  try {
    response.json({ data: await billingService.autoRenew({ organizationId, customerId: String(request.params.customerId), actorId, now: new Date() }) });
  } catch (error) {
    response.status(400).json({ error: "Renewal failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

billingRouter.post("/webhooks/razorpay", verifyRazorpayWebhookSignature, (request, response) => {
  try {
    response.json({ data: billingService.handleRazorpayWebhook({ signature: request.header("x-razorpay-signature"), payload: request.body || {}, rawBody: request.rawBody }) });
  } catch (error) {
    response.status(400).json({ error: "Razorpay webhook rejected", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

billingRouter.get("/summary", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.status(400).json({ error: "Billing workspace is required" });
    return;
  }

  response.json({ data: billingService.summary({ organizationId }) });
});

billingRouter.post("/trial", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const parsed = z.object({ planId: z.string().min(2) }).safeParse(request.body);
  const organizationId = request.session?.organizationId;
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid trial request" });
    return;
  }

  try {
    const trial = billingService.startTrial({ organizationId, ...parsed.data });
    auditService.record({
      actorId: request.session!.userId,
      organizationId,
      action: "BILLING_ACTION",
      entityType: "Trial",
      entityId: parsed.data.planId,
      metadata: trial
    });
    response.status(trial.status === "TRIAL_STARTED" ? 201 : 202).json({ data: trial });
  } catch (error) {
    response.status(404).json({ error: error instanceof Error ? error.message : "Trial failed" });
  }
});

billingRouter.post("/checkout", authMiddleware, requirePermission("billing:manage"), async (request, response) => {
  const parsed = z.object({ planId: z.string().min(2), billingCycle: z.enum(["MONTHLY", "YEARLY"]) }).safeParse(request.body);
  const organizationId = request.session?.organizationId;
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid checkout request" });
    return;
  }

  try {
    const checkout = await billingService.createCheckout({ organizationId, ...parsed.data });
    auditService.record({
      actorId: request.session!.userId,
      organizationId,
      action: "BILLING_ACTION",
      entityType: "Checkout",
      entityId: parsed.data.planId,
      metadata: checkout
    });
    response.status(checkout.status === "PRICE_PENDING" ? 202 : 201).json({ data: checkout });
  } catch (error) {
    response.status(404).json({ error: error instanceof Error ? error.message : "Checkout failed" });
  }
});

function verifyRazorpayWebhookSignature(request: Request, response: Response, next: NextFunction) {
  const signature = request.header("x-razorpay-signature");
  if (!signature) {
    response.status(401).json({ error: "Missing Razorpay webhook signature" });
    return;
  }
  next();
}
