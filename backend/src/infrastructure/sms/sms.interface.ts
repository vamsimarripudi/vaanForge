export type SmsMessage = {
  to: string;
  message: string;
};

export type SmsDeliveryResult = {
  provider: string;
  delivered: boolean;
  messageId?: string;
};

export interface SmsProvider {
  send(message: SmsMessage): Promise<SmsDeliveryResult>;
}
