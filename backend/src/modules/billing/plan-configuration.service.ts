import type { SuitePlan, SuiteType } from "@kravia/shared/types";
import type { StoredBillingPlan, StoredBuilderBillingPlanTier, StoredUsageEventType } from "../../database/in-memory-store";

type BillingPlanSeed = Omit<StoredBillingPlan, "id" | "createdAt" | "updatedAt" | "activityHistory">;

export type PlanFeatureFlagSeed = {
  planId: string;
  key: string;
  enabled: boolean;
  description: string;
};

export type PlanUsagePolicySeed = {
  planId: string;
  metric: StoredUsageEventType;
  creditCost: number;
  enabled: boolean;
};

const usageCreditCosts: Record<StoredUsageEventType, number> = {
  agent_run: 25,
  template_use: 10,
  deployment: 50,
  regeneration: 15,
  build_minute: 1,
  ai_credit: 1,
  storage_mb: 0,
  team_member: 0
};

const suitePlans: SuitePlan[] = [
  {
    planId: "education-starter",
    suiteType: "EDUCATION_SUITE",
    name: "Starter",
    monthlyPrice: null,
    yearlyPrice: null,
    currency: "INR",
    includedProducts: ["VIDYALUMA", "VAANMEET", "VFORMIX", "SUPPORT", "CUSTOMER_PORTAL", "BILLING", "REPORTS", "COMMUNICATION"],
    limits: [
      { key: "studentsLimit", label: "Students", value: 500 },
      { key: "teachersLimit", label: "Teachers", value: 40 },
      { key: "meetingsPerMonth", label: "Meetings/month", value: 50 },
      { key: "formsPerMonth", label: "Forms/month", value: 25 },
      { key: "storageLimit", label: "Storage GB", value: 20 },
      { key: "supportTicketsPerMonth", label: "Support tickets/month", value: 100 }
    ],
    features: ["Institution dashboard", "Basic meetings", "Digital forms", "Support tickets"],
    supportLevel: "Standard",
    trialAvailable: true,
    recommended: false,
    gstApplicable: true
  },
  {
    planId: "education-growth",
    suiteType: "EDUCATION_SUITE",
    name: "Growth",
    monthlyPrice: null,
    yearlyPrice: null,
    currency: "INR",
    includedProducts: ["VIDYALUMA", "VAANMEET", "VFORMIX", "SUPPORT", "CUSTOMER_PORTAL", "BILLING", "REPORTS", "COMMUNICATION"],
    limits: [
      { key: "studentsLimit", label: "Students", value: 2500 },
      { key: "teachersLimit", label: "Teachers", value: 180 },
      { key: "meetingsPerMonth", label: "Meetings/month", value: 300 },
      { key: "formsPerMonth", label: "Forms/month", value: 150 },
      { key: "storageLimit", label: "Storage GB", value: 100 },
      { key: "supportTicketsPerMonth", label: "Support tickets/month", value: 500 }
    ],
    features: ["Advanced analytics", "Parent communication", "Workflow approvals", "Priority support"],
    supportLevel: "Priority",
    trialAvailable: true,
    recommended: true,
    gstApplicable: true
  },
  {
    planId: "education-enterprise",
    suiteType: "EDUCATION_SUITE",
    name: "Enterprise",
    monthlyPrice: null,
    yearlyPrice: null,
    currency: "INR",
    includedProducts: ["VIDYALUMA", "VAANMEET", "VFORMIX", "SUPPORT", "CUSTOMER_PORTAL", "BILLING", "REPORTS", "COMMUNICATION"],
    limits: [
      { key: "studentsLimit", label: "Students", value: "unlimited" },
      { key: "teachersLimit", label: "Teachers", value: "unlimited" },
      { key: "meetingsPerMonth", label: "Meetings/month", value: "unlimited" },
      { key: "formsPerMonth", label: "Forms/month", value: "unlimited" },
      { key: "storageLimit", label: "Storage GB", value: "unlimited" },
      { key: "supportTicketsPerMonth", label: "Support tickets/month", value: "unlimited" }
    ],
    features: ["Multi-campus controls", "Custom roles", "Dedicated onboarding", "Enterprise reports"],
    supportLevel: "Dedicated",
    trialAvailable: false,
    recommended: false,
    gstApplicable: true
  },
  {
    planId: "vmetron-starter",
    suiteType: "VMETRON_SUITE",
    name: "Starter",
    monthlyPrice: null,
    yearlyPrice: null,
    currency: "INR",
    includedProducts: ["VMETRON", "VAANMEET", "VFORMIX", "SUPPORT", "CLIENT_PORTAL", "CUSTOMER_PORTAL", "BILLING", "PROMOTIONS", "REPORTS"],
    limits: [
      { key: "eventsPerMonth", label: "Events/month", value: 10 },
      { key: "registrationsPerMonth", label: "Registrations/month", value: 1000 },
      { key: "meetingsPerMonth", label: "Meetings/month", value: 25 },
      { key: "formsPerMonth", label: "Forms/month", value: 20 },
      { key: "creatorRequestsPerMonth", label: "Creator requests/month", value: 10 },
      { key: "supportTicketsPerMonth", label: "Support tickets/month", value: 100 }
    ],
    features: ["Event dashboard", "Registration forms", "Support desk", "Basic reports"],
    supportLevel: "Standard",
    trialAvailable: true,
    recommended: false,
    gstApplicable: true
  },
  {
    planId: "vmetron-growth",
    suiteType: "VMETRON_SUITE",
    name: "Growth",
    monthlyPrice: null,
    yearlyPrice: null,
    currency: "INR",
    includedProducts: ["VMETRON", "VAANMEET", "VFORMIX", "SUPPORT", "CLIENT_PORTAL", "CUSTOMER_PORTAL", "BILLING", "PROMOTIONS", "REPORTS"],
    limits: [
      { key: "eventsPerMonth", label: "Events/month", value: 60 },
      { key: "registrationsPerMonth", label: "Registrations/month", value: 12000 },
      { key: "meetingsPerMonth", label: "Meetings/month", value: 160 },
      { key: "formsPerMonth", label: "Forms/month", value: 120 },
      { key: "creatorRequestsPerMonth", label: "Creator requests/month", value: 80 },
      { key: "supportTicketsPerMonth", label: "Support tickets/month", value: 500 }
    ],
    features: ["Hybrid event tools", "Creator approvals", "Sponsor workflows", "Priority support"],
    supportLevel: "Priority",
    trialAvailable: true,
    recommended: true,
    gstApplicable: true
  },
  {
    planId: "vmetron-enterprise",
    suiteType: "VMETRON_SUITE",
    name: "Enterprise",
    monthlyPrice: null,
    yearlyPrice: null,
    currency: "INR",
    includedProducts: ["VMETRON", "VAANMEET", "VFORMIX", "SUPPORT", "CLIENT_PORTAL", "CUSTOMER_PORTAL", "BILLING", "PROMOTIONS", "REPORTS"],
    limits: [
      { key: "eventsPerMonth", label: "Events/month", value: "unlimited" },
      { key: "registrationsPerMonth", label: "Registrations/month", value: "unlimited" },
      { key: "meetingsPerMonth", label: "Meetings/month", value: "unlimited" },
      { key: "formsPerMonth", label: "Forms/month", value: "unlimited" },
      { key: "creatorRequestsPerMonth", label: "Creator requests/month", value: "unlimited" },
      { key: "supportTicketsPerMonth", label: "Support tickets/month", value: "unlimited" }
    ],
    features: ["Large event operations", "Custom approvals", "Dedicated success", "Combined reports"],
    supportLevel: "Dedicated",
    trialAvailable: false,
    recommended: false,
    gstApplicable: true
  }
];

