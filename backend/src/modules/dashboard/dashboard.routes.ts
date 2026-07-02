import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { dashboardService } from "./dashboard.service";
import type { SuiteType } from "@kravia/shared/types";

export const dashboardRouter = Router();

dashboardRouter.get("/founder", authMiddleware, requirePermission("reports:export"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.status(404).json({ error: "No organization is active for this session" });
    return;
  }
  response.json({ data: await dashboardService.founderSummary(organizationId) });
});

dashboardRouter.get("/suite/:suiteType", authMiddleware, requirePermission("reports:export"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const suiteType = request.params.suiteType as SuiteType;
  if (!organizationId) {
    response.status(404).json({ error: "No organization is active for this session" });
    return;
  }
  if (suiteType !== "EDUCATION_SUITE" && suiteType !== "VMETRON_SUITE") {
    response.status(400).json({ error: "Unknown suite type" });
    return;
  }
  response.json({ data: await dashboardService.suiteSummary(organizationId, suiteType) });
});
