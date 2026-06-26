export type CheckoutInput = {
  organizationId: string;
  planId: string;
  amount: number;
  currency: "INR";
  billingCycle: "MONTHLY" | "YEARLY";
};

export type CheckoutSession = {
  provider: string;
  checkoutId: string;
  amount: number;
  currency: "INR";
  status: "CREATED";
  checkoutUrl: string;
};

export interface PaymentsProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
}
