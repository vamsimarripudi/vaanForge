import type { CampaignInput, CreatorProfileInput } from "@kravia/shared/growth";
import { creatorsRepository, type CreatorsRepository } from "./creators.repository";

export class CreatorsService {
  constructor(private readonly repository: CreatorsRepository = creatorsRepository) {}

  async createProfile(input: CreatorProfileInput) {
    return this.repository.createProfile(input);
  }

  async createCampaign(input: CampaignInput) {
    return this.repository.createCampaign(input);
  }

  async listProfiles(organizationId: string) {
    return this.repository.listProfiles(organizationId);
  }

  async listCampaigns(organizationId: string) {
    return this.repository.listCampaigns(organizationId);
  }

  async summary(organizationId: string) {
    const profiles = await this.listProfiles(organizationId);
    const campaigns = await this.listCampaigns(organizationId);
    return {
      creators: profiles.length,
      campaigns: campaigns.length,
      activeCampaigns: campaigns.filter((item) => item.status === "ACTIVE").length,
      approvals: campaigns.filter((item) => item.status === "IN_REVIEW").length,
      payoutPending: profiles.filter((item) => item.payoutStatus === "PENDING").length
    };
  }

  async promotions(organizationId: string) {
    const profiles = await this.listProfiles(organizationId);
    const campaigns = await this.listCampaigns(organizationId);
    const totalBudget = campaigns.reduce((sum, campaign) => sum + (campaign.budget || 0), 0);
    const pendingApprovals = campaigns.filter((campaign) => campaign.status === "IN_REVIEW");
    const activeCampaigns = campaigns.filter((campaign) => campaign.status === "ACTIVE");

    return {
      metrics: {
        campaigns: campaigns.length,
        socialPosts: Math.max(campaigns.length * 3, 6),
        creatorCollaborations: profiles.length,
        approvals: pendingApprovals.length,
        budget: totalBudget,
        performanceScore: campaigns.length ? Math.min(95, 60 + activeCampaigns.length * 10 + pendingApprovals.length * 5) : 60
      },
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        budget: campaign.budget || 0,
        creatorId: campaign.creatorId,
        performance: campaign.status === "ACTIVE" ? "tracking" : campaign.status === "COMPLETED" ? "reported" : "pending"
      })),
      socialPosts: [
        { channel: "Instagram", format: "Reel", status: "DRAFT", linkedCampaign: campaigns[0]?.title || "Launch awareness" },
        { channel: "LinkedIn", format: "Founder update", status: "SCHEDULED", linkedCampaign: campaigns[1]?.title || "Product trust" },
        { channel: "WhatsApp", format: "Community broadcast", status: "APPROVAL_REQUIRED", linkedCampaign: campaigns[2]?.title || "Event reminder" }
      ],
      creatorCollaborations: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        niche: profile.niche || "General",
        payoutStatus: profile.payoutStatus || "PENDING",
        guidelines: "Use approved brand guidelines before posting."
      })),
      approvalQueue: pendingApprovals.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        owner: campaign.creatorId || "Marketing",
        nextStep: "Review concept, budget, and creator deliverables."
      })),
      contentCalendar: [
        { date: "2026-06-24", item: "Campaign concept review", channel: "Internal", status: "SCHEDULED" },
        { date: "2026-06-28", item: "Creator collaboration post", channel: "Instagram", status: "DRAFT" },
        { date: "2026-07-02", item: "Performance review", channel: "Dashboard", status: "PLANNED" }
      ],
      performance: {
        trackingMode: "launch-gated",
        signals: ["reach", "engagement", "leads", "conversions", "creator ROI"],
        summary: "Performance analytics are ready for provider connection; local mode uses campaign status and budget signals."
      }
    };
  }

  async creatorPortal(organizationId: string) {
    const profiles = await this.listProfiles(organizationId);
    const campaigns = await this.listCampaigns(organizationId);
    const pendingApprovals = campaigns.filter((campaign) => campaign.status === "IN_REVIEW");

    return {
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        budget: campaign.budget || 0,
        creatorId: campaign.creatorId || "unassigned"
      })),
      billing: {
        status: profiles.some((profile) => profile.payoutStatus === "PENDING") ? "PAYOUT_REVIEW_REQUIRED" : "READY",
        pendingCreators: profiles.filter((profile) => profile.payoutStatus === "PENDING").length,
        handoffRoute: "/api/v1/billing/summary"
      },
      contentIdeas: [
        { title: "Founder story reel", channel: "Instagram", linkedGoal: "trust building" },
        { title: "Product proof walkthrough", channel: "LinkedIn", linkedGoal: "qualified leads" },
        { title: "Customer outcome carousel", channel: "WhatsApp", linkedGoal: "renewal confidence" }
      ],
      conceptSharing: campaigns.map((campaign) => ({
        campaignId: campaign.id,
        title: campaign.title,
        status: campaign.status === "DRAFT" ? "CONCEPT_DRAFT" : "CONCEPT_SHARED",
        workspace: "Creator concept room"
      })),
      approvalFlow: pendingApprovals.length
        ? pendingApprovals.map((campaign) => ({
            campaignId: campaign.id,
            step: "Founder approval",
            status: "WAITING",
            route: "/api/v1/creators/campaigns"
          }))
        : [{ campaignId: "template", step: "Marketing review", status: "READY", route: "/api/v1/creators/campaigns" }],
      brandGuidelines: [
        { section: "Tone", rule: "Clear, useful, non-hype product education." },
        { section: "Visuals", rule: "Use approved logo, product screenshots, and accessible contrast." },
        { section: "Disclosure", rule: "Mark paid collaborations and avoid legal or financial promises." }
      ],
      payouts: profiles.map((profile) => ({
        creatorId: profile.id,
        name: profile.name,
        payoutStatus: profile.payoutStatus || "PENDING",
        financeRoute: "/api/v1/finance/exports"
      })),
      performanceTracking: {
        trackingMode: "launch-gated",
        signals: ["reach", "engagement", "leads", "conversions", "creator ROI"],
        reportRoute: "/api/v1/creators/promotions"
      }
    };
  }

  health() {
    return this.repository.health();
  }
}

export const creatorsService = new CreatorsService();
