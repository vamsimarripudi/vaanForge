import { AppShell } from "@/layouts/AppShell";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";

const planningAreas = [
  { title: "Ideas", detail: "Capture business ideas, product hypotheses, and founder notes before converting them into goals." },
  { title: "Goals", detail: "Track company, suite, module, and team goals across active planning periods." },
  { title: "OKRs", detail: "Connect objectives and measurable key results to operating dashboards and reports." },
  { title: "Roadmaps", detail: "Plan module delivery, product launches, and long-range suite growth." },
  { title: "Business model", detail: "Document offers, pricing assumptions, customer segments, channels, costs, and revenue logic." },
  { title: "Launch plan", detail: "Coordinate checklist items, provider readiness, domain setup, deployment, QA, and production sign-off." },
  { title: "Daily notes", detail: "Preserve implementation context through the daily note files required by the source PDF." },
  { title: "Reviews", detail: "Prepare weekly and monthly reviews from reports, finance, support, hiring, compliance, and audit signals." }
];

export default function PlanningPage() {
  return (
    <AppShell>
      <section className="py-8">
        <h1 className="text-4xl font-bold">Business Planning OS</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Planning workspace for ideas, goals, OKRs, roadmaps, business model, launch plan, daily notes, weekly reviews, and monthly reviews.
        </p>
        <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
          <MetricGrid
            metrics={[
              { label: "Planning areas", value: String(planningAreas.length), detail: "Source-PDF planning scope" },
              { label: "Cadence", value: "Daily", detail: "Daily notes and reviews" },
              { label: "Launch", value: "Tracked", detail: "Checklist and readiness linked" },
              { label: "Evidence", value: "Docs", detail: "Docs and reports preserve context" }
            ]}
          />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {planningAreas.map((area) => (
            <section key={area.title} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
              <h2 className="text-xl font-bold">{area.title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-muted">{area.detail}</p>
            </section>
          ))}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatePanel state="loading" title="Loading planning" detail="Shown while planning records load." />
          <StatePanel state="empty" title="No planning records" detail="Shown before ideas, goals, or reviews exist." />
          <StatePanel state="error" title="Planning error" detail="Shown when planning APIs or docs fail." />
          <StatePanel state="success" title="Planning ready" detail="Planning surfaces are available for founder review." />
        </div>
      </section>
    </AppShell>
  );
}
