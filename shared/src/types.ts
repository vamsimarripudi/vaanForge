export type SuiteType = "EDUCATION_SUITE" | "VMETRON_SUITE";

export type ProductType =
  | "VIDYALUMA"
  | "VAANMEET"
  | "VFORMIX"
  | "VMETRON"
  | "SUPPORT"
  | "CUSTOMER_PORTAL"
  | "CLIENT_PORTAL"
  | "BILLING"
  | "REPORTS"
  | "COMMUNICATION"
  | "PROMOTIONS";

export type BillingStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";

export interface PlanLimit {
  key: string;
  label: string;
  value: number | "unlimited";
}

export interface SuitePlan {
  planId: string;
  suiteType: SuiteType;
  name: "Starter" | "Growth" | "Enterprise";
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  currency: "INR";
  includedProducts: ProductType[];
  limits: PlanLimit[];
  features: string[];
  supportLevel: string;
  trialAvailable: boolean;
  recommended: boolean;
  gstApplicable: boolean;
}

export interface ProductEntitlement {
  productType: ProductType;
  enabled: boolean;
  limits: Record<string, number | "unlimited">;
  usage: Record<string, number>;
}
