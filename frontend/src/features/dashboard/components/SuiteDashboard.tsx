"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/layouts/AppShell";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";
import type { SuiteType } from "@vmnexus/shared/types";

const dashboardContent = {
  EDUCATION_SUITE: {
    title: "Education Suite Dashboard",
    crossSell: "Need to run large school events? Add VMetron Suite.",
    requiredMetrics: ["Active students", "Active teachers", "Meetings created", "Forms created", "Support tickets", "Pending tasks", "Subscription status", "Renewal date", "Usage limits", "Announcements"],
    crossProductRules: ["Create VaanMeet Room", "Check Education Suite subscription", "Check VaanMeet entitlement", "Attach meeting code/link", "Create with VFormix", "Track submissions", "Show analytics"]
  },
  VMETRON_SUITE: {
    title: "VMetron Suite Dashboard",
    crossSell: "Need institution management? Add Education Suite.",
    requiredMetrics: ["Total events", "Upcoming events", "Registrations", "VaanMeet rooms", "VFormix forms", "Support tickets", "Promotion requests", "Revenue", "Usage limits", "Subscription status", "Renewal date"],
    crossProductRules: ["Attach VFormix Registration Form", "Create VaanMeet Room", "Enable Support Desk", "Enable Promotion/Creator Request", "Link form to event", "Attach join link/code", "Allow ticket creation", "Allow creator/collab request workflow"]
  }
} satisfies Record<SuiteType, { title: string; crossSell: string; requiredMetrics: string[]; crossProductRules: string[] }>;

interface SuiteSummary {
  suiteType: SuiteType;
  organizationName: string;
  activePlan: string;
  billingStatus: string;
  renewalDate?: string;
  workspaces: number;
  enabledProducts: number;
  finance: { revenue: number; grossProfit: number; netCashFlow: number };
  operations: { tasks: number; done: number; supportTickets: number; openSupport: number };
  growth: { leads: number; customers: number; pipeline: number; hiringItems: number; complianceItems: number };
}

const fallbackSummary = (suiteType: SuiteType): SuiteSummary => ({
  suiteType,
  organizationName: "No organization",
  activePlan: "not-active",
  billingStatus: "INACTIVE",
  workspaces: 0,
  enabledProducts: 0,
  finance: { revenue: 0, grossProfit: 0, netCashFlow: 0 },
  operations: { tasks: 0, done: 0, supportTickets: 0, openSupport: 0 },
  growth: { leads: 0, customers: 0, pipeline: 0, hiringItems: 0, complianceItems: 0 }
});

export function SuiteDashboard({ suiteType }: { suiteType: SuiteType }) {
  const content = dashboardContent[suiteType];
  const [summary, setSummary] = useState<SuiteSummary>(fallbackSummary(suiteType));
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");

  useEffect(() => {
    setState("loading");
    apiClient<SuiteSummary>(`/dashboard/suite/${suiteType}`)
      .then((data) => {
        setSummary(data);
        setState(data.workspaces > 0 ? "success" : "empty");
      })
      .catch(() => setState("error"));
  }, [suiteType]);

  const metrics = useMemo(
    () => [
      { label: "Organization", value: summary.organizationName, detail: "Active account" },
      { label: "Active plan", value: summary.activePlan, detail: summary.billingStatus },
      { label: "Enabled products", value: String(summary.enabledProducts), detail: "Entitlement controlled" },
      { label: "Revenue", value: `INR ${summary.finance.revenue}`, detail: "Suite organization revenue" },
      { label: "Open support", value: String(summary.operations.openSupport), detail: "Needs action" },
      { label: "Pipeline", value: `INR ${summary.growth.pipeline}`, detail: `${summary.growth.leads} leads` }
    ],
    [summary]
  );

  return (
    <AppShell>
      <section className="py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{content.title}</h1>
            <p className="mt-3 max-w-2xl text-ink-muted">
              Dashboard widgets load live suite status, active plan, product entitlements, finance, operations, support, and growth signals.
            </p>
          </div>
          <Link className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" href="/reports">
            Reports
          </Link>
        </div>
        <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
          <MetricGrid metrics={metrics} />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatePanel state={state} title="Suite API" detail="Live suite summary is permission protected." />
          <StatePanel state={summary.workspaces > 0 ? "success" : "empty"} title="Workspace" detail={`${summary.workspaces} active suite workspaces.`} />
          <StatePanel state={summary.operations.tasks > summary.operations.done ? "loading" : "success"} title="Operations" detail={`${summary.operations.tasks} tasks and ${summary.operations.done} done.`} />
          <StatePanel state={summary.growth.complianceItems ? "loading" : "empty"} title="Compliance" detail={`${summary.growth.complianceItems} tracked compliance items.`} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
            <h2 className="text-xl font-bold">Finance</h2>
            <p className="mt-3 text-sm text-ink-muted">Gross profit: INR {summary.finance.grossProfit}</p>
            <p className="mt-2 text-sm text-ink-muted">Net cash flow: INR {summary.finance.netCashFlow}</p>
          </section>
          <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
            <h2 className="text-xl font-bold">Operations</h2>
            <p className="mt-3 text-sm text-ink-muted">{summary.operations.tasks} tasks tracked.</p>
            <p className="mt-2 text-sm text-ink-muted">{summary.operations.supportTickets} support tickets linked.</p>
          </section>
          <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
            <h2 className="text-xl font-bold">Growth</h2>
            <p className="mt-3 text-sm text-ink-muted">{summary.growth.customers} customers and {summary.growth.leads} leads.</p>
            <p className="mt-2 text-sm text-ink-muted">{summary.growth.hiringItems} hiring and interview items.</p>
          </section>
        </div>
        <aside className="mt-6 rounded-panel border border-line bg-muted p-5">
          <p className="text-sm font-semibold text-accent">Cross-sell after activation</p>
          <p className="mt-2 text-lg font-semibold">{content.crossSell}</p>
        </aside>
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
            <h2 className="text-xl font-bold">Required Dashboard Signals</h2>
            <div className="mt-4 grid gap-2 text-sm text-ink-muted">
              {content.requiredMetrics.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
            <h2 className="text-xl font-bold">Cross-product Rules</h2>
            <div className="mt-4 grid gap-2 text-sm text-ink-muted">
              {content.crossProductRules.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
