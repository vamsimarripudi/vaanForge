import type { CheckoutInput, CheckoutSession, PaymentProvider } from "./payments.interface";

export class NullPaymentProvider implements PaymentProvider {
  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    return {
      provider: "not_configured",
      checkoutId: `not_configured_${input.organizationId}_${input.planId}`,
      amount: input.amount,
      currency: input.currency,
      status: "PROVIDER_NOT_CONFIGURED",
      checkoutUrl: "",
      message: "Payment provider setup is required before checkout can be completed.",
      nextAction: "configure_razorpay_provider"
    };
  }
}
