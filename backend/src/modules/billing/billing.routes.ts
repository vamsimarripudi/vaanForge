import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { auditService } from "../audit/audit.service";
import { billingService, builderBillingPlanSchema, creditTopupSchema, subscribeSchema } from "./billing.service";

export const billingRouter = Router();
export const builderBillingRouter = Router();
export const agentBillingAdminRouter = Router();
export const billingWebhookRouter = Router();

builderBillingRouter.use(authMiddleware);
builderBillingRouter.get("/plans", (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.plans(organizationId) });
});
builderBillingRouter.post("/subscribe", async (request, response) => {
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
builderBillingRouter.post("/cancel", (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  try {
    response.json({ data: billingService.cancel({ organizationId, customerId: actorId, actorId }) });
  } catch (error) {
    response.status(400).json({ error: "Cancellation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
builderBillingRouter.get("/invoices", (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.invoices(organizationId, actorId) });
});
builderBillingRouter.get("/usage", (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.usage(organizationId, actorId) });
});
builderBillingRouter.get("/credits", (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.credits(organizationId, actorId) });
});
builderBillingRouter.post("/credits/topup", (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = creditTopupSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) return response.status(400).json({ error: "Invalid credit top-up", issues: parsed.success ? [] : parsed.error.issues });
  response.status(201).json({ data: billingService.topup({ organizationId, customerId: actorId, actorId, ...parsed.data }) });
});

agentBillingAdminRouter.use(authMiddleware, requirePermission("billing:manage"));
agentBillingAdminRouter.get("/plans", (request, response) => response.json({ data: billingService.plans(request.session?.organizationId, true) }));
agentBillingAdminRouter.post("/plans", (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  const parsed = builderBillingPlanSchema.safeParse(request.body || {});
  if (!organizationId || !actorId || !parsed.success) return response.status(400).json({ error: "Invalid billing plan", issues: parsed.success ? [] : parsed.error.issues });
  response.status(201).json({ data: billingService.createPlan(actorId, organizationId, parsed.data) });
});
agentBillingAdminRouter.patch("/plans/:planId", (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  const plan = billingService.updatePlan(actorId, organizationId, String(request.params.planId), request.body || {});
  if (!plan) response.status(404).json({ error: "Billing plan not found" });
  else response.json({ data: plan });
});
agentBillingAdminRouter.get("/usage", (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.usage(organizationId) });
});

billingWebhookRouter.post("/razorpay", (request, response) => {
  try {
    response.json({ data: billingService.handleRazorpayWebhook({ signature: request.header("x-razorpay-signature"), payload: request.body || {} }) });
  } catch (error) {
    response.status(400).json({ error: "Razorpay webhook rejected", message: error instanceof Error ? error.message : "Unknown error" });
  }
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

billingRouter.get("/builder/invoices", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  const actorId = request.session?.userId;
  if (!organizationId || !actorId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.invoices(organizationId, actorId) });
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

billingRouter.get("/admin/agent/usage", authMiddleware, requirePermission("billing:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) return response.status(400).json({ error: "Billing workspace is required" });
  response.json({ data: billingService.usage(organizationId) });
});

billingRouter.post("/webhooks/razorpay", (request, response) => {
  try {
    response.json({ data: billingService.handleRazorpayWebhook({ signature: request.header("x-razorpay-signature"), payload: request.body || {} }) });
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
