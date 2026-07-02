import type { CampaignInput, CampaignStatus, CreatorProfileInput } from "@kravia/shared/growth";
import { env } from "../../config/env";
import { createId, store, type StoredCampaign, type StoredCreatorProfile } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export interface CreatorsRepository {
  createProfile(input: CreatorProfileInput): Promise<StoredCreatorProfile> | StoredCreatorProfile;
  createCampaign(input: CampaignInput): Promise<StoredCampaign> | StoredCampaign;
  listProfiles(organizationId: string): Promise<StoredCreatorProfile[]> | StoredCreatorProfile[];
  listCampaigns(organizationId: string): Promise<StoredCampaign[]> | StoredCampaign[];
  health(): RepositoryHealth;
}

export class MemoryCreatorsRepository implements CreatorsRepository {
  createProfile(input: CreatorProfileInput) {
    const profile = { id: createId("crt"), ...input, createdAt: new Date().toISOString() };
    store.creatorProfiles.push(profile);
    return profile;
  }

  createCampaign(input: CampaignInput) {
    const campaign = { id: createId("cmpn"), ...input, createdAt: new Date().toISOString() };
    store.campaigns.push(campaign);
    return campaign;
  }

  listProfiles(organizationId: string) {
    return store.creatorProfiles.filter((item) => item.organizationId === organizationId);
  }

  listCampaigns(organizationId: string) {
    return store.campaigns.filter((item) => item.organizationId === organizationId);
  }

  health(): RepositoryHealth {
    return { name: "creators", mode: "memory", writable: true, durable: false };
  }
}

export class PrismaCreatorsRepository implements CreatorsRepository {
  async createProfile(input: CreatorProfileInput) {
    const profile = await prisma().creatorProfile.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        niche: input.niche,
        payoutStatus: input.payoutStatus
      }
    });
    return this.toProfile(profile);
  }

  async createCampaign(input: CampaignInput) {
    const campaign = await prisma().campaign.create({
      data: {
        organizationId: input.organizationId,
        creatorId: input.creatorId,
        title: input.title,
        status: input.status,
        budget: input.budget
      }
    });
    return this.toCampaign(campaign);
  }

  async listProfiles(organizationId: string) {
    const profiles = await prisma().creatorProfile.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return profiles.map((profile: PrismaCreatorProfile) => this.toProfile(profile));
  }

  async listCampaigns(organizationId: string) {
    const campaigns = await prisma().campaign.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return campaigns.map((campaign: PrismaCampaign) => this.toCampaign(campaign));
  }

  health(): RepositoryHealth {
    return { name: "creators", mode: "postgres", writable: true, durable: true };
  }

  private toProfile(profile: PrismaCreatorProfile): StoredCreatorProfile {
    return {
      id: profile.id,
      organizationId: profile.organizationId,
      name: profile.name,
      niche: profile.niche ?? undefined,
      payoutStatus: profile.payoutStatus ?? undefined,
      createdAt: profile.createdAt.toISOString()
    };
  }

  private toCampaign(campaign: PrismaCampaign): StoredCampaign {
    return {
      id: campaign.id,
      organizationId: campaign.organizationId,
      creatorId: campaign.creatorId ?? undefined,
      title: campaign.title,
      status: this.campaignStatus(campaign.status),
      budget: campaign.budget === null ? undefined : Number(campaign.budget),
      createdAt: campaign.createdAt.toISOString()
    };
  }

  private campaignStatus(value: string): CampaignStatus {
    return value === "DRAFT" || value === "IN_REVIEW" || value === "APPROVED" || value === "ACTIVE" || value === "COMPLETED" ? value : "DRAFT";
  }
}

type PrismaCreatorProfile = {
  id: string;
  organizationId: string;
  name: string;
  niche: string | null;
  payoutStatus: string | null;
  createdAt: Date;
};

type PrismaCampaign = {
  id: string;
  organizationId: string;
  creatorId: string | null;
  title: string;
  status: string;
  budget: unknown | null;
  createdAt: Date;
};

export const creatorsRepository: CreatorsRepository =
  env.persistenceMode === "postgres" ? new PrismaCreatorsRepository() : new MemoryCreatorsRepository();
