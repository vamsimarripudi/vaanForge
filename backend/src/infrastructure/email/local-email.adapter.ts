import { createId } from "../../database/in-memory-store";
import type { EmailDeliveryResult, EmailMessage, EmailProvider } from "./email.interface";

export const localEmailOutbox: Array<EmailMessage & { id: string; createdAt: string }> = [];

export class LocalEmailAdapter implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    const id = createId("eml");
    localEmailOutbox.push({ ...message, id, createdAt: new Date().toISOString() });
    return { provider: "local", delivered: true, messageId: id };
  }
}
