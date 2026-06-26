import { env } from "../../config/env";
import type { EmailDeliveryResult, EmailMessage, EmailProvider } from "./email.interface";
import { ExternalEmailAdapter } from "./external-email.adapter";
import { LocalEmailAdapter } from "./local-email.adapter";

const provider: EmailProvider = env.emailProvider === "local" ? new LocalEmailAdapter() : new ExternalEmailAdapter();

export class EmailService implements EmailProvider {
  send(message: EmailMessage): Promise<EmailDeliveryResult> {
    return provider.send(message);
  }
}

export const emailService = new EmailService();
