import { createId } from "../../database/in-memory-store";
import type { CheckoutInput, CheckoutSession, PaymentsProvider } from "./payments.interface";

export const localCheckoutSessions: CheckoutSession[] = [];

export class LocalPaymentsAdapter implements PaymentsProvider {
  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    const session = {
      provider: "local",
      checkoutId: createId("chk"),
      amount: input.amount,
      currency: input.currency,
      status: "CREATED" as const,
      checkoutUrl: `local://checkout/${input.organizationId}/${input.planId}`,
      providerOrderId: createId("local_order"),
      providerSubscriptionId: input.subscriptionId ? createId("local_subscription") : undefined
    };
    localCheckoutSessions.push(session);
    return session;
  }
}
