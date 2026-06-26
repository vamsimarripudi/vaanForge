import { apiClient } from "@/services/apiClient";

export type BillingPlan = {
  planId: string;
  tier: "free_trial" | "starter" | "pro" | "business" | "enterprise" | "custom";
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: "INR";
  limits: Record<string, number>;
  creditsIncluded: number;
  features: string[];
  status: "active" | "archived";
  nextAction: string;
};

export type BillingUsage = {
  limits: Array<{ metric: string; limitValue: number; usedValue: number; adminOverride: boolean; periodEnd: string }>;
  events: Array<{ eventId: string; metric: string; quantity: number; source: string; status: string; reason?: string; createdAt: string }>;
};

export type BillingCredits = {
  wallet: { walletId: string; balance: number; reserved: number; lifetimeCredits: number; lifetimeDebits: number };
  transactions: Array<{ transactionId: string; type: string; amount: number; balanceAfter: number; reason: string; createdAt: string }>;
};

export type BillingInvoice = {
  invoiceId: string;
  number: string;
  amount: number;
  currency: "INR";
  status: string;
  dueDate: string;
};

async function csrf() {
  return apiClient<{ csrfToken: string }>("/security/csrf");
}

async function post<T>(path: string, body: Record<string, unknown>) {
  const token = await csrf();
  return apiClient<T>(path, { method: "POST", headers: { "x-csrf-token": token.csrfToken }, body: JSON.stringify(body) });
}

async function patch<T>(path: string, body: Record<string, unknown>) {
  const token = await csrf();
  return apiClient<T>(path, { method: "PATCH", headers: { "x-csrf-token": token.csrfToken }, body: JSON.stringify(body) });
}

export const builderBillingApi = {
  plans: () => apiClient<BillingPlan[]>("/builder/billing/plans"),
  subscribe: (planId: string, billingCycle: "MONTHLY" | "YEARLY") => post<unknown>("/builder/billing/subscribe", { planId, billingCycle }),
  cancel: () => post<unknown>("/builder/billing/cancel", {}),
  invoices: () => apiClient<BillingInvoice[]>("/builder/billing/invoices"),
  usage: () => apiClient<BillingUsage>("/builder/billing/usage"),
  credits: () => apiClient<BillingCredits>("/builder/billing/credits"),
  topup: (credits: number) => post<BillingCredits>("/builder/billing/credits/topup", { credits }),
  adminPlans: () => apiClient<BillingPlan[]>("/admin/agent/billing/plans"),
  createPlan: (payload: Partial<BillingPlan>) => post<BillingPlan>("/admin/agent/billing/plans", payload),
  updatePlan: (planId: string, payload: Partial<BillingPlan>) => patch<BillingPlan>(`/admin/agent/billing/plans/${planId}`, payload),
  adminUsage: () => apiClient<BillingUsage>("/admin/agent/billing/usage")
};
