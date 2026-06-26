import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { intelligenceService } from "./intelligence.service";

export const intelligenceRouter = Router();

intelligenceRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await intelligenceService.summary(organizationId) : await intelligenceService.summary("none") });
});

intelligenceRouter.get("/latest", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await intelligenceService.latest(organizationId) : null });
});

intelligenceRouter.get("/operating-system", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await intelligenceService.operatingSystem(organizationId)
      : {
          explainReports: { summary: "Create a workspace to load report explanations.", source: "/api/v1/reports/operating-system" },
          suggestNextTasks: [],
          detectRisks: [],
          suggestFollowUps: [],
          draftCommunications: [],
          summarizeTickets: { open: 0, resolved: 0, summary: "No workspace tickets loaded." },
          summarizeInterviews: { candidates: 0, interviews: 0, summary: "No workspace interviews loaded." },
          financialAssistant: { revenue: 0, expenses: 0, netCashFlow: 0, suggestion: "Create a workspace to load financial guidance." },
          salesAssistant: { leads: 0, customers: 0, expectedPipeline: 0, suggestion: "Create a workspace to load sales guidance." },
          disclaimer: "Deterministic assistant output for operating support; review before action."
        }
  });
});
