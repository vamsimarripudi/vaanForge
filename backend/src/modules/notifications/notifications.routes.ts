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
  const parsed = z.object({ status: z.enum(["read", "unread", "archived"]).optional(), source: z.string().min(2).max(40).optional() }).safeParse(request.query);
  response.json({ data: notificationsService.list(organizationId, request.session?.userId, parsed.success ? parsed.data : {}) });
});

notificationsRouter.post("/", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const parsed = z.object({ title: z.string().min(2), message: z.string().min(2), smsTo: z.string().min(8).optional(), source: z.enum(["billing", "projects", "agents", "deployments", "marketplace", "support", "security", "announcements", "system"]).optional(), actionUrl: z.string().min(1).max(240).optional() }).safeParse(request.body);
  const organizationId = request.session?.organizationId;
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid notification request" });
    return;
  }
  response.status(201).json({ data: await notificationsService.create({ ...parsed.data, organizationId }) });
});

notificationsRouter.post("/read-all", authMiddleware, requirePermission("profile:manage"), (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.json({ data: { updated: 0 } });
    return;
  }
  response.json({ data: notificationsService.markAllRead(organizationId, request.session?.userId) });
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

notificationsRouter.post("/:notificationId/archive", authMiddleware, requirePermission("profile:manage"), (request, response) => {
  const notificationId = String(request.params.notificationId);
  const organizationId = request.session?.organizationId;
  const notification = organizationId ? notificationsService.archive(notificationId, organizationId, request.session?.userId) : undefined;
  if (!notification) {
    response.status(404).json({ error: "Notification not found" });
    return;
  }
  response.json({ data: notification });
});
