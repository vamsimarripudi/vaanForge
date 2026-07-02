import type { CommunicationInput, MessageChannel } from "@kravia/shared/growth";
import { env } from "../../config/env";
import { createId, store, type StoredCommunication } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export interface CommunicationRepository {
  create(input: CommunicationInput): Promise<StoredCommunication> | StoredCommunication;
  list(organizationId: string): Promise<StoredCommunication[]> | StoredCommunication[];
  health(): RepositoryHealth;
}

export class MemoryCommunicationRepository implements CommunicationRepository {
  create(input: CommunicationInput) {
    const communication = { id: createId("com"), ...input, createdAt: new Date().toISOString() };
    store.communications.push(communication);
    return communication;
  }

  list(organizationId: string) {
    return store.communications.filter((item) => item.organizationId === organizationId);
  }

  health(): RepositoryHealth {
    return { name: "communication", mode: "memory", writable: true, durable: false };
  }
}

export class PrismaCommunicationRepository implements CommunicationRepository {
  async create(input: CommunicationInput) {
    const communication = await prisma().communication.create({
      data: {
        organizationId: input.organizationId,
        channel: input.channel,
        title: input.title,
        message: input.message,
        audience: input.audience
      }
    });
    return this.toCommunication(communication);
  }

  async list(organizationId: string) {
    const communications = await prisma().communication.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return communications.map((communication: PrismaCommunication) => this.toCommunication(communication));
  }

  health(): RepositoryHealth {
    return { name: "communication", mode: "postgres", writable: true, durable: true };
  }

  private toCommunication(communication: PrismaCommunication): StoredCommunication {
    return {
      id: communication.id,
      organizationId: communication.organizationId,
      channel: this.channel(communication.channel),
      title: communication.title,
      message: communication.message,
      audience: communication.audience ?? undefined,
      createdAt: communication.createdAt.toISOString()
    };
  }

  private channel(value: string): MessageChannel {
    return value === "ANNOUNCEMENT" || value === "DIRECT" || value === "TEAM" || value === "SUPPORT" || value === "CUSTOMER_FOLLOW_UP"
      ? value
      : "ANNOUNCEMENT";
  }
}

type PrismaCommunication = {
  id: string;
  organizationId: string;
  channel: string;
  title: string;
  message: string;
  audience: string | null;
  createdAt: Date;
};

export const communicationRepository: CommunicationRepository =
  env.persistenceMode === "postgres" ? new PrismaCommunicationRepository() : new MemoryCommunicationRepository();
