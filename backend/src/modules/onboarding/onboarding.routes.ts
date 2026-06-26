import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";

export const onboardingRouter = Router();

onboardingRouter.get("/", authMiddleware, (_request, response) => {
  response.json({
    data: {
      fields: [
        "founderName",
        "companyName",
        "businessType",
        "country",
        "industry",
        "teamSize",
        "productsNeeded",
        "painPoints",
        "revenueStage",
        "preferredPlan",
        "requiredPortals",
        "complianceNeeds",
        "supportNeeds"
      ],
      businessTypes: ["Education", "Events", "Creators", "Services", "Hybrid"],
      requiredPortals: ["Founder", "Client", "Customer", "Creator", "Partner"],
      recommendedSuites: ["EDUCATION_SUITE", "VMETRON_SUITE"],
      handoffRoute: "/api/v1/workspaces",
      workspaceActivation: {
        method: "POST",
        requiredFields: ["organizationName", "workspaceName", "suiteType", "planId"]
      }
    }
  });
});
