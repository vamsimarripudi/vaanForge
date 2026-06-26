export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type EmailDeliveryResult = {
  provider: string;
  delivered: boolean;
  messageId?: string;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailDeliveryResult>;
}
