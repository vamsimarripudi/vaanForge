import { env } from "../../config/env";
import { ExternalSmsAdapter } from "./external-sms.adapter";
import { LocalSmsAdapter } from "./local-sms.adapter";
import type { SmsDeliveryResult, SmsMessage, SmsProvider } from "./sms.interface";

const provider: SmsProvider = env.smsProvider === "local" ? new LocalSmsAdapter() : new ExternalSmsAdapter();

export class SmsService implements SmsProvider {
  send(message: SmsMessage): Promise<SmsDeliveryResult> {
    return provider.send(message);
  }
}

export const smsService = new SmsService();
