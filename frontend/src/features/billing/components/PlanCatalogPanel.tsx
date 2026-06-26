"use client";

import { useEffect, useMemo, useState } from "react";
import type { SuitePlan, SuiteType } from "@vmnexus/shared/types";
import { apiClient } from "@/services/apiClient";

type CatalogState = "loading" | "ready" | "error";

const suiteLabels: Record<SuiteType, string> = {
  EDUCATION_SUITE: "Education Suite",
  VMETRON_SUITE: "VMetron Suite"
};

export function PlanCatalogPanel() {
  const [plans, setPlans] = useState<SuitePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<SuitePlan | null>(null);
  const [state, setState] = useState<CatalogState>("loading");
  const [message, setMessage] = useState("Loading backend plan catalog.");

  const suiteCounts = useMemo(
    () =>
      plans.reduce<Record<SuiteType, number>>(
        (counts, plan) => ({
          ...counts,
          [plan.suiteType]: counts[plan.suiteType] + 1
        }),
        { EDUCATION_SUITE: 0, VMETRON_SUITE: 0 }
      ),
    [plans]
  );

  async function refreshCatalog() {
    setState("loading");
    setMessage("Loading backend plan catalog.");
    try {
      const nextPlans = await apiClient<SuitePlan[]>("/plans");
      setPlans(nextPlans);
      setSelectedPlanId((currentPlanId) => currentPlanId || nextPlans[0]?.planId || "");
      setState("ready");
      setMessage(`${nextPlans.length} plans loaded from API.`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Plan catalog failed.");
    }
  }

  async function loadSelectedPlan() {
    if (!selectedPlanId) {
      setSelectedPlan(null);
      setMessage("Select a plan to inspect.");
      return;
    }

    setState("loading");
    setMessage("Loading selected plan.");
    try {
      const plan = await apiClient<SuitePlan>(`/plans/${selectedPlanId}`);
      setSelectedPlan(plan);
      setState("ready");
      setMessage(`${plan.name} loaded from ${suiteLabels[plan.suiteType]}.`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Selected plan failed.");
    }
  }

  useEffect(() => {
    void refreshCatalog();
  }, []);

  return (
    <section className="mb-10 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plan Catalog</h2>
          <p className="mt-2 text-sm text-ink-muted">{message}</p>
        </div>
        <button
          className="rounded-md border border-line px-4 py-2 text-sm font-semibold disabled:opacity-60"
          disabled={state === "loading"}
          type="button"
          onClick={refreshCatalog}
        >
          Refresh catalog
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-line bg-canvas p-4">
          <p className="text-sm text-ink-muted">Total plans</p>
          <strong className="mt-1 block text-2xl">{plans.length}</strong>
        </div>
        {Object.entries(suiteCounts).map(([suiteType, count]) => (
          <div key={suiteType} className="rounded-md border border-line bg-canvas p-4">
            <p className="text-sm text-ink-muted">{suiteLabels[suiteType as SuiteType]}</p>
            <strong className="mt-1 block text-2xl">{count}</strong>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <label className="block text-sm font-semibold">
          Plan
          <select
            className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm"
            value={selectedPlanId}
            onChange={(event) => setSelectedPlanId(event.target.value)}
          >
            {plans.map((plan) => (
              <option key={plan.planId} value={plan.planId}>
                {suiteLabels[plan.suiteType]} - {plan.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={state === "loading" || !selectedPlanId}
          type="button"
          onClick={loadSelectedPlan}
        >
          Load selected plan
        </button>
      </div>

      {selectedPlan ? (
        <div className="mt-5 rounded-md border border-line bg-canvas p-4 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <strong>{selectedPlan.name}</strong>
            <span className="text-ink-muted">{selectedPlan.planId}</span>
          </div>
          <p className="mt-2 text-ink-muted">
            {suiteLabels[selectedPlan.suiteType]} includes {selectedPlan.includedProducts.length} products and {selectedPlan.limits.length} limits.
          </p>
        </div>
      ) : null}
    </section>
  );
}
