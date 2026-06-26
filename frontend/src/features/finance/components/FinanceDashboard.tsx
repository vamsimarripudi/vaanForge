"use client";

import { useCallback, useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { API_BASE_URL, apiClient } from "@/services/apiClient";

interface FinanceSummary {
  revenueTotal: number;
  expenseTotal: number;
  grossProfit: number;
  profitMarginPercent: number;
  gstPayable: number;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
}

interface FinanceAnalytics {
  founderPayoutPlanning: {
    grossProfit: number;
    reserve: number;
    reinvestment: number;
    complianceHold: number;
    suggestedFounderPayout: number;
    rule: string;
  };
  productWiseRevenue: Array<{ product: string; revenue: number }>;
  productWiseProfit: Array<{ product: string; revenue: number; allocatedExpense: number; profit: number; marginPercent: number }>;
  caExport: {
    reportType: "CA_EXPORT";
    availableFormats: Array<"EXCEL" | "PDF">;
    includes: string[];
  };
}

type ReportExport = {
  id: string;
  reportType: string;
  format: string;
  status: string;
  fileName: string;
  storageProvider?: string;
};

const emptySummary: FinanceSummary = {
  revenueTotal: 0,
  expenseTotal: 0,
  grossProfit: 0,
  profitMarginPercent: 0,
  gstPayable: 0,
  cashIn: 0,
  cashOut: 0,
  netCashFlow: 0
};

const emptyAnalytics: FinanceAnalytics = {
  founderPayoutPlanning: {
    grossProfit: 0,
    reserve: 0,
    reinvestment: 0,
    complianceHold: 0,
    suggestedFounderPayout: 0,
    rule: "Payout after reserving runway, reinvestment, and tax/compliance buffers."
  },
  productWiseRevenue: [],
  productWiseProfit: [],
  caExport: {
    reportType: "CA_EXPORT",
    availableFormats: ["EXCEL", "PDF"],
    includes: ["P&L", "GST", "cash flow", "product-wise revenue", "product-wise profit", "founder payout planning"]
  }
};

export function FinanceDashboard() {
  const [summary, setSummary] = useState<FinanceSummary>(emptySummary);
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [workflowState, setWorkflowState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [workflowMessage, setWorkflowMessage] = useState("Ready for a revenue or expense entry.");
  const [exports, setExports] = useState<ReportExport[]>([]);
  const [analytics, setAnalytics] = useState<FinanceAnalytics>(emptyAnalytics);
  const [exportState, setExportState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [exportMessage, setExportMessage] = useState("Loading finance exports.");

  const refreshSummary = useCallback(async () => {
    return Promise.all([apiClient<FinanceSummary>("/finance/summary"), apiClient<FinanceAnalytics>("/finance/analytics")])
      .then((data) => {
        const [nextSummary, nextAnalytics] = data;
        setSummary(nextSummary);
        setAnalytics(nextAnalytics);
        setState(nextSummary.revenueTotal || nextSummary.expenseTotal ? "success" : "empty");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => {
    void refreshSummary();
    void refreshExports();
  }, [refreshSummary]);

  async function refreshExports() {
    try {
      const nextExports = await apiClient<ReportExport[]>("/finance/exports");
      setExports(nextExports);
      setExportState(nextExports.length ? "success" : "empty");
      setExportMessage(nextExports.length ? "Finance exports are ready." : "No finance exports have been queued yet.");
    } catch (error) {
      setExportState("error");
      setExportMessage(error instanceof Error ? error.message : "Finance exports failed to load.");
    }
  }

  async function createRevenue(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Saving revenue entry.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient("/finance/revenue", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          source: String(formData.get("source") || ""),
          amount: Number(formData.get("amount") || 0),
          receivedAt: String(formData.get("receivedAt") || ""),
          product: String(formData.get("product") || "")
        })
      });
      await refreshSummary();
      setWorkflowState("success");
      setWorkflowMessage("Revenue entry saved and metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Revenue entry failed.");
    }
  }

  async function createExpense(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Saving expense entry.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient("/finance/expenses", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          category: String(formData.get("category") || ""),
          amount: Number(formData.get("amount") || 0),
          spentAt: String(formData.get("spentAt") || ""),
          vendor: String(formData.get("vendor") || "")
        })
      });
      await refreshSummary();
      setWorkflowState("success");
      setWorkflowMessage("Expense entry saved and metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Expense entry failed.");
    }
  }

  async function queueExport(formData: FormData) {
    setExportState("loading");
    setExportMessage("Queueing finance export.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient<ReportExport>("/finance/exports", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          reportType: String(formData.get("reportType") || "PNL"),
          format: String(formData.get("format") || "EXCEL")
        })
      });
      await refreshExports();
    } catch (error) {
      setExportState("error");
      setExportMessage(error instanceof Error ? error.message : "Finance export request failed.");
    }
  }

  return (
    <section className="py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Finance OS</h1>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Revenue, expenses, P&L, GST, cash flow, and exports are formula-backed and audit-logged on the backend.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{state}</span>
      </div>

      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <MetricGrid
          metrics={[
            { label: "Revenue", value: `₹${summary.revenueTotal}`, detail: "Total cash in" },
            { label: "Expenses", value: `₹${summary.expenseTotal}`, detail: "Total cash out" },
            { label: "Gross profit", value: `₹${summary.grossProfit}`, detail: "Revenue minus expenses" },
            { label: "Profit margin", value: `${summary.profitMarginPercent}%`, detail: "Profit divided by revenue" },
            { label: "GST payable", value: `₹${summary.gstPayable}`, detail: "Output GST minus input credit" },
            { label: "Net cash flow", value: `₹${summary.netCashFlow}`, detail: "Cash in minus cash out" }
          ]}
        />
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <form action={createRevenue} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Add Revenue</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Source
              <input name="source" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Subscription" />
            </label>
            <label className="text-sm font-semibold">
              Product
              <input name="product" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="VMetron" />
            </label>
            <label className="text-sm font-semibold">
              Amount
              <input name="amount" type="number" min="1" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="125000" />
            </label>
            <label className="text-sm font-semibold">
              Received
              <input name="receivedAt" type="date" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Revenue
          </button>
        </form>

        <form action={createExpense} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Add Expense</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Category
              <input name="category" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Operations" />
            </label>
            <label className="text-sm font-semibold">
              Vendor
              <input name="vendor" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Cloud vendor" />
            </label>
            <label className="text-sm font-semibold">
              Amount
              <input name="amount" type="number" min="1" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="25000" />
            </label>
            <label className="text-sm font-semibold">
              Spent
              <input name="spentAt" type="date" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Expense
          </button>
        </form>
      </section>

      <div className="mt-6">
        <StatePanel state={workflowState} title="Finance workflow" detail={workflowMessage} />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Finance loading" detail="Shown while records load." />
        <StatePanel state="empty" title="No records" detail="Shown before revenue or expenses exist." />
        <StatePanel state="error" title="Finance error" detail="Shown when calculations or export requests fail." />
        <StatePanel state="success" title="Formula ready" detail="P&L, GST, and cash flow formulas are defined." />
      </div>

      <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <h2 className="text-xl font-bold">Export Queue</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <form action={queueExport} className="rounded-md border border-line bg-canvas p-4">
            <label className="block text-sm font-semibold">
              Report
              <select name="reportType" defaultValue="PNL" className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2">
                <option value="PNL">P&L</option>
                <option value="GST">GST</option>
                <option value="CASH_FLOW">Cash flow</option>
                <option value="FOUNDER_MONTHLY">Founder monthly</option>
                <option value="CA_EXPORT">CA export</option>
              </select>
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Format
              <select name="format" defaultValue="EXCEL" className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2">
                <option value="EXCEL">CSV</option>
                <option value="PDF">Printable HTML</option>
              </select>
            </label>
            <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
              Queue Finance Export
            </button>
          </form>
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <StatePanel state={exportState} title="Finance exports" detail={exportMessage} />
              <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" type="button" onClick={refreshExports}>
                Refresh
              </button>
            </div>
            {exports.length ? (
              <ul className="mt-4 divide-y divide-line">
                {exports.map((item) => (
                  <li key={item.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{item.fileName}</p>
                      <p className="text-sm text-ink-muted">
                        {item.reportType} / {item.format} / {item.status} / {item.storageProvider ?? "storage pending"}
                      </p>
                    </div>
                    <a className="text-sm font-semibold text-brand" href={`${API_BASE_URL}/finance/exports/${item.id}/download`}>
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <h2 className="text-xl font-bold">Founder Payout Planning</h2>
        <p className="mt-2 text-sm text-ink-muted">{analytics.founderPayoutPlanning.rule}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {[
            { label: "Gross profit", value: analytics.founderPayoutPlanning.grossProfit },
            { label: "Reserve", value: analytics.founderPayoutPlanning.reserve },
            { label: "Reinvestment", value: analytics.founderPayoutPlanning.reinvestment },
            { label: "Compliance hold", value: analytics.founderPayoutPlanning.complianceHold },
            { label: "Founder payout", value: analytics.founderPayoutPlanning.suggestedFounderPayout }
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-line bg-canvas p-4">
              <p className="text-sm text-ink-muted">{item.label}</p>
              <strong className="mt-1 block text-xl">₹{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Product-wise Revenue</h2>
          {analytics.productWiseRevenue.length ? (
            <ul className="mt-4 divide-y divide-line text-sm">
              {analytics.productWiseRevenue.map((item) => (
                <li key={item.product} className="flex justify-between gap-4 py-3">
                  <span>{item.product}</span>
                  <strong>₹{item.revenue}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <StatePanel state="empty" title="No product revenue" detail="Add revenue with a product to populate this view." />
          )}
        </div>
        <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Product-wise Profit</h2>
          {analytics.productWiseProfit.length ? (
            <ul className="mt-4 divide-y divide-line text-sm">
              {analytics.productWiseProfit.map((item) => (
                <li key={item.product} className="py-3">
                  <div className="flex justify-between gap-4">
                    <span>{item.product}</span>
                    <strong>₹{item.profit}</strong>
                  </div>
                  <p className="mt-1 text-ink-muted">
                    Revenue ₹{item.revenue}, allocated expense ₹{item.allocatedExpense}, margin {item.marginPercent}%
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <StatePanel state="empty" title="No product profit" detail="Product profit appears after product revenue is saved." />
          )}
        </div>
      </section>

      <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <h2 className="text-xl font-bold">CA Export</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {analytics.caExport.reportType} includes {analytics.caExport.includes.join(", ")}.
        </p>
      </section>
    </section>
  );
}
