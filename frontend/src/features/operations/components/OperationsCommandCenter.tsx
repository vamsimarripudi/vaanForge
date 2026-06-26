"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { operationsApi } from "../services/operationsApi";
import type { OperationsAgentMetric, OperationsCommandAction, OperationsIncident, OperationsMode, OperationsProductMetric } from "../types.operations";

const navItems: Array<[string, string, OperationsMode]> = [
  ["/admin/operations", "Overview", "summary"],
  ["/admin/operations/agents", "Agents", "agents"],
  ["/admin/operations/products", "Products", "products"],
  ["/admin/operations/incidents", "Incidents", "incidents"],
  ["/admin/operations/audit", "Audit", "audit"],
  ["/admin/operations/analytics", "Analytics", "analytics"],
  ["/admin/operations/health", "Health", "health"],
  ["/admin/operations/queues", "Queues", "queues"],
  ["/admin/operations/deployments", "Deployments", "deployments"],
  ["/admin/operations/settings", "Settings", "settings"]
];

export function OperationsCommandCenter({ mode }: { mode: OperationsMode }) {
  const [data, setData] = useState<Record<string, unknown> | unknown[] | null>(null);
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");
  const [message, setMessage] = useState("");
  const loader = useMemo(() => ({
    summary: operationsApi.summary,
    agents: operationsApi.agents,
    products: operationsApi.products,
    incidents: operationsApi.incidents,
    audit: operationsApi.audit,
    analytics: operationsApi.analytics,
    health: operationsApi.health,
    queues: operationsApi.queues,
    deployments: operationsApi.deployments,
    settings: operationsApi.settings
  }), []);

  async function load() {
    setState("loading");
    try {
      const result = await loader[mode]();
      setData(result);
      setState(Array.isArray(result) && !result.length ? "empty" : "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Operations data unavailable.");
      setState("error");
    }
  }

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const result = await loader[mode]();
        if (!mounted) return;
        setData(result);
        setState(Array.isArray(result) && !result.length ? "empty" : "success");
      } catch (error) {
        if (!mounted) return;
        setMessage(error instanceof Error ? error.message : "Operations data unavailable.");
        setState("error");
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [loader, mode]);

  async function runCommand(action: OperationsCommandAction, targetId?: string) {
    const reason = window.prompt(`Reason for ${action}`) || "";
    if (reason.length < 8) return;
    if (!window.confirm(`Confirm ${action}${targetId ? ` for ${targetId}` : ""}? This will be audited.`)) return;
    await operationsApi.command(action, { reason, confirmed: true, targetId, affectedServices: targetId ? ["agent-fleet"] : ["kravia-platform"] });
    await load();
  }

  async function runAgentCommand(agentId: string, action: "enable" | "disable" | "restart" | "drain") {
    const reason = window.prompt(`Reason to ${action} ${agentId}`) || "";
    if (reason.length < 8) return;
    if (!window.confirm(`Confirm ${action} for ${agentId}?`)) return;
    await operationsApi.agentCommand(agentId, action, { reason, confirmed: true });
    await load();
  }

  async function createIncident() {
    const title = window.prompt("Incident title") || "";
    const description = window.prompt("Incident description") || "";
    if (title.length < 4 || description.length < 8) return;
    if (!window.confirm("Create this incident and audit the action?")) return;
    await operationsApi.createIncident({ title, description, severity: "SEV3", ownerId: "operations-admin", priority: "HIGH", impactedProducts: ["VaanForge AI"], nextAction: "Assign owner and start investigation." });
    await load();
  }

  async function resolveIncident(incidentId: string) {
    const resolution = window.prompt("Resolution summary") || "";
    if (resolution.length < 4) return;
    if (!window.confirm(`Resolve incident ${incidentId}?`)) return;
    await operationsApi.updateIncident(incidentId, { status: "resolved", resolution, nextAction: "Prepare postmortem and close follow-up actions." });
    await load();
  }

  const title = titleFor(mode);

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">KRAVIA Operations</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">Operate agent fleets, deployments, incidents, audit trails, customer activity, and business health from live backend state.</p>
        </div>
        <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {navItems.map(([href, label, itemMode]) => (
          <Link key={href} className={`rounded-md border border-line px-3 py-2 hover:bg-muted ${itemMode === mode ? "bg-primary text-white" : "bg-surface"}`} href={href}>{label}</Link>
        ))}
      </nav>

      {state === "error" ? <StatePanel state="error" title="Operations data unavailable" detail={message || "Check admin session, RBAC, and backend operations APIs."} /> : null}
      {state === "empty" ? <StatePanel state="empty" title="No records yet" detail="Create an incident, run an audited command, or generate agent activity to populate this view." /> : null}

      {mode === "summary" ? <SummaryView data={asRecord(data)} onCommand={runCommand} /> : null}
      {mode === "agents" ? <AgentsView data={asRecord(data)} onAgentCommand={runAgentCommand} /> : null}
      {mode === "products" ? <ProductsView data={asRecord(data)} /> : null}
      {mode === "incidents" ? <IncidentsView incidents={Array.isArray(data) ? data as OperationsIncident[] : []} onCreate={createIncident} onResolve={resolveIncident} /> : null}
      {mode === "settings" ? <SettingsView data={asRecord(data)} onCommand={runCommand} /> : null}
      {!["summary", "agents", "products", "incidents", "settings"].includes(mode) ? <JsonPanel title={title} value={data || {}} /> : null}
    </section>
  );
}

