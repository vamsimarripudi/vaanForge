import type { SuitePlan } from "@vmnexus/shared/types";

export const vmetronSuitePlans: SuitePlan[] = [
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
