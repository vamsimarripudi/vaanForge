import { AppShell } from "@/layouts/AppShell";

export default function HelpPage() {
  return (
    <AppShell>
      <section className="py-8">
        <h1 className="text-4xl font-bold">Help Center</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-muted">Support starts with ticket-backed workflows, SLA priority, billing escalation, and enterprise audit history. Use the support module for operational tickets and account issues.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Getting started", "Billing issues", "Blueprint review", "Deployment readiness", "Security review", "Data requests"].map((item) => <div key={item} className="rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="font-bold">{item}</h2><p className="mt-2 text-sm text-ink-muted">Create a support ticket with owner, priority, due date, activity history, and next action.</p></div>)}
        </div>
      </section>
    </AppShell>
  );
}
