import type { AgreementInput, DocumentStatus } from "@kravia/shared/legal";
import { legalDisclaimer } from "@kravia/shared/legal";
import { legalRepository, type LegalRepository } from "./legal.repository";

export class LegalService {
  constructor(private readonly repository: LegalRepository = legalRepository) {}

  async createAgreement(input: AgreementInput) {
    return this.repository.createAgreement(input);
  }

  async updateStatus(agreementId: string, status: DocumentStatus) {
    return this.repository.updateStatus(agreementId, status);
  }

  async listAgreements(organizationId: string) {
    return this.repository.listAgreements(organizationId);
  }

  async summary(organizationId: string) {
    const agreements = await this.listAgreements(organizationId);
    return {
      agreements: agreements.length,
      drafts: agreements.filter((item) => item.status === "DRAFT").length,
      inReview: agreements.filter((item) => item.status === "IN_REVIEW").length,
      signed: agreements.filter((item) => item.status === "SIGNED").length,
      expiring: agreements.filter((item) => item.expiresAt && new Date(item.expiresAt).getTime() < Date.now() + 30 * 24 * 60 * 60 * 1000).length,
      disclaimer: legalDisclaimer
    };
  }

  async operatingSystem(organizationId: string) {
    const agreements = await this.listAgreements(organizationId);
    const agreementCatalog = [
      { type: "FOUNDER_AGREEMENT", label: "Founder agreement", purpose: "Founder roles, equity expectations, vesting, and decision rights." },
      { type: "COFOUNDER_AGREEMENT", label: "Co-founder agreement", purpose: "Co-founder responsibilities, exits, IP, and conflict handling." },
      { type: "EMPLOYEE_AGREEMENT", label: "Employee agreement", purpose: "Employment terms, confidentiality, IP assignment, and conduct." },
      { type: "NDA", label: "NDA", purpose: "Protect confidential business, product, customer, and investor information." },
      { type: "CLIENT_AGREEMENT", label: "Client agreement", purpose: "Scope, fees, delivery, liability, renewal, and support terms." },
      { type: "VENDOR_AGREEMENT", label: "Vendor agreement", purpose: "Vendor scope, payment, data handling, service levels, and termination." }
    ];
    const policyRegister = [
      { type: "TERMS", label: "Terms", route: "/terms", status: "published" },
      { type: "PRIVACY", label: "Privacy", route: "/privacy", status: "published" },
      { type: "REFUND_POLICY", label: "Refund policy", route: "/refund", status: "published" },
      { type: "DATA_POLICY", label: "Data policy", route: "/data-policy", status: "published" }
    ];

    return {
      agreementCatalog: agreementCatalog.map((item) => ({
        ...item,
        records: agreements.filter((agreement) => agreement.type === item.type).length
      })),
      policyRegister: policyRegister.map((item) => ({
        ...item,
        records: agreements.filter((agreement) => agreement.type === item.type).length
      })),
      awarenessNotes: [
        { title: "Review before signature", note: "Every founder, employee, client, and vendor document needs qualified legal review before use." },
        { title: "Track expiry dates", note: "Agreements with renewal, termination, or confidentiality periods should have expiry reminders." },
        { title: "Separate policy from contract", note: "Website policies inform users; signed agreements create specific obligations." },
        { title: "Preserve audit trail", note: "Status changes and sensitive document actions should remain audit logged." }
      ],
      disclaimer: legalDisclaimer
    };
  }

  health() {
    return this.repository.health();
  }
}

export const legalService = new LegalService();
