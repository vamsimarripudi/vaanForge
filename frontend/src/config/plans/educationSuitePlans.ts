import type { SuitePlan } from "@vmnexus/shared/types";

export const educationSuitePlans: SuitePlan[] = [
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
  }
];
