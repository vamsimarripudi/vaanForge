import type { ProductType, SuitePlan } from "@kravia/shared/types";

type UsageMap = Record<string, number>;

export interface EntitlementCheckInput {
  plan: SuitePlan;
  productType: ProductType;
  featureKey: string;
  usage: UsageMap;
}

export class EntitlementsService {
  check(input: EntitlementCheckInput) {
    const productEnabled = input.plan.includedProducts.includes(input.productType);
    const limit = input.plan.limits.find((item) => item.key === input.featureKey);
    const used = input.usage[input.featureKey] || 0;
    const withinLimit = !limit || limit.value === "unlimited" || used < limit.value;

    return {
      allowed: productEnabled && withinLimit,
      productEnabled,
      featureKey: input.featureKey,
      used,
      limit: limit?.value ?? "unconfigured",
      reason: productEnabled ? (withinLimit ? "Allowed" : "Usage limit reached") : "Product is not included in plan"
    };
  }
}

export const entitlementsService = new EntitlementsService();
