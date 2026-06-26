"use client";

import { useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { AppShell } from "@/layouts/AppShell";
import { apiClient } from "@/services/apiClient";

type PromotionsSummary = {
  metrics: {
    campaigns: number;
    socialPosts: number;
    creatorCollaborations: number;
    approvals: number;
    budget: number;
    performanceScore: number;
  };
  campaigns: Array<{ id: string; title: string; status: string; budget: number; performance: string }>;
  socialPosts: Array<{ channel: string; format: string; status: string; linkedCampaign: string }>;
  creatorCollaborations: Array<{ id: string; name: string; niche: string; payoutStatus: string; guidelines: string }>;
  approvalQueue: Array<{ id: string; title: string; owner: string; nextStep: string }>;
  contentCalendar: Array<{ date: string; item: string; channel: string; status: string }>;
  performance: { trackingMode: string; signals: string[]; summary: string };
};

const fallbackSummary: PromotionsSummary = {
  metrics: {
    campaigns: 0,
    socialPosts: 6,
    creatorCollaborations: 0,
    approvals: 0,
    budget: 0,
    performanceScore: 60
  },
  campaigns: [],
  socialPosts: [
    { channel: "Instagram", format: "Reel", status: "DRAFT", linkedCampaign: "Launch awareness" },
    { channel: "LinkedIn", format: "Founder update", status: "SCHEDULED", linkedCampaign: "Product trust" },
    { channel: "WhatsApp", format: "Community broadcast", status: "APPROVAL_REQUIRED", linkedCampaign: "Event reminder" }
  ],
  creatorCollaborations: [],
  approvalQueue: [],
  contentCalendar: [
    { date: "2026-06-24", item: "Campaign concept review", channel: "Internal", status: "SCHEDULED" },
    { date: "2026-06-28", item: "Creator collaboration post", channel: "Instagram", status: "DRAFT" },
    { date: "2026-07-02", item: "Performance review", channel: "Dashboard", status: "PLANNED" }
  ],
  performance: {
    trackingMode: "launch-gated",
    signals: ["reach", "engagement", "leads", "conversions", "creator ROI"],
    summary: "Performance analytics are ready for provider connection; local mode uses campaign status and budget signals."
  }
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
        <StatePanel state="empty" title="No records" detail={`${title} will appear after campaigns and creators are added.`} />
      )}
    </section>
  );
}

export default function MarketingPage() {
  const [summary, setSummary] = useState<PromotionsSummary>(fallbackSummary);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  async function refreshPromotions() {
    setState("loading");
    try {
      const nextSummary = await apiClient<PromotionsSummary>("/creators/promotions");
      setSummary(nextSummary);
      setState("success");
    } catch {
      setSummary(fallbackSummary);
      setState("error");
    }
  }

  useEffect(() => {
    void refreshPromotions();
  }, []);

  return (
    <AppShell>
      <section className="py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Promotions & Marketing OS</h1>
            <p className="mt-3 max-w-2xl text-ink-muted">
              Campaign planning, social posts, creator collaborations, approvals, budget tracking, performance signals, and content calendar.
            </p>
          </div>
          <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={refreshPromotions}>
            Refresh promotions
          </button>
        </div>

        <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
          <MetricGrid
            metrics={[
              { label: "Campaigns", value: String(summary.metrics.campaigns), detail: "Marketing campaigns" },
              { label: "Social posts", value: String(summary.metrics.socialPosts), detail: "Planned posts" },
              { label: "Creators", value: String(summary.metrics.creatorCollaborations), detail: "Collaborations" },
              { label: "Approvals", value: String(summary.metrics.approvals), detail: "Needs review" },
              { label: "Budget", value: String(summary.metrics.budget), detail: "Campaign budget" },
              { label: "Performance", value: `${summary.metrics.performanceScore}%`, detail: summary.performance.trackingMode }
            ]}
          />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <SectionList title="Campaigns" records={summary.campaigns} fields={["title", "status", "budget", "performance"]} />
          <SectionList title="Social Posts" records={summary.socialPosts} fields={["channel", "format", "status", "linkedCampaign"]} />
          <SectionList title="Creator Collaborations" records={summary.creatorCollaborations} fields={["name", "niche", "payoutStatus", "guidelines"]} />
          <SectionList title="Approval Queue" records={summary.approvalQueue} fields={["title", "owner", "nextStep"]} />
          <SectionList title="Content Calendar" records={summary.contentCalendar} fields={["date", "item", "channel", "status"]} />
          <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
            <h2 className="text-xl font-bold">Performance Tracking</h2>
            <p className="mt-3 text-sm text-ink-muted">{summary.performance.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {summary.performance.signals.map((signal) => (
                <span key={signal} className="rounded-md border border-line bg-canvas px-3 py-2 font-semibold">
                  {signal}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6">
          <StatePanel state={state === "success" ? "success" : state === "error" ? "error" : "loading"} title="Marketing system" detail="Promotions and marketing operations are available." />
        </div>
      </section>
    </AppShell>
  );
}
