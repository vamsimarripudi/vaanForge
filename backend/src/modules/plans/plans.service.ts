import type { SuitePlan, SuiteType } from "@kravia/shared/types";
import { planConfigurationService } from "../billing/plan-configuration.service";

export class PlansService {
  list(suiteType?: SuiteType): SuitePlan[] {
    return planConfigurationService.suitePlans(suiteType);
  }

  findById(planId: string): SuitePlan | undefined {
    return planConfigurationService.findSuitePlan(planId);
  }
}

export const plansService = new PlansService();