const billingPlanSeeds: BillingPlanSeed[] = [
  plan("free-trial", "free_trial", "Free", "Free forever access for one active project and one user.", 0, 0, { agent_run: 1, template_use: 5, build_minute: 60, ai_credit: 500, storage_mb: 1024, deployment: 5, team_member: 1, regeneration: 3 }, 500, ["1 active project", "1 workspace", "1 user", "500 AI credits/month", "1 GB storage", "5 deployments/month", "5 basic templates"]),
  plan("starter", "starter", "Creator", "Creator plan for individual builders moving beyond the free project.", 99900, 999000, { agent_run: 10, template_use: 20, build_minute: 600, ai_credit: 5000, storage_mb: 10240, deployment: 10, team_member: 1, regeneration: 20 }, 5000, ["10 projects", "1 user", "5,000 AI credits/month", "10 GB storage", "Guided builder workflow"]),
  plan("pro", "pro", "Professional", "Most popular plan for serious builders and small product teams.", 299900, 2999000, { agent_run: 50, template_use: 75, build_minute: 2400, ai_credit: 25000, storage_mb: 102400, deployment: 50, team_member: 5, regeneration: 75 }, 25000, ["Most Popular", "50 projects", "5 users", "25,000 AI credits/month", "100 GB storage", "Priority validation workflows"]),
  plan("custom", "custom", "Studio", "Studio plan for agencies and teams producing multiple client builds.", 799900, 7999000, { agent_run: 250, template_use: 250, build_minute: 9000, ai_credit: 100000, storage_mb: 512000, deployment: 250, team_member: 25, regeneration: 250 }, 100000, ["250 projects", "25 users", "100,000 AI credits/month", "500 GB storage", "Advanced review workflows"]),
  plan("business", "business", "Business", "Business plan for companies operating VaanForge at scale.", 1999900, 19999000, { agent_run: 1000000, template_use: 1000000, build_minute: 40000, ai_credit: 500000, storage_mb: 2097152, deployment: 1000000, team_member: 100, regeneration: 1000000 }, 500000, ["Unlimited projects", "100 users", "500,000 AI credits/month", "2 TB storage", "Deployment governance"]),
  plan("enterprise", "enterprise", "Enterprise", "Custom enterprise licensing with security review, procurement support, and governed rollout.", 0, 0, { agent_run: 1000000, template_use: 1000000, build_minute: 1000000, ai_credit: 1000000, storage_mb: 10485760, deployment: 1000000, team_member: 1000000, regeneration: 1000000 }, 1000000, ["Custom contract", "Enterprise controls", "Security and compliance review", "Dedicated rollout support"])
];

