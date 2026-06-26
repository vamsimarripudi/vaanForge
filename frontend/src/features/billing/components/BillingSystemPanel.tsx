"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/services/apiClient";

type BillingSummary = {
  activePlan: {
    planId: string;
    name: string;
    billingCycle: "MONTHLY" | "YEARLY";
    amount: number | null;
    currency: string;
    paymentStatus: string;
    nextRenewalDate: string;
    renewalStatus: string;
  };
  invoices: Array<{
    invoiceId: string;
    number: string;
    dueAt: string;
    amount: number | null;
    currency: string;
    status: string;
  }>;
  renewalReminders: Array<{
    label: string;
    dueAt: string;
    status: string;
  }>;
  paymentProvider: {
    provider: string;
    mode: string;
    checkoutAvailable: boolean;
    reconciliation: string;
  };
};

const fallbackSummary: BillingSummary = {
  activePlan: {
    planId: "vmetron-growth",
    name: "VMetron Growth",
    billingCycle: "MONTHLY",
    amount: null,
    currency: "INR",
    paymentStatus: "PRICE_PENDING",
    nextRenewalDate: "2026-12-31T00:00:00.000Z",
    renewalStatus: "PRICE_APPROVAL_REQUIRED"
  },
  invoices: [
    {
      invoiceId: "local-launch",
      number: "VMN-LAUNCH-001",
      dueAt: "2026-12-31",
      amount: null,
      currency: "INR",
      status: "PRICE_PENDING"
    }
  ],
  renewalReminders: [
    { label: "Commercial approval", dueAt: "2026-07-15", status: "REQUIRED" },
    { label: "Renewal confirmation", dueAt: "2026-12-01", status: "SCHEDULED" }
  ],
  paymentProvider: {
    provider: "razorpay",
    mode: "launch-gated",
    checkoutAvailable: false,
    reconciliation: "Webhook reconciliation is deferred until production credentials are approved."
  }
};

function formatAmount(amount: number | null, currency: string) {
  if (amount === null) {
    return "Price pending";
  }

  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function BillingSystemPanel() {
  const [summary, setSummary] = useState<BillingSummary>(fallbackSummary);
  const [message, setMessage] = useState("Loading billing system status.");

  async function refreshBilling() {
    setMessage("Loading billing system status.");
    try {
      const nextSummary = await apiClient<BillingSummary>("/billing/summary");
      setSummary(nextSummary);
      setMessage("Billing system status loaded.");
    } catch (error) {
      setSummary(fallbackSummary);
      setMessage(error instanceof Error ? error.message : "Using local billing fallback.");
    }
  }

  useEffect(() => {
    void refreshBilling();
  }, []);

  return (
    <section className="mb-10 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing & Invoice System</h2>
          <p className="mt-2 text-sm text-ink-muted">{message}</p>
        </div>
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={refreshBilling}>
          Refresh billing
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-md border border-line bg-canvas p-4">
          <p className="text-sm text-ink-muted">Active plan</p>
          <strong className="mt-1 block text-xl">{summary.activePlan.name}</strong>
        </div>
        <div className="rounded-md border border-line bg-canvas p-4">
          <p className="text-sm text-ink-muted">Payment status</p>
          <strong className="mt-1 block text-xl">{summary.activePlan.paymentStatus}</strong>
        </div>
        <div className="rounded-md border border-line bg-canvas p-4">
          <p className="text-sm text-ink-muted">Renewal status</p>
          <strong className="mt-1 block text-xl">{summary.activePlan.renewalStatus}</strong>
        </div>
        <div className="rounded-md border border-line bg-canvas p-4">
          <p className="text-sm text-ink-muted">Next renewal</p>
          <strong className="mt-1 block text-xl">{summary.activePlan.nextRenewalDate.slice(0, 10)}</strong>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
        <div>
          <h3 className="text-lg font-bold">Invoices</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-ink-muted">
                <tr>
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.invoices.map((invoice) => (
                  <tr key={invoice.invoiceId} className="bg-canvas">
                    <td className="rounded-l-md px-3 py-3 font-semibold">{invoice.number}</td>
                    <td className="px-3 py-3">{invoice.dueAt}</td>
                    <td className="px-3 py-3">{formatAmount(invoice.amount, invoice.currency)}</td>
                    <td className="rounded-r-md px-3 py-3">{invoice.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold">Renewal Reminders</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {summary.renewalReminders.map((reminder) => (
              <li key={reminder.label} className="rounded-md border border-line bg-canvas p-3">
                <div className="flex items-center justify-between gap-3">
                  <strong>{reminder.label}</strong>
                  <span>{reminder.status}</span>
                </div>
                <p className="mt-1 text-ink-muted">{reminder.dueAt}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-md border border-line bg-canvas p-3 text-sm text-ink-muted">
            {summary.paymentProvider.provider}: {summary.paymentProvider.mode}. {summary.paymentProvider.reconciliation}
          </p>
        </div>
      </div>
    </section>
  );
}
