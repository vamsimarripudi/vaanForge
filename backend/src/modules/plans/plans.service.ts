import { educationSuitePlans } from "../../config/plans/education-suite.plans";
import { vmetronSuitePlans } from "../../config/plans/vmetron-suite.plans";
import type { SuitePlan, SuiteType } from "@vmnexus/shared/types";

const allPlans = [...educationSuitePlans, ...vmetronSuitePlans];

export class PlansService {
  list(suiteType?: SuiteType): SuitePlan[] {
    return suiteType ? allPlans.filter((plan) => plan.suiteType === suiteType) : allPlans;
  }

  findById(planId: string): SuitePlan | undefined {
    return allPlans.find((plan) => plan.planId === planId);
  }
}

export const plansService = new PlansService();
