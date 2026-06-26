import { env } from "../../config/env";
import { LocalPaymentsAdapter } from "./local-payments.adapter";
import { RazorpayPaymentsAdapter } from "./razorpay-payments.adapter";
import type { CheckoutInput, CheckoutSession, PaymentsProvider } from "./payments.interface";

const provider: PaymentsProvider =
  env.razorpayKeyId === "local" && env.razorpayKeySecret === "local" ? new LocalPaymentsAdapter() : new RazorpayPaymentsAdapter();

export class PaymentsService implements PaymentsProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    return provider.createCheckout(input);
  }
}

export const paymentsService = new PaymentsService();
