import type { CheckoutInput, CheckoutSession, PaymentsProvider } from "./payments.interface";
import { env } from "../../config/env";

export class RazorpayPaymentsAdapter implements PaymentsProvider {
  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    const order = await this.request<{ id: string; amount: number; currency: "INR"; status: string }>("/orders", {
      amount: input.amount,
      currency: input.currency,
      receipt: input.idempotencyKey || `${input.organizationId}-${input.planId}-${Date.now()}`,
      notes: {
        organizationId: input.organizationId,
        customerId: input.customerId || "",
        planId: input.planId,
        billingCycle: input.billingCycle,
        subscriptionId: input.subscriptionId || ""
      }
    });
    return {
      provider: "razorpay",
      checkoutId: order.id,
      providerOrderId: order.id,
      providerSubscriptionId: input.subscriptionId,
      amount: order.amount,
      currency: order.currency,
      status: "CREATED",
      checkoutUrl: `https://checkout.razorpay.com/v1/checkout/embedded?order_id=${encodeURIComponent(order.id)}`
    };
  }

  private async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    if (env.razorpayKeyId === "placeholder" || env.razorpayKeySecret === "placeholder") {
      throw new Error("Razorpay credentials are placeholders. Configure production keys before checkout.");
    }
    const credentials = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");
    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(`Razorpay request failed with ${response.status}: ${message || response.statusText}`);
    }
    return response.json() as Promise<T>;
  }
}
