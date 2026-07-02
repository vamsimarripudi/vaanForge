import type { NextFunction, Request, Response } from "express";
import type { StoredUsageEventType } from "../../database/in-memory-store";
import { buildErrorResponse } from "../../http/error-response";
import { billingService } from "./billing.service";

type UsageLimitOptions = {
  metric: StoredUsageEventType;
  quantity?: number | ((request: Request) => number);
  customerId?: (request: Request) => string | undefined;
  credits?: number | ((request: Request) => number | undefined);
};

export function requireUsageLimit(options: UsageLimitOptions) {
  return (request: Request, response: Response, next: NextFunction) => {
    const organizationId = request.session?.organizationId;
    const customerId = options.customerId?.(request) || request.session?.userId;
    if (!organizationId || !customerId) {
      response.status(400).json({ error: "Billing workspace is required" });
      return;
    }

    const quantity = typeof options.quantity === "function" ? options.quantity(request) : options.quantity ?? 1;
    const credits = typeof options.credits === "function" ? options.credits(request) : options.credits;
    const result = billingService.canConsume({ organizationId, customerId, metric: options.metric, quantity, credits });
    if (!result.allowed) {
      // Usage limit blocked this action with a structured PLAN_LIMIT_REACHED response.
      response.status(402).json({
        ...buildErrorResponse(request, {
          code: "PLAN_LIMIT_REACHED",
          message: result.reason || "Plan limit reached.",
          recoverable: true,
          nextAction: "upgrade_plan"
        }),
        planLimit: {
          metric: options.metric,
          currentPlan: result.currentPlan ? { planId: result.currentPlan.planId, name: result.currentPlan.name } : undefined,
          requiredPlan: result.requiredPlan ? { planId: result.requiredPlan.planId, name: result.requiredPlan.name } : undefined,
          usedAmount: result.usedAmount,
          requestedAmount: result.requestedAmount ?? quantity,
          limitAmount: result.limitAmount,
          upgradeUrl: result.upgradeUrl || "/pricing"
        }
      });
      return;
    }

    next();
  };
}