function SummaryView({ data, onCommand }: { data: Record<string, unknown>; onCommand: (action: OperationsCommandAction) => void }) {
  return (
    <>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label="System" value={String(data.systemHealth || "unknown")} />
        <Metric label="Agent Runs" value={String(data.activeAgentRuns || 0)} />
        <Metric label="Queue" value={String(data.queueStatus || "unknown")} />
        <Metric label="Deployments" value={String(data.deploymentStatus || "unknown")} />
      </div>
      <Panel title="Command Center">
        <div className="flex flex-wrap gap-2">
          {(["pause_deployments", "pause_agent_generation", "emergency_stop", "resume_services", "maintenance_mode"] as const).map((action) => (
            <button key={action} className="rounded-md border border-line bg-muted px-3 py-2 text-sm font-semibold hover:bg-primary-soft" onClick={() => onCommand(action)}>{labelize(action)}</button>
          ))}
        </div>
      </Panel>
      <JsonPanel title="Live Operations Evidence" value={data} />
    </>
  );
}

function AgentsView({ data, onAgentCommand }: { data: Record<string, unknown>; onAgentCommand: (agentId: string, action: "enable" | "disable" | "restart" | "drain") => void }) {
  const agents = Array.isArray(data.agents) ? data.agents as OperationsAgentMetric[] : [];
  if (!agents.length) return <StatePanel state="empty" title="No agents registered" detail="Agent role setup will populate the fleet manager once roles or active assignments exist." />;
  return <Panel title="AI Fleet Manager">{agents.map((agent) => <div key={agent.agentId} className="rounded-md border border-line bg-muted p-3"><div className="grid gap-2 md:grid-cols-[1fr_0.5fr_0.5fr_0.5fr]"><strong>{agent.agentName}<span className="block font-mono text-xs text-ink-muted">{agent.agentId}</span></strong><span>{agent.status}</span><span>{agent.health}</span><span>{agent.workloadScore}% load</span></div><div className="mt-3 flex flex-wrap gap-2">{(["enable", "disable", "restart", "drain"] as const).map((action) => <button key={action} className="rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold hover:bg-primary-soft" onClick={() => onAgentCommand(agent.agentId, action)}>{action}</button>)}</div></div>)}</Panel>;
}

function ProductsView({ data }: { data: Record<string, unknown> }) {
  const products = Array.isArray(data.products) ? data.products as OperationsProductMetric[] : [];
  return <Panel title="Product Operations">{products.map((product) => <div key={product.product} className="grid gap-2 rounded-md border border-line bg-muted p-3 md:grid-cols-[1fr_0.5fr_0.5fr_0.5fr]"><strong>{product.product}<span className="block text-xs text-ink-muted">{product.region}</span></strong><span>API {product.apiHealth}</span><span>Queue {product.queueHealth}</span><span>{product.deploymentStatus}</span></div>)}</Panel>;
}

function IncidentsView({ incidents, onCreate, onResolve }: { incidents: OperationsIncident[]; onCreate: () => void; onResolve: (incidentId: string) => void }) {
  return <Panel title="Incident Management"><button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={onCreate}>Create incident</button>{incidents.length ? incidents.map((incident) => <div key={incident.incidentId} className="rounded-md border border-line bg-muted p-3"><div className="grid gap-2 md:grid-cols-[1fr_0.4fr_0.5fr]"><strong>{incident.title}<span className="block font-mono text-xs text-ink-muted">{incident.incidentId}</span></strong><span>{incident.severity}</span><span>{incident.status}</span></div><p className="mt-2 text-sm text-ink-muted">{incident.nextAction}</p><button className="mt-3 rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold hover:bg-primary-soft" onClick={() => onResolve(incident.incidentId)}>Resolve</button></div>) : <StatePanel state="empty" title="No incidents" detail="Create incidents from real failures, degraded checks, or customer-impacting events." />}</Panel>;
}

function SettingsView({ data, onCommand }: { data: Record<string, unknown>; onCommand: (action: OperationsCommandAction) => void }) {
  return <><Panel title="Enterprise Controls"><div className="flex flex-wrap gap-2">{(["scheduled_maintenance", "maintenance_mode", "pause_deployments", "pause_agent_generation", "resume_services"] as const).map((action) => <button key={action} className="rounded-md border border-line bg-muted px-3 py-2 text-sm font-semibold hover:bg-primary-soft" onClick={() => onCommand(action)}>{labelize(action)}</button>)}</div></Panel><JsonPanel title="Control State" value={data} /></>;
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return <Panel title={title}><pre className="max-h-[620px] overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(value, null, 2)}</pre></Panel>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid gap-3">{children}</div></section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line bg-surface p-4 shadow-panel"><p className="text-xs font-semibold uppercase text-accent">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>;
}

function titleFor(mode: OperationsMode) {
  return ({ summary: "Enterprise Operations Center", agents: "AI Fleet Manager", products: "Product Operations Dashboard", incidents: "Incident Management", audit: "Audit Center", analytics: "Business Analytics", health: "Enterprise Monitoring", queues: "Queue Operations", deployments: "Deployment Operations", settings: "Command Settings" } as const)[mode];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}
