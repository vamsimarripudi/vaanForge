import type { CustomerInput, LeadInput, LeadStage } from "@vmnexus/shared/operations";
import { env } from "../../config/env";
import { createId, store, type StoredCustomer, type StoredLead } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export interface CrmRepository {
  createLead(input: LeadInput): Promise<StoredLead> | StoredLead;
  updateLeadStage(leadId: string, stage: LeadStage): Promise<StoredLead | null> | StoredLead | null;
  createCustomer(input: CustomerInput): Promise<StoredCustomer> | StoredCustomer;
  listLeads(organizationId: string): Promise<StoredLead[]> | StoredLead[];
  listCustomers(organizationId: string): Promise<StoredCustomer[]> | StoredCustomer[];
  health(): RepositoryHealth;
}

export class MemoryCrmRepository implements CrmRepository {
  createLead(input: LeadInput) {
    const lead = { id: createId("led"), ...input, createdAt: new Date().toISOString() };
    store.leads.push(lead);
    return lead;
  }

  updateLeadStage(leadId: string, stage: LeadStage) {
    const lead = store.leads.find((item) => item.id === leadId);
    if (!lead) {
      return null;
    }
    lead.stage = stage;
    return lead;
  }

  createCustomer(input: CustomerInput) {
    const customer = { id: createId("cus"), ...input, createdAt: new Date().toISOString() };
    store.customers.push(customer);
    return customer;
  }

  listLeads(organizationId: string) {
    return store.leads.filter((item) => item.organizationId === organizationId);
  }

  listCustomers(organizationId: string) {
    return store.customers.filter((item) => item.organizationId === organizationId);
  }

  health(): RepositoryHealth {
    return {
      name: "crm",
      mode: "memory",
      writable: true,
      durable: false
    };
  }
}

export class PrismaCrmRepository implements CrmRepository {
  async createLead(input: LeadInput) {
    const lead = await prisma().lead.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        company: input.company,
        email: input.email,
        phone: input.phone,
        source: input.source,
        stage: input.stage,
        expectedValue: input.expectedValue
      }
    });
    return this.toLead(lead);
  }

  async updateLeadStage(leadId: string, stage: LeadStage) {
    try {
      const lead = await prisma().lead.update({
        where: { id: leadId },
        data: { stage }
      });
      return this.toLead(lead);
    } catch {
      return null;
    }
  }

  async createCustomer(input: CustomerInput) {
    const customer = await prisma().customer.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        email: input.email,
        activePlan: input.activePlan,
        renewalDate: input.renewalDate ? new Date(input.renewalDate) : undefined
      }
    });
    return this.toCustomer(customer);
  }

  async listLeads(organizationId: string) {
    const leads = await prisma().lead.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return leads.map((lead: PrismaLead) => this.toLead(lead));
  }

  async listCustomers(organizationId: string) {
    const customers = await prisma().customer.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return customers.map((customer: PrismaCustomer) => this.toCustomer(customer));
  }

  health(): RepositoryHealth {
    return {
      name: "crm",
      mode: "postgres",
      writable: true,
      durable: true
    };
  }

  private toLead(lead: PrismaLead): StoredLead {
    return {
      id: lead.id,
      organizationId: lead.organizationId,
      name: lead.name,
      company: lead.company ?? undefined,
      email: lead.email ?? undefined,
      phone: lead.phone ?? undefined,
      source: lead.source ?? undefined,
      stage: this.stage(lead.stage),
      expectedValue: lead.expectedValue === null ? undefined : Number(lead.expectedValue),
      createdAt: lead.createdAt.toISOString()
    };
  }

  private toCustomer(customer: PrismaCustomer): StoredCustomer {
    return {
      id: customer.id,
      organizationId: customer.organizationId,
      name: customer.name,
      email: customer.email ?? undefined,
      activePlan: customer.activePlan ?? undefined,
      renewalDate: customer.renewalDate?.toISOString(),
      createdAt: customer.createdAt.toISOString()
    };
  }

  private stage(value: string): LeadStage {
    return value === "NEW" || value === "CONTACTED" || value === "DEMO_SCHEDULED" || value === "PROPOSAL_SENT" || value === "WON" || value === "LOST"
      ? value
      : "NEW";
  }
}

type PrismaLead = {
  id: string;
  organizationId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  stage: string;
  expectedValue: unknown | null;
  createdAt: Date;
};

type PrismaCustomer = {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  activePlan: string | null;
  renewalDate: Date | null;
  createdAt: Date;
};

export const crmRepository: CrmRepository =
  env.persistenceMode === "postgres" ? new PrismaCrmRepository() : new MemoryCrmRepository();
