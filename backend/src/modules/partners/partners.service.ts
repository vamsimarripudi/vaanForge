import type { PartnerInput } from "@kravia/shared/growth";
import { partnersRepository, type PartnersRepository } from "./partners.repository";

export class PartnersService {
  constructor(private readonly repository: PartnersRepository = partnersRepository) {}

  async createPartner(input: PartnerInput) {
    return this.repository.createPartner(input);
  }

  async list(organizationId: string) {
    return this.repository.list(organizationId);
  }

  async summary(organizationId: string) {
    const partners = await this.list(organizationId);
    return {
      partners: partners.length,
      active: partners.filter((item) => item.status === "ACTIVE").length,
      prospects: partners.filter((item) => item.status === "PROSPECT").length,
      averageShare: partners.length ? Number((partners.reduce((sum, item) => sum + (item.revenueSharePercent || 0), 0) / partners.length).toFixed(2)) : 0
    };
  }

  async collaborationOs(organizationId: string) {
    const partners = await this.list(organizationId);

    return {
      partners: partners.map((partner) => ({
        id: partner.id,
        name: partner.name,
        status: partner.status,
        revenueSharePercent: partner.revenueSharePercent || 0
      })),
      collaborations: partners.map((partner) => ({
        partnerId: partner.id,
        title: `${partner.name} collaboration`,
        status: partner.status === "ACTIVE" ? "ACTIVE" : "PLANNING",
        nextStep: partner.status === "ACTIVE" ? "Review tasks, communications, and revenue share." : "Confirm collaboration scope and agreement."
      })),
      revenueShare: partners.map((partner) => ({
        partnerId: partner.id,
        partnerName: partner.name,
        percent: partner.revenueSharePercent || 0,
        status: partner.revenueSharePercent ? "CONFIGURED" : "NEEDS_APPROVAL"
      })),
      agreements: partners.map((partner) => ({
        partnerId: partner.id,
        title: `${partner.name} partner agreement`,
        route: "/api/v1/legal/agreements",
        status: partner.status === "ACTIVE" ? "READY_FOR_REVIEW" : "DRAFT_REQUIRED"
      })),
      tasks: partners.map((partner) => ({
        partnerId: partner.id,
        title: `Partner onboarding for ${partner.name}`,
        route: "/api/v1/tasks",
        priority: partner.status === "ACTIVE" ? "HIGH" : "MEDIUM"
      })),
      approvals: partners.map((partner) => ({
        partnerId: partner.id,
        title: `${partner.name} revenue-share approval`,
        status: partner.revenueSharePercent ? "APPROVED" : "PENDING",
        owner: "Founder"
      })),
      communications: partners.map((partner) => ({
        partnerId: partner.id,
        title: `${partner.name} partner update`,
        route: "/api/v1/communication",
        channel: "TEAM"
      }))
    };
  }

  health() {
    return this.repository.health();
  }
}

export const partnersService = new PartnersService();
