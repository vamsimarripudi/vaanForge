import { authService } from "../auth/auth.service";
import { plansService } from "../plans/plans.service";
import type { SuiteType } from "@kravia/shared/types";
import { workspacesRepository, type WorkspacesRepository } from "./workspaces.repository";

export interface CreateWorkspaceInput {
  founderUserId: string;
  organizationName: string;
  workspaceName: string;
  suiteType: SuiteType;
  planId: string;
}

export class WorkspacesService {
  constructor(private readonly repository: WorkspacesRepository = workspacesRepository) {}

  async create(input: CreateWorkspaceInput) {
    const plan = plansService.findById(input.planId);
    if (!plan || plan.suiteType !== input.suiteType) {
      throw new Error("Selected plan does not match suite type");
    }

    const result = await this.repository.createActivation({
      ...input,
      enabledProducts: plan.includedProducts,
      limits: Object.fromEntries(plan.limits.map((limit) => [limit.key, limit.value])),
      planName: plan.name
    });

    await authService.assignOrganization(input.founderUserId, result.organization.id);
    return result;
  }

  async listForOrganization(organizationId: string) {
    return this.repository.listForOrganization(organizationId);
  }

  async getOrganization(organizationId: string) {
    return this.repository.getOrganization(organizationId);
  }

  async listEntitlements(organizationId: string) {
    return this.repository.listEntitlements(organizationId);
  }

  health() {
    return this.repository.health();
  }
}

export const workspacesService = new WorkspacesService();
