import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { auditService } from "../audit/audit.service";
import { plansService } from "../plans/plans.service";
import { entitlementsService } from "./entitlements.service";

export const entitlementsRouter = Router();

const checkSchema = z.object({
  planId: z.string(),
  productType: z.enum(["VIDYALUMA", "VAANMEET", "VFORMIX", "VMETRON", "SUPPORT", "CUSTOMER_PORTAL", "CLIENT_PORTAL", "BILLING", "REPORTS", "COMMUNICATION", "PROMOTIONS"]),
  featureKey: z.string(),
  usage: z.record(z.number()).default({})
});

entitlementsRouter.post("/check", authMiddleware, (request, response) => {
  const parsed = checkSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid entitlement request", issues: parsed.error.issues });
    return;
  }

  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.status(400).json({ error: "Organization context required" });
    return;
  }

  const plan = plansService.findById(parsed.data.planId);
  if (!plan) {
    response.status(404).json({ error: "Plan not found" });
    return;
  }

  const result = entitlementsService.check({
    plan,
    productType: parsed.data.productType,
    featureKey: parsed.data.featureKey,
    usage: parsed.data.usage
  });

  auditService.record({
    actorId: request.session!.userId,
    organizationId,
    action: "ENTITLEMENT_CHECK",
    entityType: "Entitlement",
    entityId: parsed.data.featureKey,
    metadata: { ...parsed.data, allowed: result.allowed, reason: result.reason }
  });

  response.json({
    data: result
  });
});
