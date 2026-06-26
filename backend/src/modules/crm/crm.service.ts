import type { CustomerInput, LeadInput, LeadStage } from "@vmnexus/shared/operations";
import { crmRepository, type CrmRepository } from "./crm.repository";

export class CrmService {
  constructor(private readonly repository: CrmRepository = crmRepository) {}

  async createLead(input: LeadInput) {
    return this.repository.createLead(input);
  }

  async updateLeadStage(leadId: string, stage: LeadStage) {
    return this.repository.updateLeadStage(leadId, stage);
  }

  async createCustomer(input: CustomerInput) {
    return this.repository.createCustomer(input);
  }

  async listLeads(organizationId: string) {
    return this.repository.listLeads(organizationId);
  }

  async listCustomers(organizationId: string) {
    return this.repository.listCustomers(organizationId);
  }

  async summary(organizationId: string) {
    const leads = await this.listLeads(organizationId);
    const customers = await this.listCustomers(organizationId);
    return {
      leads: leads.length,
      customers: customers.length,
      expectedPipeline: leads.reduce((sum, lead) => sum + (lead.expectedValue || 0), 0),
      won: leads.filter((lead) => lead.stage === "WON").length,
      demoScheduled: leads.filter((lead) => lead.stage === "DEMO_SCHEDULED").length
    };
  }

  async salesOperations(organizationId: string) {
    const leads = await this.listLeads(organizationId);
    const customers = await this.listCustomers(organizationId);
    const openLeads = leads.filter((lead) => lead.stage !== "WON" && lead.stage !== "LOST");
    const proposalLeads = leads.filter((lead) => lead.stage === "PROPOSAL_SENT");
    const demoLeads = leads.filter((lead) => lead.stage === "DEMO_SCHEDULED");

    return {
      deals: leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        company: lead.company || "Direct",
        stage: lead.stage,
        value: lead.expectedValue || 0,
        probability: lead.stage === "WON" ? 100 : lead.stage === "PROPOSAL_SENT" ? 70 : lead.stage === "DEMO_SCHEDULED" ? 55 : lead.stage === "CONTACTED" ? 35 : 15
      })),
      followUps: openLeads.map((lead, index) => ({
        leadId: lead.id,
        title: `Follow up with ${lead.name}`,
        dueAt: `2026-06-${String(22 + index).padStart(2, "0")}`,
        channel: lead.email ? "email" : lead.phone ? "phone" : "direct",
        reason: lead.stage === "NEW" ? "Initial qualification" : "Move deal to next stage"
      })),
      demoScheduling: demoLeads.map((lead) => ({
        leadId: lead.id,
        title: `${lead.name} demo`,
        meetingMode: "VaanMeet placeholder",
        scheduledAt: "2026-06-24T10:00:00.000Z",
        objective: "Show product fit and confirm buying criteria."
      })),
      proposals: proposalLeads.map((lead) => ({
        leadId: lead.id,
        title: `${lead.name} proposal`,
        status: "SENT",
        value: lead.expectedValue || 0,
        nextStep: "Confirm objections, decision maker, and closure date."
      })),
      objections: [
        { label: "Price concern", response: "Anchor value to saved time, launch readiness, and bundled operating modules." },
        { label: "Implementation effort", response: "Offer phased onboarding with workspace activation, support, and migration checklist." },
        { label: "Trust risk", response: "Show audit logs, security docs, contracts, and founder dashboard transparency." }
      ],
      renewals: customers.map((customer) => ({
        customerId: customer.id,
        name: customer.name,
        activePlan: customer.activePlan || "unassigned",
        renewalDate: customer.renewalDate || "not scheduled",
        status: customer.renewalDate ? "TRACKED" : "NEEDS_DATE"
      })),
      salesPsychologyAssistant: {
        mode: "deterministic",
        prompts: [
          "Mirror the customer's exact pain before presenting a module.",
          "Ask for decision criteria after the demo, not at the end of the sales cycle.",
          "Use renewal risk as a helpful check-in, not a pressure tactic."
        ],
        nextBestAction: openLeads.length ? `Prioritize ${openLeads[0].name} and move from ${openLeads[0].stage} to the next clear stage.` : "Create a lead or review upcoming renewals."
      }
    };
  }

  async customerPortal(organizationId: string) {
    const customers = await this.listCustomers(organizationId);

    return {
      subscription: customers.map((customer) => ({
        customerId: customer.id,
        name: customer.name,
        activePlan: customer.activePlan || "unassigned",
        status: customer.activePlan ? "ACTIVE" : "NEEDS_PLAN"
      })),
      invoices: customers.map((customer) => ({
        customerId: customer.id,
        number: `INV-${customer.id.slice(-6).toUpperCase()}`,
        status: "PRICE_PENDING",
        billingRoute: "/api/v1/billing/summary"
      })),
      supportTickets: customers.map((customer) => ({
        customerId: customer.id,
        route: "/api/v1/support/tickets",
        status: "CONNECTED"
      })),
      productAccess: customers.map((customer) => ({
        customerId: customer.id,
        planId: customer.activePlan || "unassigned",
        entitlementRoute: "/api/v1/entitlements/check",
        status: customer.activePlan ? "ENABLED" : "WAITING_FOR_PLAN"
      })),
      announcements: [
        { title: "Workspace launch notice", channel: "ANNOUNCEMENT", route: "/api/v1/communication" },
        { title: "Renewal reminder", channel: "CUSTOMER_FOLLOW_UP", route: "/api/v1/communication" }
      ],
      documents: customers.map((customer) => ({
        customerId: customer.id,
        route: "/api/v1/files/uploads",
        documentTypes: ["CUSTOMER", "INVOICE", "AGREEMENT"]
      })),
      renewalStatus: customers.map((customer) => ({
        customerId: customer.id,
        renewalDate: customer.renewalDate || "not scheduled",
        status: customer.renewalDate ? "TRACKED" : "NEEDS_DATE"
      }))
    };
  }

  health() {
    return this.repository.health();
  }
}

export const crmService = new CrmService();
