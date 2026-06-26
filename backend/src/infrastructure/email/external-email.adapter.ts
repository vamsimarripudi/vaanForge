import type { EmailDeliveryResult, EmailMessage, EmailProvider } from "./email.interface";

export class ExternalEmailAdapter implements EmailProvider {
  async send(_message: EmailMessage): Promise<EmailDeliveryResult> {
    throw new Error("External email provider is not configured. Set EMAIL_PROVIDER to a supported provider and supply credentials before production launch.");
  }
}
