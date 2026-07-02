import { createId, store } from "../../database/in-memory-store";
import { realtimeService } from "../../infrastructure/realtime/realtime.service";
import { smsService } from "../../infrastructure/sms/sms.service";
import { settingsService } from "../settings/settings.service";

export class NotificationsService {
  list(organizationId: string, userId?: string, filter: { status?: "read" | "unread" | "archived"; source?: string } = {}) {
    return store.notifications.filter((item) => {
      if (item.organizationId !== organizationId || (item.userId && item.userId !== userId)) return false;
      if (filter.status === "read" && (!item.read || item.archived)) return false;
      if (filter.status === "unread" && (item.read || item.archived)) return false;
      if (filter.status === "archived" && !item.archived) return false;
      if (filter.source && item.source !== filter.source) return false;
      return true;
    });
  }

  async create(input: { organizationId: string; userId?: string; title: string; message: string; smsTo?: string; source?: "billing" | "projects" | "agents" | "deployments" | "marketplace" | "support" | "security" | "announcements" | "system"; actionUrl?: string }) {
    const notification = {
      id: createId("ntf"),
      organizationId: input.organizationId,
      userId: input.userId,
      source: input.source ?? "system",
      actionUrl: input.actionUrl,
      archived: false,
      title: input.title,
      message: input.message,
      read: false,
      createdAt: new Date().toISOString()
    };

    store.notifications.push(notification);
    await realtimeService.publishUpdate(`organization:${input.organizationId}:notifications`, notification);
    const settings = await settingsService.get(input.organizationId);
    const sms =
      input.smsTo && settings.notificationSms
        ? await smsService.send({ to: input.smsTo, message: `${input.title}: ${input.message}` })
        : undefined;
    return { ...notification, sms };
  }

  markRead(notificationId: string) {
    const notification = store.notifications.find((item) => item.id === notificationId);
    if (notification) {
      notification.read = true;
    }
    return notification;
  }

  markAllRead(organizationId: string, userId?: string) {
    const notifications = this.list(organizationId, userId, { status: "unread" });
    notifications.forEach((notification) => {
      notification.read = true;
    });
    return { updated: notifications.length };
  }

  archive(notificationId: string, organizationId: string, userId?: string) {
    const notification = store.notifications.find((item) => item.id === notificationId && item.organizationId === organizationId && (!item.userId || item.userId === userId));
    if (notification) {
      notification.archived = true;
      notification.read = true;
    }
    return notification;
  }
}

export const notificationsService = new NotificationsService();
