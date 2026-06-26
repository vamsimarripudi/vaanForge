"use client";

import { useState } from "react";
import type { ProductType, SuitePlan } from "@vmnexus/shared/types";
import { apiClient } from "@/services/apiClient";

type CheckoutResponse =
  | {
      status: "PRICE_PENDING";
      planId: string;
      billingCycle: "MONTHLY" | "YEARLY";
      message: string;
    }
  | {
      status: "CHECKOUT_CREATED";
      planId: string;
      billingCycle: "MONTHLY" | "YEARLY";
      checkout: {
        checkoutUrl: string;
      };
    };

type TrialResponse =
  | {
      status: "TRIAL_STARTED";
      planId: string;
      trialDays: number;
      message: string;
    }
  | {
      status: "TRIAL_UNAVAILABLE";
      planId: string;
      message: string;
    };

type CheckoutState = "idle" | "loading" | "pending" | "ready" | "error";

type EntitlementCheck = {
  allowed: boolean;
  productType: ProductType;
  featureKey: string;
  limit: number | "unlimited" | null;
  used: number;
  reason?: string;
};

function PlanCheckoutButton({ plan }: { plan: SuitePlan }) {
  const [state, setState] = useState<CheckoutState>(plan.monthlyPrice === null ? "pending" : "idle");
  const [message, setMessage] = useState(plan.monthlyPrice === null ? "Commercial price pending approval" : "Ready for checkout");

  async function startCheckout() {
    if (plan.monthlyPrice === null) {
      setState("pending");
      setMessage("Commercial price pending approval");
      return;
    }

    setState("loading");
    setMessage("Preparing checkout");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const checkout = await apiClient<CheckoutResponse>("/billing/checkout", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({ planId: plan.planId, billingCycle: "MONTHLY" })
      });
      if (checkout.status === "PRICE_PENDING") {
        setState("pending");
        setMessage(checkout.message);
        return;
      }
      setState("ready");
      setMessage("Checkout session ready");
      window.location.href = checkout.checkout.checkoutUrl;
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Checkout failed");
    }
  }

  async function startTrial() {
    setState("loading");
    setMessage("Preparing trial");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const trial = await apiClient<TrialResponse>("/billing/trial", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({ planId: plan.planId })
      });
      setState(trial.status === "TRIAL_STARTED" ? "ready" : "pending");
      setMessage(trial.message);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Trial failed");
    }
  }

  return (
    <>
      {plan.trialAvailable ? (
        <button
          className="mt-5 w-full rounded-md border border-line px-4 py-2 text-sm font-semibold"
          type="button"
          disabled={state === "loading"}
          onClick={startTrial}
        >
          {state === "loading" ? "Preparing" : "Start trial"}
        </button>
      ) : null}
      <button
        className="mt-3 w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted"
        type="button"
        disabled={state === "loading" || plan.monthlyPrice === null}
        onClick={startCheckout}
      >
        {state === "loading" ? "Preparing" : plan.monthlyPrice === null ? "Price pending" : "Start checkout"}
      </button>
      <p className="mt-2 min-h-10 text-sm text-ink-muted">{message}</p>
    </>
  );
}

function PlanEntitlementChecker({ plan }: { plan: SuitePlan }) {
  const firstLimit = plan.limits[0];
  const [productType, setProductType] = useState<ProductType>(plan.includedProducts[0]);
  const [featureKey, setFeatureKey] = useState(firstLimit?.key || "");
  const [usage, setUsage] = useState(0);
  const [state, setState] = useState<CheckoutState>("idle");
  const [message, setMessage] = useState("Check product and usage allowance.");

  async function checkEntitlement() {
    setState("loading");
    setMessage("Checking entitlement.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const result = await apiClient<EntitlementCheck>("/entitlements/check", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          planId: plan.planId,
          productType,
          featureKey,
          usage: { [featureKey]: usage }
        })
      });
      setState(result.allowed ? "ready" : "pending");
      setMessage(result.allowed ? `${result.productType} allows ${result.featureKey}.` : result.reason || "Entitlement denied.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Entitlement check failed.");
    }
  }

  return (
    <div className="mt-5 rounded-md border border-line bg-canvas p-4">
      <h4 className="text-sm font-bold">Entitlement Check</h4>
      <label className="mt-3 block text-sm font-semibold">
        Product
        <select className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm" value={productType} onChange={(event) => setProductType(event.target.value as ProductType)}>
          {plan.includedProducts.map((product) => (
            <option key={product} value={product}>{product}</option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Feature
        <select className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm" value={featureKey} onChange={(event) => setFeatureKey(event.target.value)}>
          {plan.limits.map((limit) => (
            <option key={limit.key} value={limit.key}>{limit.label}</option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Used
        <input className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm" min={0} type="number" value={usage} onChange={(event) => setUsage(Number(event.target.value || 0))} />
      </label>
      <button className="mt-3 w-full rounded-md border border-line px-4 py-2 text-sm font-semibold disabled:opacity-60" disabled={state === "loading"} type="button" onClick={checkEntitlement}>
        {state === "loading" ? "Checking..." : "Check entitlement"}
      </button>
      <p className="mt-2 min-h-10 text-sm text-ink-muted">{message}</p>
    </div>
  );
}

export function PlanGrid({ title, plans }: { title: string; plans: SuitePlan[] }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.planId} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              {plan.recommended ? (
                <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">Recommended</span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-ink-muted">Commercial price pending approval</p>
            <ul className="mt-5 space-y-2 text-sm">
              {plan.limits.map((limit) => (
                <li key={limit.key} className="flex justify-between gap-3 border-b border-line pb-2">
                  <span>{limit.label}</span>
                  <strong>{limit.value}</strong>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-semibold">Support: {plan.supportLevel}</p>
            <PlanEntitlementChecker plan={plan} />
            <PlanCheckoutButton plan={plan} />
          </article>
        ))}
      </div>
    </section>
  );
}
