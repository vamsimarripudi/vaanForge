import Link from "next/link";
import { AppShell } from "@/layouts/AppShell";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";

const clientWorkflows = [
  { title: "Projects", detail: "Client-linked projects and work allocation.", href: "/operations" },
  { title: "Proposals", detail: "Proposal tracking through CRM and sales workflows.", href: "/crm" },
  { title: "Agreements", detail: "Client agreements and document status.", href: "/legal" },
  { title: "Meetings", detail: "VaanMeet placeholders for client calls.", href: "/interviews" },
  { title: "Deliverables", detail: "Project tasks, due dates, owners, and status.", href: "/operations" },
  { title: "Invoices", detail: "Billing and invoice foundations for client work.", href: "/billing" },
  { title: "Documents", detail: "Document OS metadata for client files.", href: "/settings" },
  { title: "Support", detail: "Support tickets, messages, SLA, and escalation.", href: "/support" }
];

export default function ClientPortalPage() {
  return (
    <AppShell>
      <section className="py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Client Portal</h1>
            <p className="mt-3 max-w-2xl text-ink-muted">
              Projects, proposals, agreements, meetings, deliverables, invoices, support, and document handoff for client-facing work.
            </p>
          </div>
          <Link className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" href="/crm">
            Open CRM
          </Link>
        </div>
        <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
          <MetricGrid
            metrics={[
              { label: "Projects", value: "Ready", detail: "Operations module linked" },
              { label: "Proposals", value: "Ready", detail: "CRM sales flow linked" },
              { label: "Agreements", value: "Ready", detail: "Legal workflow linked" },
              { label: "Meetings", value: "Gated", detail: "VaanMeet placeholder" },
              { label: "Invoices", value: "Foundation", detail: "Billing model and route linked" },
              { label: "Support", value: "Ready", detail: "Ticketing and SLA linked" }
            ]}
          />
        </div>
        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {clientWorkflows.map((workflow) => (
            <Link key={workflow.title} href={workflow.href} className="rounded-panel border border-line bg-surface p-5 shadow-panel hover:border-accent">
              <h2 className="text-xl font-bold">{workflow.title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-muted">{workflow.detail}</p>
            </Link>
          ))}
        </section>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatePanel state="loading" title="Loading clients" detail="Shown while client portal data loads." />
          <StatePanel state="empty" title="No clients" detail="Shown before client records exist." />
          <StatePanel state="error" title="Client error" detail="Shown when client portal APIs fail." />
          <StatePanel state="success" title="Client ready" detail="Client workflows are connected across the ecosystem." />
        </div>
      </section>
    </AppShell>
  );
}
