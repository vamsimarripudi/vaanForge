import { AppShell } from "@/layouts/AppShell";

export default function DocsPage() {
  return (
    <AppShell>
      <section className="py-8">
        <h1 className="text-4xl font-bold">VaanForge Docs</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-muted">Production guidance for builder projects, templates, approvals, billing limits, security reviews, deployments, memory, and enterprise launch controls.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Builder portal", "Billing and credits", "Security and compliance", "Deployment and rollback", "Data export and deletion", "Support and SLA"].map((item) => <div key={item} className="rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="font-bold">{item}</h2><p className="mt-2 text-sm text-ink-muted">Open the matching dashboard to view live evidence and next actions.</p></div>)}
        </div>
      </section>
    </AppShell>
  );
}
