import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { communicationService } from "./communication.service";

export const communicationRouter = Router();

const channelSchema = z.enum(["ANNOUNCEMENT", "DIRECT", "TEAM", "SUPPORT", "CUSTOMER_FOLLOW_UP"]);

communicationRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await communicationService.summary(organizationId) : { messages: 0, announcements: 0, direct: 0, support: 0, followUps: 0 } });
});

communicationRouter.get("/operating-system", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await communicationService.operatingSystem(organizationId)
      : { notifications: { provider: "notificationsService", status: "empty", generatedFromCommunications: 0 }, channelCatalog: [], emailTemplates: [], smsTemplates: [], routingRules: [] }
  });
});

communicationRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await communicationService.list(organizationId) : [] });
});

communicationRouter.post("/", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ channel: channelSchema, title: z.string().min(2), message: z.string().min(2), audience: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid communication request" });
    return;
  }
  response.status(201).json({ data: await communicationService.create({ ...parsed.data, organizationId }) });
});
