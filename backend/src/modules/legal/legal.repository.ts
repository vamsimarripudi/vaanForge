import type { AgreementInput, AgreementType, DocumentStatus } from "@kravia/shared/legal";
import { legalDisclaimer } from "@kravia/shared/legal";
import { env } from "../../config/env";
import { createId, store, type StoredAgreement } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export interface LegalRepository {
  createAgreement(input: AgreementInput): Promise<StoredAgreement> | StoredAgreement;
  updateStatus(agreementId: string, status: DocumentStatus): Promise<StoredAgreement | null> | StoredAgreement | null;
  listAgreements(organizationId: string): Promise<StoredAgreement[]> | StoredAgreement[];
  health(): RepositoryHealth;
}

export class MemoryLegalRepository implements LegalRepository {
  createAgreement(input: AgreementInput) {
    const agreement = { id: createId("agr"), ...input, disclaimer: legalDisclaimer, createdAt: new Date().toISOString() };
    store.agreements.push(agreement);
    return agreement;
  }

  updateStatus(agreementId: string, status: DocumentStatus) {
    const agreement = store.agreements.find((item) => item.id === agreementId);
    if (!agreement) {
      return null;
    }
    agreement.status = status;
    return agreement;
  }

  listAgreements(organizationId: string) {
    return store.agreements.filter((item) => item.organizationId === organizationId);
  }

  health(): RepositoryHealth {
    return { name: "legal", mode: "memory", writable: true, durable: false };
  }
}

export class PrismaLegalRepository implements LegalRepository {
  async createAgreement(input: AgreementInput) {
    const agreement = await prisma().agreement.create({
      data: {
        organizationId: input.organizationId,
        type: input.type,
        title: input.title,
        partyName: input.partyName,
        status: input.status,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        disclaimer: legalDisclaimer
      }
    });
    return this.toAgreement(agreement);
  }

  async updateStatus(agreementId: string, status: DocumentStatus) {
    try {
      const agreement = await prisma().agreement.update({ where: { id: agreementId }, data: { status } });
      return this.toAgreement(agreement);
    } catch {
      return null;
    }
  }

  async listAgreements(organizationId: string) {
    const agreements = await prisma().agreement.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return agreements.map((agreement: PrismaAgreement) => this.toAgreement(agreement));
  }

  health(): RepositoryHealth {
    return { name: "legal", mode: "postgres", writable: true, durable: true };
  }

  private toAgreement(agreement: PrismaAgreement): StoredAgreement {
    return {
      id: agreement.id,
      organizationId: agreement.organizationId,
      type: this.agreementType(agreement.type),
      title: agreement.title,
      partyName: agreement.partyName ?? undefined,
      status: this.documentStatus(agreement.status),
      expiresAt: agreement.expiresAt?.toISOString(),
      disclaimer: agreement.disclaimer,
      createdAt: agreement.createdAt.toISOString()
    };
  }

  private agreementType(value: string): AgreementType {
    return value === "FOUNDER_AGREEMENT" ||
      value === "COFOUNDER_AGREEMENT" ||
      value === "EMPLOYEE_AGREEMENT" ||
      value === "NDA" ||
      value === "CLIENT_AGREEMENT" ||
      value === "VENDOR_AGREEMENT" ||
      value === "TERMS" ||
      value === "PRIVACY" ||
      value === "REFUND_POLICY" ||
      value === "DATA_POLICY"
      ? value
      : "NDA";
  }

  private documentStatus(value: string): DocumentStatus {
    return value === "DRAFT" || value === "IN_REVIEW" || value === "APPROVED" || value === "SIGNED" || value === "EXPIRED" ? value : "DRAFT";
  }
}

type PrismaAgreement = {
  id: string;
  organizationId: string;
  type: string;
  title: string;
  partyName: string | null;
  status: string;
  expiresAt: Date | null;
  disclaimer: string;
  createdAt: Date;
};

export const legalRepository: LegalRepository = env.persistenceMode === "postgres" ? new PrismaLegalRepository() : new MemoryLegalRepository();
