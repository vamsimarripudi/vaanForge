import type { ComplianceItemInput, ComplianceStatus, GovernmentRegistrationInput, RegistrationType } from "@vmnexus/shared/legal";
import { env } from "../../config/env";
import { createId, store, type StoredComplianceItem, type StoredGovernmentRegistration } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export interface ComplianceRepository {
  createItem(input: ComplianceItemInput): Promise<StoredComplianceItem> | StoredComplianceItem;
  updateItemStatus(itemId: string, status: ComplianceStatus): Promise<StoredComplianceItem | null> | StoredComplianceItem | null;
  createRegistration(input: GovernmentRegistrationInput): Promise<StoredGovernmentRegistration> | StoredGovernmentRegistration;
  updateRegistrationStatus(registrationId: string, status: ComplianceStatus): Promise<StoredGovernmentRegistration | null> | StoredGovernmentRegistration | null;
  listItems(organizationId: string): Promise<StoredComplianceItem[]> | StoredComplianceItem[];
  listRegistrations(organizationId: string): Promise<StoredGovernmentRegistration[]> | StoredGovernmentRegistration[];
  health(): RepositoryHealth;
}

export class MemoryComplianceRepository implements ComplianceRepository {
  createItem(input: ComplianceItemInput) {
    const item = { id: createId("cmp"), ...input, createdAt: new Date().toISOString() };
    store.complianceItems.push(item);
    return item;
  }

  updateItemStatus(itemId: string, status: ComplianceStatus) {
    const item = store.complianceItems.find((entry) => entry.id === itemId);
    if (!item) {
      return null;
    }
    item.status = status;
    return item;
  }

  createRegistration(input: GovernmentRegistrationInput) {
    const registration = { id: createId("reg"), ...input, createdAt: new Date().toISOString() };
    store.governmentRegistrations.push(registration);
    return registration;
  }

  updateRegistrationStatus(registrationId: string, status: ComplianceStatus) {
    const registration = store.governmentRegistrations.find((entry) => entry.id === registrationId);
    if (!registration) {
      return null;
    }
    registration.status = status;
    return registration;
  }

  listItems(organizationId: string) {
    return store.complianceItems.filter((item) => item.organizationId === organizationId);
  }

  listRegistrations(organizationId: string) {
    return store.governmentRegistrations.filter((item) => item.organizationId === organizationId);
  }

  health(): RepositoryHealth {
    return { name: "compliance", mode: "memory", writable: true, durable: false };
  }
}

export class PrismaComplianceRepository implements ComplianceRepository {
  async createItem(input: ComplianceItemInput) {
    const item = await prisma().complianceItem.create({
      data: {
        organizationId: input.organizationId,
        title: input.title,
        category: input.category,
        dueDate: new Date(input.dueDate),
        status: input.status,
        ownerId: input.ownerId
      }
    });
    return this.toComplianceItem(item);
  }

  async updateItemStatus(itemId: string, status: ComplianceStatus) {
    try {
      const item = await prisma().complianceItem.update({ where: { id: itemId }, data: { status } });
      return this.toComplianceItem(item);
    } catch {
      return null;
    }
  }

  async createRegistration(input: GovernmentRegistrationInput) {
    const registration = await prisma().governmentRegistration.create({
      data: {
        organizationId: input.organizationId,
        type: input.type,
        title: input.title,
        status: input.status,
        referenceNumber: input.referenceNumber,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined
      }
    });
    return this.toRegistration(registration);
  }

  async updateRegistrationStatus(registrationId: string, status: ComplianceStatus) {
    try {
      const registration = await prisma().governmentRegistration.update({ where: { id: registrationId }, data: { status } });
      return this.toRegistration(registration);
    } catch {
      return null;
    }
  }

  async listItems(organizationId: string) {
    const items = await prisma().complianceItem.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return items.map((item: PrismaComplianceItem) => this.toComplianceItem(item));
  }

  async listRegistrations(organizationId: string) {
    const registrations = await prisma().governmentRegistration.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return registrations.map((registration: PrismaGovernmentRegistration) => this.toRegistration(registration));
  }

  health(): RepositoryHealth {
    return { name: "compliance", mode: "postgres", writable: true, durable: true };
  }

  private toComplianceItem(item: PrismaComplianceItem): StoredComplianceItem {
    return {
      id: item.id,
      organizationId: item.organizationId,
      title: item.title,
      category: item.category,
      dueDate: item.dueDate.toISOString(),
      status: this.status(item.status),
      ownerId: item.ownerId ?? undefined,
      createdAt: item.createdAt.toISOString()
    };
  }

  private toRegistration(registration: PrismaGovernmentRegistration): StoredGovernmentRegistration {
    return {
      id: registration.id,
      organizationId: registration.organizationId,
      type: this.registrationType(registration.type),
      title: registration.title,
      status: this.status(registration.status),
      referenceNumber: registration.referenceNumber ?? undefined,
      dueDate: registration.dueDate?.toISOString(),
      createdAt: registration.createdAt.toISOString()
    };
  }

  private status(value: string): ComplianceStatus {
    return value === "NOT_STARTED" || value === "IN_PROGRESS" || value === "COMPLETED" || value === "OVERDUE" ? value : "NOT_STARTED";
  }

  private registrationType(value: string): RegistrationType {
    return value === "INCORPORATION" ||
      value === "GST" ||
      value === "PAN_TAN" ||
      value === "DIN_DSC" ||
      value === "MCA_ROC" ||
      value === "TRADEMARK" ||
      value === "STARTUP_INDIA" ||
      value === "MSME_UDYAM"
      ? value
      : "INCORPORATION";
  }
}

type PrismaComplianceItem = {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  dueDate: Date;
  status: string;
  ownerId: string | null;
  createdAt: Date;
};

type PrismaGovernmentRegistration = {
  id: string;
  organizationId: string;
  type: string;
  title: string;
  status: string;
  referenceNumber: string | null;
  dueDate: Date | null;
  createdAt: Date;
};

export const complianceRepository: ComplianceRepository =
  env.persistenceMode === "postgres" ? new PrismaComplianceRepository() : new MemoryComplianceRepository();
