import type { PartnerInput, PartnerStatus } from "@vmnexus/shared/growth";
import { env } from "../../config/env";
import { createId, store, type StoredPartner } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export interface PartnersRepository {
  createPartner(input: PartnerInput): Promise<StoredPartner> | StoredPartner;
  list(organizationId: string): Promise<StoredPartner[]> | StoredPartner[];
  health(): RepositoryHealth;
}

export class MemoryPartnersRepository implements PartnersRepository {
  createPartner(input: PartnerInput) {
    const partner = { id: createId("par"), ...input, createdAt: new Date().toISOString() };
    store.partners.push(partner);
    return partner;
  }

  list(organizationId: string) {
    return store.partners.filter((item) => item.organizationId === organizationId);
  }

  health(): RepositoryHealth {
    return { name: "partners", mode: "memory", writable: true, durable: false };
  }
}

export class PrismaPartnersRepository implements PartnersRepository {
  async createPartner(input: PartnerInput) {
    const partner = await prisma().partner.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        status: input.status,
        revenueSharePercent: input.revenueSharePercent
      }
    });
    return this.toPartner(partner);
  }

  async list(organizationId: string) {
    const partners = await prisma().partner.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return partners.map((partner: PrismaPartner) => this.toPartner(partner));
  }

  health(): RepositoryHealth {
    return { name: "partners", mode: "postgres", writable: true, durable: true };
  }

  private toPartner(partner: PrismaPartner): StoredPartner {
    return {
      id: partner.id,
      organizationId: partner.organizationId,
      name: partner.name,
      status: this.partnerStatus(partner.status),
      revenueSharePercent: partner.revenueSharePercent === null ? undefined : Number(partner.revenueSharePercent),
      createdAt: partner.createdAt.toISOString()
    };
  }

  private partnerStatus(value: string): PartnerStatus {
    return value === "PROSPECT" || value === "ACTIVE" || value === "PAUSED" || value === "ENDED" ? value : "PROSPECT";
  }
}

type PrismaPartner = {
  id: string;
  organizationId: string;
  name: string;
  status: string;
  revenueSharePercent: unknown | null;
  createdAt: Date;
};

export const partnersRepository: PartnersRepository =
  env.persistenceMode === "postgres" ? new PrismaPartnersRepository() : new MemoryPartnersRepository();
