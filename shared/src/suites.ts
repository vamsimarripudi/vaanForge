import type { ProductType, SuiteType } from "./types";

export const suiteLabels: Record<SuiteType, string> = {
  EDUCATION_SUITE: "Education Suite",
  VMETRON_SUITE: "VMetron Suite"
};

export const suiteProducts: Record<SuiteType, ProductType[]> = {
  EDUCATION_SUITE: ["VIDYALUMA", "VAANMEET", "VFORMIX", "SUPPORT", "CUSTOMER_PORTAL", "BILLING", "REPORTS", "COMMUNICATION"],
  VMETRON_SUITE: ["VMETRON", "VAANMEET", "VFORMIX", "SUPPORT", "CLIENT_PORTAL", "CUSTOMER_PORTAL", "BILLING", "PROMOTIONS", "REPORTS"]
};

export const productLabels: Record<ProductType, string> = {
  VIDYALUMA: "Vidyaluma",
  VAANMEET: "VaanMeet",
  VFORMIX: "VFormix",
  VMETRON: "VMetron",
  SUPPORT: "Support System",
  CUSTOMER_PORTAL: "Customer Portal",
  CLIENT_PORTAL: "Client Portal",
  BILLING: "Billing & Invoices",
  REPORTS: "Reports",
  COMMUNICATION: "Communication Layer",
  PROMOTIONS: "Promotions & Creator Collaboration"
};
