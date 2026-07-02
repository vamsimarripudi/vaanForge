import { env } from "../../config/env";
import { LocalPaymentsAdapter } from "./local-payments.adapter";
import { NullPaymentProvider } from "./null-payments.adapter";
import { RazorpayPaymentsAdapter } from "./razorpay-payments.adapter";
import type { CheckoutInput, CheckoutSession, PaymentProvider } from "./payments.interface";

const provider: PaymentProvider =
  env.razorpayKeyId === "local" && env.razorpayKeySecret === "local" ? new LocalPaymentsAdapter() : new RazorpayPaymentsAdapter();
const checkoutProvider: PaymentProvider =
  env.razorpayKeyId === "local" || env.razorpayKeySecret === "local" || env.razorpayKeyId === "placeholder" || env.razorpayKeySecret === "placeholder"
    ? new NullPaymentProvider()
    : new RazorpayPaymentsAdapter();

export class PaymentsService implements PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    return provider.createCheckout(input);
  }

  createCustomerCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    return checkoutProvider.createCheckout(input);
  }

  readiness() {
    const configured = !(env.razorpayKeyId === "local" || env.razorpayKeySecret === "local" || env.razorpayKeyId === "placeholder" || env.razorpayKeySecret === "placeholder");
    return {
      provider: "razorpay",
      configured,
      status: configured ? "configured" : "provider_not_configured",
      nextAction: configured ? "create_checkout" : "configure_razorpay_provider"
    };
  }
}

export const paymentsService = new PaymentsService();
