import type { CheckoutInput, CheckoutSession, PaymentsProvider } from "./payments.interface";

export class RazorpayPaymentsAdapter implements PaymentsProvider {
  async createCheckout(_input: CheckoutInput): Promise<CheckoutSession> {
    throw new Error("Razorpay payments are not configured. Set Razorpay credentials before production launch.");
  }
}
