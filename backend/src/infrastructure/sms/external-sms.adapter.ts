import type { SmsDeliveryResult, SmsMessage, SmsProvider } from "./sms.interface";

export class ExternalSmsAdapter implements SmsProvider {
  async send(_message: SmsMessage): Promise<SmsDeliveryResult> {
    throw new Error("External SMS provider is not configured. Set SMS_PROVIDER to a supported provider and supply credentials before production launch.");
  }
}
