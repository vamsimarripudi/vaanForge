export type AgreementType =
  | "FOUNDER_AGREEMENT"
  | "COFOUNDER_AGREEMENT"
  | "EMPLOYEE_AGREEMENT"
  | "NDA"
  | "CLIENT_AGREEMENT"
  | "VENDOR_AGREEMENT"
  | "TERMS"
  | "PRIVACY"
  | "REFUND_POLICY"
  | "DATA_POLICY";

export type DocumentStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "SIGNED" | "EXPIRED";
export type ComplianceStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
export type RegistrationType = "INCORPORATION" | "GST" | "PAN_TAN" | "DIN_DSC" | "MCA_ROC" | "TRADEMARK" | "STARTUP_INDIA" | "MSME_UDYAM";

export interface AgreementInput {
  organizationId: string;
  type: AgreementType;
  title: string;
  partyName?: string;
  status: DocumentStatus;
  expiresAt?: string;
}

export interface ComplianceItemInput {
  organizationId: string;
  title: string;
  category: string;
  dueDate: string;
  status: ComplianceStatus;
  ownerId?: string;
}

export interface GovernmentRegistrationInput {
  organizationId: string;
  type: RegistrationType;
  title: string;
  status: ComplianceStatus;
  referenceNumber?: string;
  dueDate?: string;
}

export const legalDisclaimer =
  "This document workflow is an operational helper, not legal advice. Review with a qualified legal professional before use.";
