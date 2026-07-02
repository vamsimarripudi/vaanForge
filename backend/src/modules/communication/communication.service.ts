import type { CommunicationInput } from "@kravia/shared/growth";
import { notificationsService } from "../notifications/notifications.service";
import { communicationRepository, type CommunicationRepository } from "./communication.repository";

export class CommunicationService {
  constructor(private readonly repository: CommunicationRepository = communicationRepository) {}

  async create(input: CommunicationInput) {
    const communication = await this.repository.create(input);
    await notificationsService.create({
      organizationId: input.organizationId,
      title: input.title,
      message: input.message
    });
    return communication;
  }

  async list(organizationId: string) {
    return this.repository.list(organizationId);
  }

  async summary(organizationId: string) {
    const communications = await this.list(organizationId);
    return {
      messages: communications.length,
      announcements: communications.filter((item) => item.channel === "ANNOUNCEMENT").length,
      direct: communications.filter((item) => item.channel === "DIRECT").length,
      support: communications.filter((item) => item.channel === "SUPPORT").length,
      followUps: communications.filter((item) => item.channel === "CUSTOMER_FOLLOW_UP").length
    };
  }

  async operatingSystem(organizationId: string) {
    const communications = await this.list(organizationId);
    const channelCatalog = [
      { channel: "ANNOUNCEMENT", label: "Announcements", useCase: "Broadcast company, product, and customer updates." },
      { channel: "DIRECT", label: "Direct messages", useCase: "One-to-one founder, team, partner, or customer communication." },
      { channel: "TEAM", label: "Team channels", useCase: "Internal team channel coordination and workstream updates." },
      { channel: "SUPPORT", label: "Support conversations", useCase: "Customer support replies and escalation communication." },
      { channel: "CUSTOMER_FOLLOW_UP", label: "Customer follow-ups", useCase: "Renewal, sales, onboarding, and health-check follow-ups." }
    ];

    return {
      notifications: {
        provider: "notificationsService",
        status: "active",
        generatedFromCommunications: communications.length
      },
      channelCatalog: channelCatalog.map((entry) => ({
        ...entry,
        records: communications.filter((item) => item.channel === entry.channel).length
      })),
      emailTemplates: [
        { key: "welcome", subject: "Welcome to KRAVIA OS", audience: "Customers", status: "draft" },
        { key: "renewal-reminder", subject: "Renewal reminder", audience: "Customers", status: "draft" },
        { key: "support-follow-up", subject: "Support follow-up", audience: "Support", status: "draft" }
      ],
      smsTemplates: [
        { key: "otp-placeholder", message: "Your KRAVIA verification code is {{code}}.", audience: "Users", status: "provider-gated" },
        { key: "renewal-short", message: "Your KRAVIA renewal is due on {{date}}.", audience: "Customers", status: "provider-gated" },
        { key: "support-alert", message: "Support update: {{ticketStatus}}.", audience: "Customers", status: "provider-gated" }
      ],
      routingRules: [
        { trigger: "Support issue", channel: "SUPPORT", owner: "Support" },
        { trigger: "Renewal due", channel: "CUSTOMER_FOLLOW_UP", owner: "CRM" },
        { trigger: "Internal update", channel: "TEAM", owner: "Operations" }
      ]
    };
  }

  health() {
    return this.repository.health();
  }
}

export const communicationService = new CommunicationService();
