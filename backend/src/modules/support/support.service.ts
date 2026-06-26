import type { SupportTicketInput, TicketStatus } from "@vmnexus/shared/operations";
import { realtimeService } from "../../infrastructure/realtime/realtime.service";
import { supportRepository, type SupportRepository, type TicketMessageInput } from "./support.repository";

export class SupportService {
  constructor(private readonly repository: SupportRepository = supportRepository) {}

  async createTicket(input: SupportTicketInput) {
    const ticket = await this.repository.createTicket(input);
    await realtimeService.publishUpdate(`organization:${ticket.organizationId}:support`, { type: "SUPPORT_TICKET_CREATED", ticket });
    return ticket;
  }

  async addMessage(input: TicketMessageInput & { organizationId?: string }) {
    const message = await this.repository.addMessage(input);
    if (input.organizationId) {
      await realtimeService.publishUpdate(`organization:${input.organizationId}:support`, { type: "SUPPORT_MESSAGE_CREATED", message });
    }
    return message;
  }

  async updateStatus(ticketId: string, status: TicketStatus) {
    const ticket = await this.repository.updateStatus(ticketId, status);
    if (ticket) {
      await realtimeService.publishUpdate(`organization:${ticket.organizationId}:support`, { type: "SUPPORT_TICKET_STATUS_UPDATED", ticket });
    }
    return ticket;
  }

  async listTickets(organizationId: string) {
    return this.repository.listTickets(organizationId);
  }

  async listMessages(ticketId: string) {
    return this.repository.listMessages(ticketId);
  }

  async summary(organizationId: string) {
    const tickets = await this.listTickets(organizationId);
    return {
      tickets: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      urgent: tickets.filter((ticket) => ticket.priority === "URGENT").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length
    };
  }

  operations() {
    return {
      liveChat: {
        mode: "queued-ticket-bridge",
        status: "launch-gated",
        detail: "Live chat starts as a ticket-backed conversation stream until the production realtime provider is connected."
      },
      slaRules: [
        { priority: "URGENT", responseTargetMinutes: 15, resolutionTargetHours: 4 },
        { priority: "HIGH", responseTargetMinutes: 60, resolutionTargetHours: 12 },
        { priority: "MEDIUM", responseTargetMinutes: 240, resolutionTargetHours: 48 },
        { priority: "LOW", responseTargetMinutes: 480, resolutionTargetHours: 96 }
      ],
      escalationPaths: [
        { trigger: "Urgent ticket", ownerRole: "Support Lead", nextStep: "Notify operations and founder dashboard." },
        { trigger: "SLA at risk", ownerRole: "Support Manager", nextStep: "Escalate to internal note and customer update." },
        { trigger: "Billing or legal issue", ownerRole: "Admin", nextStep: "Route to billing, legal, and audit review." }
      ],
      knowledgeBase: [
        { title: "Getting started", audience: "Customers", summary: "Workspace activation, plan selection, and first support ticket steps." },
        { title: "Billing and renewals", audience: "Customers", summary: "Subscription, invoice, renewal, and price-pending guidance." },
        { title: "Escalation playbook", audience: "Support team", summary: "Priority handling, internal notes, customer updates, and owner handoff." }
      ]
    };
  }

  health() {
    return this.repository.health();
  }
}

export const supportService = new SupportService();
