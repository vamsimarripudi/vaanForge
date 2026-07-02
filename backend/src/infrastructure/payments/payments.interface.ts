export type CheckoutInput = {
  organizationId: string;
  planId: string;
  amount: number;
  currency: "INR";
  billingCycle: "MONTHLY" | "YEARLY";
  customerId?: string;
  subscriptionId?: string;
  idempotencyKey?: string;
};

export type CheckoutSession = {
  provider: string;
  checkoutId: string;
  amount: number;
  currency: "INR";
  status: "CREATED" | "PROVIDER_NOT_CONFIGURED";
  checkoutUrl: string;
  providerOrderId?: string;
  providerSubscriptionId?: string;
  message?: string;
  nextAction?: string;
};

export interface PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
}

export interface SubscriptionProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
}

export interface InvoiceProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
}

export type PaymentsProvider = PaymentProvider;
