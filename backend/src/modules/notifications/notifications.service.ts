import { createId, store } from "../../database/in-memory-store";
import { realtimeService } from "../../infrastructure/realtime/realtime.service";
import { smsService } from "../../infrastructure/sms/sms.service";
import { settingsService } from "../settings/settings.service";

export class NotificationsService {
  list(organizationId: string, userId?: string) {
    return store.notifications.filter((item) => item.organizationId === organizationId && (!item.userId || item.userId === userId));
  }

  async create(input: { organizationId: string; userId?: string; title: string; message: string; smsTo?: string }) {
    const notification = {
      id: createId("ntf"),
      organizationId: input.organizationId,
      userId: input.userId,
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
}

export const notificationsService = new NotificationsService();
