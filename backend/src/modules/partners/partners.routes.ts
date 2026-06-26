import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { partnersService } from "./partners.service";

export const partnersRouter = Router();

const statusSchema = z.enum(["PROSPECT", "ACTIVE", "PAUSED", "ENDED"]);

partnersRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await partnersService.summary(organizationId) : { partners: 0, active: 0, prospects: 0, averageShare: 0 } });
});

partnersRouter.get("/collaboration-os", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await partnersService.collaborationOs(organizationId)
      : { partners: [], collaborations: [], revenueShare: [], agreements: [], tasks: [], approvals: [], communications: [] }
  });
});

partnersRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await partnersService.list(organizationId) : [] });
});

partnersRouter.post("/", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ name: z.string().min(2), status: statusSchema.default("PROSPECT"), revenueSharePercent: z.number().min(0).max(100).optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid partner request" });
    return;
  }
  response.status(201).json({ data: await partnersService.createPartner({ ...parsed.data, organizationId }) });
});
