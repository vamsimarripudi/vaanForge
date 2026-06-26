import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { creatorsService } from "./creators.service";

export const creatorsRouter = Router();

const campaignStatusSchema = z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "ACTIVE", "COMPLETED"]);

creatorsRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await creatorsService.summary(organizationId) : { creators: 0, campaigns: 0, activeCampaigns: 0, approvals: 0, payoutPending: 0 } });
});

creatorsRouter.get("/promotions", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await creatorsService.promotions(organizationId)
      : {
          metrics: { campaigns: 0, socialPosts: 0, creatorCollaborations: 0, approvals: 0, budget: 0, performanceScore: 0 },
          campaigns: [],
          socialPosts: [],
          creatorCollaborations: [],
          approvalQueue: [],
          contentCalendar: [],
          performance: { trackingMode: "empty", signals: [], summary: "Create a workspace to load promotions." }
        }
  });
});

creatorsRouter.get("/creator-portal", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await creatorsService.creatorPortal(organizationId)
      : {
          campaigns: [],
          billing: { status: "EMPTY", pendingCreators: 0, handoffRoute: "/api/v1/billing/summary" },
          contentIdeas: [],
          conceptSharing: [],
          approvalFlow: [],
          brandGuidelines: [],
          payouts: [],
          performanceTracking: { trackingMode: "empty", signals: [], reportRoute: "/api/v1/creators/promotions" }
        }
  });
});

creatorsRouter.get("/profiles", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await creatorsService.listProfiles(organizationId) : [] });
});

creatorsRouter.post("/profiles", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ name: z.string().min(2), niche: z.string().optional(), payoutStatus: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid creator profile request" });
    return;
  }
  response.status(201).json({ data: await creatorsService.createProfile({ ...parsed.data, organizationId }) });
});

creatorsRouter.get("/campaigns", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await creatorsService.listCampaigns(organizationId) : [] });
});

creatorsRouter.post("/campaigns", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ creatorId: z.string().optional(), title: z.string().min(2), status: campaignStatusSchema.default("DRAFT"), budget: z.number().nonnegative().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid campaign request" });
    return;
  }
  response.status(201).json({ data: await creatorsService.createCampaign({ ...parsed.data, organizationId }) });
});
