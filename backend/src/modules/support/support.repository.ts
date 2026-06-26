import type { SupportTicketInput, TicketPriority, TicketStatus } from "@vmnexus/shared/operations";
import { env } from "../../config/env";
import { createId, store, type StoredSupportTicket, type StoredTicketMessage } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export type TicketMessageInput = {
  ticketId: string;
  authorId?: string;
  message: string;
  internal?: boolean;
};

export interface SupportRepository {
  createTicket(input: SupportTicketInput): Promise<StoredSupportTicket> | StoredSupportTicket;
  addMessage(input: TicketMessageInput): Promise<StoredTicketMessage> | StoredTicketMessage;
  updateStatus(ticketId: string, status: TicketStatus): Promise<StoredSupportTicket | null> | StoredSupportTicket | null;
  listTickets(organizationId: string): Promise<StoredSupportTicket[]> | StoredSupportTicket[];
  listMessages(ticketId: string): Promise<StoredTicketMessage[]> | StoredTicketMessage[];
  health(): RepositoryHealth;
}

export class MemorySupportRepository implements SupportRepository {
  createTicket(input: SupportTicketInput) {
    const ticket = { id: createId("tkt"), ...input, createdAt: new Date().toISOString() };
    store.supportTickets.push(ticket);
    return ticket;
  }

  addMessage(input: TicketMessageInput) {
    const message = {
      id: createId("msg"),
      ticketId: input.ticketId,
      authorId: input.authorId,
      message: input.message,
      internal: Boolean(input.internal),
      createdAt: new Date().toISOString()
    };
    store.ticketMessages.push(message);
    return message;
  }

  updateStatus(ticketId: string, status: TicketStatus) {
    const ticket = store.supportTickets.find((item) => item.id === ticketId);
    if (!ticket) {
      return null;
    }
    ticket.status = status;
    return ticket;
  }

  listTickets(organizationId: string) {
    return store.supportTickets.filter((item) => item.organizationId === organizationId);
  }

  listMessages(ticketId: string) {
    return store.ticketMessages.filter((item) => item.ticketId === ticketId);
  }

  health(): RepositoryHealth {
    return {
      name: "support",
      mode: "memory",
      writable: true,
      durable: false
    };
  }
}

export class PrismaSupportRepository implements SupportRepository {
  async createTicket(input: SupportTicketInput) {
    const ticket = await prisma().supportTicket.create({
      data: {
        organizationId: input.organizationId,
        customerId: input.customerId,
        subject: input.subject,
        priority: input.priority,
        status: input.status
      }
    });
    return this.toTicket(ticket);
  }

  async addMessage(input: TicketMessageInput) {
    const message = await prisma().ticketMessage.create({
      data: {
        ticketId: input.ticketId,
        authorId: input.authorId,
        message: input.message,
        internal: Boolean(input.internal)
      }
    });
    return this.toMessage(message);
  }

  async updateStatus(ticketId: string, status: TicketStatus) {
    try {
      const ticket = await prisma().supportTicket.update({
        where: { id: ticketId },
        data: { status }
      });
      return this.toTicket(ticket);
    } catch {
      return null;
    }
  }

  async listTickets(organizationId: string) {
    const tickets = await prisma().supportTicket.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return tickets.map((ticket: PrismaSupportTicket) => this.toTicket(ticket));
  }

  async listMessages(ticketId: string) {
    const messages = await prisma().ticketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" }
    });
    return messages.map((message: PrismaTicketMessage) => this.toMessage(message));
  }

  health(): RepositoryHealth {
    return {
      name: "support",
      mode: "postgres",
      writable: true,
      durable: true
    };
  }

  private toTicket(ticket: PrismaSupportTicket): StoredSupportTicket {
    return {
      id: ticket.id,
      organizationId: ticket.organizationId,
      customerId: ticket.customerId ?? undefined,
      subject: ticket.subject,
      priority: this.priority(ticket.priority),
      status: this.status(ticket.status),
      createdAt: ticket.createdAt.toISOString()
    };
  }

  private toMessage(message: PrismaTicketMessage): StoredTicketMessage {
    return {
      id: message.id,
      ticketId: message.ticketId,
      authorId: message.authorId ?? undefined,
      message: message.message,
      internal: message.internal,
      createdAt: message.createdAt.toISOString()
    };
  }

  private priority(value: string): TicketPriority {
    return value === "LOW" || value === "MEDIUM" || value === "HIGH" || value === "URGENT" ? value : "MEDIUM";
  }

  private status(value: string): TicketStatus {
    return value === "OPEN" || value === "IN_PROGRESS" || value === "WAITING_ON_CUSTOMER" || value === "RESOLVED" || value === "CLOSED"
      ? value
      : "OPEN";
  }
}

type PrismaSupportTicket = {
  id: string;
  organizationId: string;
  customerId: string | null;
  subject: string;
  priority: string;
  status: string;
  createdAt: Date;
};

type PrismaTicketMessage = {
  id: string;
  ticketId: string;
  authorId: string | null;
  message: string;
  internal: boolean;
  createdAt: Date;
};

export const supportRepository: SupportRepository =
  env.persistenceMode === "postgres" ? new PrismaSupportRepository() : new MemorySupportRepository();
