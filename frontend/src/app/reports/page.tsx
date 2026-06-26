"use client";

import { useEffect, useState, useTransition } from "react";
import { StatePanel } from "@/components/StatePanel";
import { apiClient, API_BASE_URL } from "@/services/apiClient";
import { AppShell } from "@/layouts/AppShell";

type ReportExport = {
  id: string;
  reportType: string;
  format: string;
  status: string;
  fileName: string;
  storageProvider?: string;
  storageUrl?: string;
};

type ReportsOs = {
  reportCatalog: Array<{ reportType: string; label: string; source: string }>;
  downloadFormats: Array<{ format: string; label: string; route: string }>;
  suiteSeparation: {
    education: string[];
    vmetron: string[];
    founderCombined: string[];
  };
};

const reportGroups = [
  {
    title: "Education Suite Reports",
    items: ["Institution activity", "Meetings", "Forms", "Support", "Subscription usage"]
  },
  {
    title: "VMetron Suite Reports",
    items: ["Events", "Registrations", "Meetings", "Forms", "Promotions", "Support"]
  },
  {
    title: "Founder Combined Reports",
    items: ["Revenue", "Usage", "Support", "Compliance", "Monthly founder report"]
  }
];

const fallbackReportsOs: ReportsOs = {
  reportCatalog: [
    { reportType: "PNL", label: "P&L report", source: "/api/v1/finance/pnl" },
    { reportType: "GST", label: "GST report", source: "/api/v1/finance/gst" },
    { reportType: "CASH_FLOW", label: "Cash flow report", source: "/api/v1/finance/cash-flow" },
    { reportType: "SALES", label: "Sales report", source: "/api/v1/crm/sales-operations" },
    { reportType: "HIRING", label: "Hiring report", source: "/api/v1/hr/team-operations" },
    { reportType: "SUPPORT", label: "Support report", source: "/api/v1/support/operations" },
    { reportType: "COMPLIANCE", label: "Compliance report", source: "/api/v1/compliance/operating-system" },
    { reportType: "FOUNDER_MONTHLY", label: "Founder monthly report", source: "/api/v1/dashboard/founder" }
  ],
  downloadFormats: [
    { format: "EXCEL", label: "Excel download", route: "/api/v1/reports/exports" },
    { format: "PDF", label: "PDF download", route: "/api/v1/reports/exports" }
  ],
  suiteSeparation: {
    education: ["Institution activity", "Meetings", "Forms", "Support", "Subscription usage"],
    vmetron: ["Events", "Registrations", "Meetings", "Forms", "Promotions", "Support"],
    founderCombined: ["Revenue", "Usage", "Support", "Compliance", "Monthly founder report"]
  }
};

export default function ReportsPage() {
  const [exports, setExports] = useState<ReportExport[]>([]);
  const [reportsOs, setReportsOs] = useState<ReportsOs>(fallbackReportsOs);
  const [status, setStatus] = useState<"loading" | "empty" | "error" | "success">("loading");
  const [message, setMessage] = useState("Loading report exports.");
  const [isPending, startTransition] = useTransition();

  async function refreshExports() {
    try {
      const nextExports = await apiClient<ReportExport[]>("/reports/exports");
      setExports(nextExports);
      setStatus(nextExports.length ? "success" : "empty");
      setMessage(nextExports.length ? "Reports are ready for download." : "No report exports have been queued yet.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load report exports.");
    }
  }

  useEffect(() => {
    void refreshExports();
  }, []);

  async function refreshReportsOs() {
    try {
      const nextReportsOs = await apiClient<ReportsOs>("/reports/operating-system");
      setReportsOs(nextReportsOs);
    } catch {
      setReportsOs(fallbackReportsOs);
    }
  }

  useEffect(() => {
    void refreshReportsOs();
  }, []);

  function queueExport(formData: FormData) {
    startTransition(async () => {
      try {
        const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
        await apiClient<ReportExport>("/reports/exports", {
          method: "POST",
          headers: { "x-csrf-token": csrf.csrfToken },
          body: JSON.stringify({
            reportType: formData.get("reportType"),
            format: formData.get("format")
          })
        });
        await refreshExports();
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to queue report export.");
      }
    });
  }

  return (
    <AppShell>
      <section className="py-8">
        <h1 className="text-4xl font-bold">Reports</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Reports are separated by suite, while founder and admin roles can view combined operating summaries.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {reportGroups.map((group) => (
            <article key={group.title} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
              <h2 className="text-xl font-bold">{group.title}</h2>
              <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Reports OS</h2>
              <p className="mt-2 text-sm text-ink-muted">P&L, GST, cash flow, sales, hiring, support, compliance, founder monthly, Excel, and PDF report coverage.</p>
            </div>
            <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" type="button" onClick={refreshReportsOs}>
              Refresh reports OS
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {reportsOs.reportCatalog.map((report) => (
              <article key={report.reportType} className="rounded-md border border-line bg-canvas p-4 text-sm">
                <h3 className="font-semibold">{report.label}</h3>
                <p className="mt-2 text-ink-muted">{report.source}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {reportsOs.downloadFormats.map((format) => (
              <span key={format.format} className="rounded-md border border-line bg-canvas px-3 py-2 font-semibold">
                {format.label}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <form action={queueExport} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
            <h2 className="text-xl font-bold">Queue Export</h2>
            <label className="mt-4 block text-sm font-semibold" htmlFor="reportType">
              Report
            </label>
            <select id="reportType" name="reportType" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm">
              <option value="PNL">P&L</option>
              <option value="GST">GST</option>
              <option value="CASH_FLOW">Cash flow</option>
              <option value="SALES">Sales</option>
              <option value="HIRING">Hiring</option>
              <option value="SUPPORT">Support</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="FOUNDER_MONTHLY">Founder monthly</option>
            </select>
            <label className="mt-4 block text-sm font-semibold" htmlFor="format">
              Format
            </label>
            <select id="format" name="format" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm">
              <option value="EXCEL">CSV</option>
              <option value="PDF">Printable HTML</option>
            </select>
            <button disabled={isPending} className="mt-5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" type="submit">
              {isPending ? "Queuing..." : "Queue export"}
            </button>
          </form>

          <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Export Queue</h2>
                <p className="mt-2 text-sm text-ink-muted">{message}</p>
              </div>
              <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" type="button" onClick={refreshExports}>
                Refresh
              </button>
            </div>
            <div className="mt-4">
              <StatePanel state={status} title="Reports API" detail="Exports are protected by reports:export permission and generated through the backend reports module." />
            </div>
            {exports.length > 0 ? (
              <ul className="mt-4 divide-y divide-line">
                {exports.map((item) => (
                  <li key={item.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{item.fileName}</p>
                      <p className="text-sm text-ink-muted">
                        {item.reportType} · {item.format} · {item.status} · {item.storageProvider ?? "storage pending"}
                      </p>
                    </div>
                    <a className="text-sm font-semibold text-brand" href={`${API_BASE_URL}/reports/exports/${item.id}/download`}>
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
