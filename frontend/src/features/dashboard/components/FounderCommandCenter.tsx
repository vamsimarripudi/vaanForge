"use client";

import { useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";
import { NotificationPanel } from "@/features/notifications/components/NotificationPanel";

interface FounderSummary {
  health: string;
  workspacesCount: number;
  enabledProductsCount: number;
  unreadNotifications: number;
  finance: { revenue: number; expenses: number; profit: number; note: string };
  operations: { tasks: number; approvals: number; supportTickets: number; hiringItems: number; complianceItems: number };
}

const fallback: FounderSummary = {
  health: "Setup required",
  workspacesCount: 0,
  enabledProductsCount: 0,
  unreadNotifications: 0,
  finance: { revenue: 0, expenses: 0, profit: 0, note: "Activate workspace to begin finance tracking." },
  operations: { tasks: 0, approvals: 0, supportTickets: 0, hiringItems: 0, complianceItems: 0 }
};

export function FounderCommandCenter() {
  const [summary, setSummary] = useState<FounderSummary>(fallback);
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");

  useEffect(() => {
    apiClient<FounderSummary>("/dashboard/founder")
      .then((data) => {
        setSummary(data);
        setState("success");
      })
      .catch(() => setState("error"));
  }, []);

  return (
    <section className="py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Founder Command Center</h1>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Combined founder view for company health, workspaces, entitlements, finance placeholders, operations, alerts,
            and suite cross-sell timing.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{state}</span>
      </div>

      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <MetricGrid
          metrics={[
            { label: "Company health", value: summary.health, detail: "Current operating status" },
            { label: "Workspaces", value: String(summary.workspacesCount), detail: "Active workspace count" },
            { label: "Enabled products", value: String(summary.enabledProductsCount), detail: "Entitlement controlled" },
            { label: "Unread alerts", value: String(summary.unreadNotifications), detail: "Notification queue" },
            { label: "Revenue", value: `₹${summary.finance.revenue}`, detail: summary.finance.note },
            { label: "Open tasks", value: String(summary.operations.tasks), detail: "Task module pending" }
          ]}
        />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Loading command" detail="Shown while founder data loads." />
        <StatePanel state="empty" title="Setup required" detail="Shown before workspace activation creates operating data." />
        <StatePanel state="error" title="Command error" detail="Shown when founder APIs fail." />
        <StatePanel state={state === "success" ? "success" : state === "error" ? "error" : "empty"} title="Command ready" detail="Founder command center lifecycle is active." />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Operational Queue</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(summary.operations).map(([key, value]) => (
              <div key={key} className="rounded-md border border-line bg-muted p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{key}</p>
                <p className="mt-2 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>
        <NotificationPanel />
      </div>
    </section>
  );
}
