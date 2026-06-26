import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { notificationsService } from "./notifications.service";

export const notificationsRouter = Router();

notificationsRouter.get("/", authMiddleware, (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.json({ data: [] });
    return;
  }
  response.json({ data: notificationsService.list(organizationId, request.session?.userId) });
});

notificationsRouter.post("/", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const parsed = z.object({ title: z.string().min(2), message: z.string().min(2), smsTo: z.string().min(8).optional() }).safeParse(request.body);
  const organizationId = request.session?.organizationId;
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid notification request" });
    return;
  }
  response.status(201).json({ data: await notificationsService.create({ ...parsed.data, organizationId }) });
});

notificationsRouter.patch("/:notificationId/read", authMiddleware, (request, response) => {
  const notificationId = String(request.params.notificationId);
  const notification = notificationsService.markRead(notificationId);
  if (!notification) {
    response.status(404).json({ error: "Notification not found" });
    return;
  }
  response.json({ data: notification });
});
