import type { NextFunction, Request, Response } from "express";
import type { StoredUsageEventType } from "../../database/in-memory-store";
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
      response.status(402).json({
        error: "Usage limit blocked this action",
        reason: result.reason,
        metric: options.metric,
        nextAction: "Upgrade the plan, top up credits, reduce requested usage, or ask an admin for an override."
      });
      return;
    }

    next();
  };
}
