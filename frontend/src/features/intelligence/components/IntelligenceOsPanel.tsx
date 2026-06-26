"use client";

import { useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

type IntelligenceOs = {
  explainReports: { summary: string; source: string };
  suggestNextTasks: Array<{ task: string; route: string }>;
  detectRisks: Array<{ risk: string; severity: string }>;
  suggestFollowUps: Array<{ title: string; route: string; reason: string }>;
  draftCommunications: Array<{ title: string; channel: string; draft: string }>;
  summarizeTickets: { open: number; resolved: number; summary: string };
  summarizeInterviews: { candidates: number; interviews: number; summary: string };
  financialAssistant: { revenue: number; expenses: number; netCashFlow: number; suggestion: string };
  salesAssistant: { leads: number; customers: number; expectedPipeline: number; suggestion: string };
  disclaimer: string;
};

const fallbackIntelligenceOs: IntelligenceOs = {
  explainReports: { summary: "Revenue, expenses, gross profit, GST, and cash flow explanations are ready for review.", source: "/api/v1/reports/operating-system" },
  suggestNextTasks: [{ task: "Review operating dashboard and assign the next owner.", route: "/api/v1/tasks" }],
  detectRisks: [{ risk: "Provider configuration is still launch-gated.", severity: "monitor" }],
  suggestFollowUps: [
    { title: "Sales follow-up", route: "/api/v1/crm/sales-operations", reason: "Use lead stage and expected value." },
    { title: "Support follow-up", route: "/api/v1/support/operations", reason: "Use open ticket and SLA state." }
  ],
  draftCommunications: [
    { title: "Customer update", channel: "CUSTOMER_FOLLOW_UP", draft: "We reviewed your workspace status and prepared the next support step." },
    { title: "Founder alert", channel: "ANNOUNCEMENT", draft: "Monthly operating signals are ready for review." }
  ],
  summarizeTickets: { open: 0, resolved: 0, summary: "No ticket pressure detected in fallback mode." },
  summarizeInterviews: { candidates: 0, interviews: 0, summary: "No interview records detected in fallback mode." },
  financialAssistant: { revenue: 0, expenses: 0, netCashFlow: 0, suggestion: "Review founder payout and reserve targets." },
  salesAssistant: { leads: 0, customers: 0, expectedPipeline: 0, suggestion: "Prioritize leads by expected value and next action." },
  disclaimer: "Deterministic assistant output for operating support; review before action."
};

function SectionList<T extends Record<string, string | number>>({ title, records, fields }: { title: string; records: T[]; fields: Array<keyof T> }) {
  return (
    <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
      <h2 className="text-xl font-bold">{title}</h2>
      {records.length ? (
        <div className="mt-4 space-y-3">
          {records.map((record, index) => (
            <article key={`${title}-${index}`} className="rounded-md border border-line bg-canvas p-4 text-sm">
              {fields.map((field) => (
                <div key={String(field)} className="flex justify-between gap-4 border-b border-line py-2 last:border-0">
                  <span className="text-ink-muted">{String(field)}</span>
                  <strong className="text-right">{String(record[field])}</strong>
                </div>
              ))}
            </article>
          ))}
        </div>
      ) : (
        <StatePanel state="empty" title="No records" detail={`${title} will appear after operating data is generated.`} />
      )}
    </section>
  );
}

export function IntelligenceOsPanel() {
  const [intelligenceOs, setIntelligenceOs] = useState<IntelligenceOs>(fallbackIntelligenceOs);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  async function refreshIntelligenceOs() {
    setState("loading");
    try {
      const nextIntelligenceOs = await apiClient<IntelligenceOs>("/intelligence/operating-system");
      setIntelligenceOs(nextIntelligenceOs);
      setState("success");
    } catch {
      setIntelligenceOs(fallbackIntelligenceOs);
      setState("error");
    }
  }

  useEffect(() => {
    void refreshIntelligenceOs();
  }, []);

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Intelligence OS</h1>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Explain reports, suggest next tasks, detect risks, suggest follow-ups, draft communications, summarize tickets, summarize interviews, and assist finance and sales.
          </p>
        </div>
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={refreshIntelligenceOs}>
          Refresh intelligence OS
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-panel border border-line bg-surface p-5 shadow-panel lg:col-span-2">
          <h2 className="text-xl font-bold">Explain Reports</h2>
          <p className="mt-3 text-sm text-ink-muted">{intelligenceOs.explainReports.summary}</p>
          <p className="mt-2 text-xs font-semibold text-accent">{intelligenceOs.explainReports.source}</p>
        </section>
        <SectionList title="Suggest Next Tasks" records={intelligenceOs.suggestNextTasks} fields={["task", "route"]} />
        <SectionList title="Detect Risks" records={intelligenceOs.detectRisks} fields={["risk", "severity"]} />
        <SectionList title="Suggest Follow-ups" records={intelligenceOs.suggestFollowUps} fields={["title", "route", "reason"]} />
        <SectionList title="Draft Communications" records={intelligenceOs.draftCommunications} fields={["title", "channel", "draft"]} />
        <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Summarize Tickets</h2>
          <p className="mt-3 text-sm text-ink-muted">{intelligenceOs.summarizeTickets.summary}</p>
          <p className="mt-2 text-sm font-semibold">Open {intelligenceOs.summarizeTickets.open} / Resolved {intelligenceOs.summarizeTickets.resolved}</p>
        </section>
        <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Summarize Interviews</h2>
          <p className="mt-3 text-sm text-ink-muted">{intelligenceOs.summarizeInterviews.summary}</p>
          <p className="mt-2 text-sm font-semibold">Candidates {intelligenceOs.summarizeInterviews.candidates} / Interviews {intelligenceOs.summarizeInterviews.interviews}</p>
        </section>
        <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Financial Assistant</h2>
          <p className="mt-3 text-sm text-ink-muted">{intelligenceOs.financialAssistant.suggestion}</p>
          <p className="mt-2 text-sm font-semibold">Revenue {intelligenceOs.financialAssistant.revenue} / Cash flow {intelligenceOs.financialAssistant.netCashFlow}</p>
        </section>
        <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Sales Assistant</h2>
          <p className="mt-3 text-sm text-ink-muted">{intelligenceOs.salesAssistant.suggestion}</p>
          <p className="mt-2 text-sm font-semibold">Leads {intelligenceOs.salesAssistant.leads} / Pipeline {intelligenceOs.salesAssistant.expectedPipeline}</p>
        </section>
      </div>

      <div className="mt-6">
        <StatePanel state={state === "success" ? "success" : state === "error" ? "error" : "loading"} title="Intelligence operating system" detail={intelligenceOs.disclaimer} />
      </div>
    </section>
  );
}
