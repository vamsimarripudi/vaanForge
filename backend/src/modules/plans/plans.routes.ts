import { Router } from "express";
import { plansService } from "./plans.service";
import type { SuiteType } from "@vmnexus/shared/types";

export const plansRouter = Router();

plansRouter.get("/", (request, response) => {
  const suiteType = request.query.suiteType as SuiteType | undefined;
  response.json({ data: plansService.list(suiteType) });
});

plansRouter.get("/:planId", (request, response) => {
  const plan = plansService.findById(request.params.planId);
  if (!plan) {
    response.status(404).json({ error: "Plan not found" });
    return;
  }
  response.json({ data: plan });
});
