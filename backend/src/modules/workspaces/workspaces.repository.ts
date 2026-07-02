import type { ProductEntitlement, SuiteType } from "@kravia/shared/types";
import { createId, store, type StoredOrganization, type StoredWorkspace } from "../../database/in-memory-store";
import { env } from "../../config/env";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export type WorkspaceActivationInput = {
  founderUserId: string;
  organizationName: string;
  workspaceName: string;
  suiteType: SuiteType;
  planId: string;
  enabledProducts: ProductEntitlement["productType"][];
  limits: Record<string, number | "unlimited">;
  planName: string;
};

export type WorkspaceActivation = {
  organization: StoredOrganization;
  workspace: StoredWorkspace;
  entitlements: Array<ProductEntitlement & { organizationId: string }>;
};

export interface WorkspacesRepository {
  createActivation(input: WorkspaceActivationInput): Promise<WorkspaceActivation> | WorkspaceActivation;
  listForOrganization(organizationId: string): Promise<StoredWorkspace[]> | StoredWorkspace[];
  getOrganization(organizationId: string): Promise<StoredOrganization | undefined> | StoredOrganization | undefined;
  listEntitlements(organizationId: string): Promise<Array<ProductEntitlement & { organizationId: string }>> | Array<ProductEntitlement & { organizationId: string }>;
  health(): RepositoryHealth;
}

export class MemoryWorkspacesRepository implements WorkspacesRepository {
  createActivation(input: WorkspaceActivationInput) {
    const organization = {
      id: createId("org"),
      name: input.organizationName,
      suiteType: input.suiteType,
      activePlan: input.planId,
      billingStatus: "TRIAL" as const,
      renewalDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    const workspace = {
      id: createId("wks"),
      organizationId: organization.id,
      suiteType: input.suiteType,
      name: input.workspaceName,
      enabledProducts: input.enabledProducts,
      status: "ACTIVE" as const,
      createdAt: new Date().toISOString()
    };

    const entitlements = input.enabledProducts.map((productType) => ({
      organizationId: organization.id,
      productType,
      enabled: true,
      limits: input.limits,
      usage: {}
    }));

    store.organizations.push(organization);
    store.workspaces.push(workspace);
    store.entitlements.push(...entitlements);
    store.notifications.push({
      id: createId("ntf"),
      organizationId: organization.id,
      userId: input.founderUserId,
      title: "Workspace activated",
      message: `${workspace.name} is ready with ${input.planName} plan entitlements.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    return { organization, workspace, entitlements };
  }

  listForOrganization(organizationId: string) {
    return store.workspaces.filter((workspace) => workspace.organizationId === organizationId);
  }

  getOrganization(organizationId: string) {
    return store.organizations.find((organization) => organization.id === organizationId);
  }

  listEntitlements(organizationId: string) {
    return store.entitlements.filter((item) => item.organizationId === organizationId);
  }

  health(): RepositoryHealth {
    return { name: "workspaces", mode: "memory", writable: true, durable: false };
  }
}

export class PrismaWorkspacesRepository implements WorkspacesRepository {
  async createActivation(input: WorkspaceActivationInput) {
    const renewalDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const result = await prisma().$transaction(async (client: any) => {
      const organization = await client.organization.create({
        data: {
          name: input.organizationName,
          suiteType: input.suiteType
        }
      });
      const workspace = await client.workspace.create({
        data: {
          organizationId: organization.id,
          suiteType: input.suiteType,
          name: input.workspaceName,
          enabledProducts: input.enabledProducts,
          status: "ACTIVE"
        }
      });
      await client.organizationSubscription.create({
        data: {
          organizationId: organization.id,
          suiteType: input.suiteType,
          planId: input.planId,
          status: "TRIAL",
          renewalDate,
          trialEndsAt: renewalDate
        }
      });
      const entitlements = await Promise.all(
        input.enabledProducts.map((productType) =>
          client.productEntitlement.create({
            data: {
              organizationId: organization.id,
              productType,
              enabled: true,
              limits: input.limits,
              usage: {}
            }
          })
        )
      );
      await client.notification.create({
        data: {
          organizationId: organization.id,
          userId: input.founderUserId,
          title: "Workspace activated",
          message: `${workspace.name} is ready with ${input.planName} plan entitlements.`
        }
      });
      return { organization, workspace, entitlements, renewalDate };
    });

    return {
      organization: this.toOrganization(result.organization, input.planId, result.renewalDate),
      workspace: this.toWorkspace(result.workspace),
      entitlements: result.entitlements.map((entitlement: PrismaEntitlement) => this.toEntitlement(entitlement))
    };
  }

  async listForOrganization(organizationId: string) {
    const workspaces = await prisma().workspace.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return workspaces.map((workspace: PrismaWorkspace) => this.toWorkspace(workspace));
  }

  async getOrganization(organizationId: string) {
    const organization = await prisma().organization.findUnique({ where: { id: organizationId }, include: { subscription: true } });
    return organization
      ? this.toOrganization(organization, organization.subscription?.planId ?? "unassigned", organization.subscription?.renewalDate ?? undefined)
      : undefined;
  }

  async listEntitlements(organizationId: string) {
    const entitlements = await prisma().productEntitlement.findMany({ where: { organizationId } });
    return entitlements.map((entitlement: PrismaEntitlement) => this.toEntitlement(entitlement));
  }

  health(): RepositoryHealth {
    return { name: "workspaces", mode: "postgres", writable: true, durable: true };
  }

  private toOrganization(organization: PrismaOrganization, activePlan: string, renewalDate?: Date): StoredOrganization {
    return {
      id: organization.id,
      name: organization.name,
      suiteType: organization.suiteType,
      activePlan,
      billingStatus: "TRIAL",
      renewalDate: renewalDate?.toISOString(),
      createdAt: organization.createdAt.toISOString()
    };
  }

  private toWorkspace(workspace: PrismaWorkspace): StoredWorkspace {
    return {
      id: workspace.id,
      organizationId: workspace.organizationId,
      suiteType: workspace.suiteType,
      name: workspace.name,
      enabledProducts: workspace.enabledProducts,
      status: workspace.status === "PAUSED" ? "PAUSED" : "ACTIVE",
      createdAt: workspace.createdAt.toISOString()
    };
  }

  private toEntitlement(entitlement: PrismaEntitlement): ProductEntitlement & { organizationId: string } {
    return {
      organizationId: entitlement.organizationId,
      productType: entitlement.productType,
      enabled: entitlement.enabled,
      limits: this.limits(entitlement.limits),
      usage: this.usage(entitlement.usage)
    };
  }

  private limits(value: unknown): Record<string, number | "unlimited"> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, number | "unlimited">) : {};
  }

  private usage(value: unknown): Record<string, number> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, number>) : {};
  }
}

type PrismaOrganization = {
  id: string;
  name: string;
  suiteType: SuiteType;
  createdAt: Date;
  subscription?: { planId: string; renewalDate: Date | null } | null;
};

type PrismaWorkspace = {
  id: string;
  organizationId: string;
  suiteType: SuiteType;
  name: string;
  enabledProducts: ProductEntitlement["productType"][];
  status: string;
  createdAt: Date;
};

type PrismaEntitlement = {
  organizationId: string;
  productType: ProductEntitlement["productType"];
  enabled: boolean;
  limits: unknown;
  usage: unknown;
};

export const workspacesRepository: WorkspacesRepository =
  env.persistenceMode === "postgres" ? new PrismaWorkspacesRepository() : new MemoryWorkspacesRepository();
