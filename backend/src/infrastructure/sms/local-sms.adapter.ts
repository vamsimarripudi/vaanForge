import { createId } from "../../database/in-memory-store";
import type { SmsDeliveryResult, SmsMessage, SmsProvider } from "./sms.interface";

export const localSmsOutbox: Array<SmsMessage & { id: string; createdAt: string }> = [];

export class LocalSmsAdapter implements SmsProvider {
  async send(message: SmsMessage): Promise<SmsDeliveryResult> {
    const id = createId("sms");
    localSmsOutbox.push({ ...message, id, createdAt: new Date().toISOString() });
    return { provider: "local", delivered: true, messageId: id };
  }
}
