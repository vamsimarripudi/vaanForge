"use client";

import { useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

type CreatorPortal = {
  campaigns: Array<{ id: string; title: string; status: string; budget: number; creatorId: string }>;
  billing: { status: string; pendingCreators: number; handoffRoute: string };
  contentIdeas: Array<{ title: string; channel: string; linkedGoal: string }>;
  conceptSharing: Array<{ campaignId: string; title: string; status: string; workspace: string }>;
  approvalFlow: Array<{ campaignId: string; step: string; status: string; route: string }>;
  brandGuidelines: Array<{ section: string; rule: string }>;
  payouts: Array<{ creatorId: string; name: string; payoutStatus: string; financeRoute: string }>;
  performanceTracking: { trackingMode: string; signals: string[]; reportRoute: string };
};

const fallbackPortal: CreatorPortal = {
  campaigns: [],
  billing: { status: "PAYOUT_REVIEW_REQUIRED", pendingCreators: 0, handoffRoute: "/api/v1/billing/summary" },
  contentIdeas: [
    { title: "Founder story reel", channel: "Instagram", linkedGoal: "trust building" },
    { title: "Product proof walkthrough", channel: "LinkedIn", linkedGoal: "qualified leads" },
    { title: "Customer outcome carousel", channel: "WhatsApp", linkedGoal: "renewal confidence" }
  ],
  conceptSharing: [{ campaignId: "template", title: "Launch concept", status: "CONCEPT_SHARED", workspace: "Creator concept room" }],
  approvalFlow: [{ campaignId: "template", step: "Founder approval", status: "READY", route: "/api/v1/creators/campaigns" }],
  brandGuidelines: [
    { section: "Tone", rule: "Clear, useful, non-hype product education." },
    { section: "Visuals", rule: "Use approved logo, product screenshots, and accessible contrast." },
    { section: "Disclosure", rule: "Mark paid collaborations and avoid legal or financial promises." }
  ],
  payouts: [],
  performanceTracking: {
    trackingMode: "launch-gated",
    signals: ["reach", "engagement", "leads", "conversions", "creator ROI"],
    reportRoute: "/api/v1/creators/promotions"
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
        <StatePanel state="empty" title="No records" detail={`${title} will appear after creator campaigns are added.`} />
      )}
    </section>
  );
}

export function CreatorPortalPanel() {
  const [portal, setPortal] = useState<CreatorPortal>(fallbackPortal);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  async function refreshCreatorPortal() {
    setState("loading");
    try {
      const nextPortal = await apiClient<CreatorPortal>("/creators/creator-portal");
      setPortal(nextPortal);
      setState("success");
    } catch {
      setPortal(fallbackPortal);
      setState("error");
    }
  }

  useEffect(() => {
    void refreshCreatorPortal();
  }, []);

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Creator Portal OS</h1>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Campaigns, creator billing, content ideas, concept sharing, approval flow, brand guidelines, payouts, and performance tracking.
          </p>
        </div>
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={refreshCreatorPortal}>
          Refresh creator portal
        </button>
      </div>

      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <MetricGrid
          metrics={[
            { label: "Campaigns", value: String(portal.campaigns.length), detail: "Creator campaigns" },
            { label: "Creator Billing", value: portal.billing.status, detail: portal.billing.handoffRoute },
            { label: "Content Ideas", value: String(portal.contentIdeas.length), detail: "Ready prompts" },
            { label: "Approval Flow", value: String(portal.approvalFlow.length), detail: "Review steps" },
            { label: "Payouts", value: String(portal.billing.pendingCreators), detail: "Pending creators" },
            { label: "Performance Tracking", value: portal.performanceTracking.trackingMode, detail: portal.performanceTracking.reportRoute }
          ]}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SectionList title="Campaigns" records={portal.campaigns} fields={["title", "status", "budget", "creatorId"]} />
        <SectionList title="Content Ideas" records={portal.contentIdeas} fields={["title", "channel", "linkedGoal"]} />
        <SectionList title="Concept Sharing" records={portal.conceptSharing} fields={["title", "status", "workspace"]} />
        <SectionList title="Approval Flow" records={portal.approvalFlow} fields={["step", "status", "route"]} />
        <SectionList title="Brand Guidelines" records={portal.brandGuidelines} fields={["section", "rule"]} />
        <SectionList title="Payouts" records={portal.payouts} fields={["name", "payoutStatus", "financeRoute"]} />
        <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Performance Tracking</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {portal.performanceTracking.signals.map((signal) => (
              <span key={signal} className="rounded-md border border-line bg-canvas px-3 py-2 font-semibold">
                {signal}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <StatePanel state={state === "success" ? "success" : state === "error" ? "error" : "loading"} title="Creator portal" detail="Creator Portal OS records are available." />
      </div>
    </section>
  );
}