export class PlanConfigurationService {
  billingPlanSeeds(): BillingPlanSeed[] {
    return billingPlanSeeds.map((seed) => ({ ...seed, limits: { ...seed.limits }, features: [...seed.features] }));
  }

  suitePlans(suiteType?: SuiteType): SuitePlan[] {
    const plans = suiteType ? suitePlans.filter((plan) => plan.suiteType === suiteType) : suitePlans;
    return plans.map((plan) => ({ ...plan, includedProducts: [...plan.includedProducts], limits: plan.limits.map((limit) => ({ ...limit })), features: [...plan.features] }));
  }

  findSuitePlan(planId: string): SuitePlan | undefined {
    return this.suitePlans().find((plan) => plan.planId === planId);
  }

  featureFlagsFor(planId: string): PlanFeatureFlagSeed[] {
    return [
      { planId, key: "agent.blueprint_generation", enabled: true, description: "Allow blueprint generation from builder requirements." },
      { planId, key: "agent.coding_execution", enabled: planId !== "free-trial", description: "Allow coding agent execution after blueprint approval." },
      { planId, key: "deployment.agent", enabled: ["business", "enterprise", "custom", "studio"].includes(planId), description: "Allow deployment agent workflows." },
      { planId, key: "marketplace.install", enabled: true, description: "Allow marketplace template and app installs." }
    ];
  }

  usagePoliciesFor(planId: string, limits: Record<string, number>): PlanUsagePolicySeed[] {
    return Object.keys(limits).map((metric) => ({
      planId,
      metric: metric as StoredUsageEventType,
      creditCost: usageCreditCosts[metric as StoredUsageEventType] ?? 0,
      enabled: true
    }));
  }

  creditCost(metric: StoredUsageEventType): number {
    return usageCreditCosts[metric] ?? 0;
  }
}

function plan(planId: string, tier: StoredBuilderBillingPlanTier, name: string, description: string, monthlyPrice: number, yearlyPrice: number, limits: Record<string, number>, creditsIncluded: number, features?: string[]): BillingPlanSeed {
  return {
    planId,
    tier,
    name,
    description,
    monthlyPrice,
    yearlyPrice,
    currency: "INR",
    limits,
    creditsIncluded,
    features: features || Object.keys(limits).map((key) => `${key.replace(/_/g, " ")} included`),
    status: "active",
    ownerId: "system",
    priority: "HIGH",
    dueDate: inDays(365),
    nextAction: "Plan is available for subscription."
  };
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const planConfigurationService = new PlanConfigurationService();
