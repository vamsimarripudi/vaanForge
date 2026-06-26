import Link from "next/link";
import { AppShell } from "@/layouts/AppShell";
import { MetricGrid } from "@/components/MetricGrid";
import { SuiteCards } from "@/features/onboarding/components/SuiteCards";

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">VM nexus Pvt Ltd</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-tight text-ink md:text-6xl">
            VM Nexus Ecosystem OS
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">
            A calm, connected operating system for onboarding, plans, workspaces, finance, support, compliance,
            communication, reports, and growth.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white shadow-panel" href="/onboarding">
              Start onboarding
            </Link>
            <Link className="rounded-md border border-line px-5 py-3 text-sm font-semibold" href="/pricing">
              View suite plans
            </Link>
            <Link className="rounded-md border border-line px-5 py-3 text-sm font-semibold" href="/finance">
              Open finance
            </Link>
            <Link className="rounded-md border border-line px-5 py-3 text-sm font-semibold" href="/operations">
              Open work
            </Link>
            <Link className="rounded-md border border-line px-5 py-3 text-sm font-semibold" href="/hr">
              Open HR
            </Link>
            <Link className="rounded-md border border-line px-5 py-3 text-sm font-semibold" href="/legal">
              Open legal
            </Link>
          </div>
        </div>
        <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <MetricGrid
            metrics={[
              { label: "Suites", value: "2", detail: "Education and VMetron" },
              { label: "Core products", value: "7", detail: "Entitlement controlled" },
              { label: "Phase roadmap", value: "48", detail: "Tracked in docs" },
              { label: "Audit posture", value: "On", detail: "Financial, legal, security actions" }
            ]}
          />
        </div>
      </section>
      <SuiteCards />
    </AppShell>
  );
}
