"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { agentDeploymentApi } from "../services/agentDeploymentApi";
import type { AgentDeployment } from "../types.deployment";

type Mode = "list" | "new" | "detail" | "logs" | "rollback" | "run";

const defaultPayload = {
  runId: "",
  targetType: "DOCKER_SERVER",
  targetName: "Docker Server",
  environment: "staging",
  ownerId: "admin",
  priority: "HIGH",
  requiredEnvVars: [],
  confirmedProduction: false,
  config: { migrationsApplied: true, healthCheckUrl: "local://agent-run" }
};

export function AgentDeploymentDashboard({ mode, deploymentId, runId }: { mode: Mode; deploymentId?: string; runId?: string }) {
  const [deployments, setDeployments] = useState<AgentDeployment[]>([]);
  const [detail, setDetail] = useState<AgentDeployment | null>(null);
  const [payload, setPayload] = useState(JSON.stringify(runId ? { ...defaultPayload, runId } : defaultPayload, null, 2));
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const list = runId ? await agentDeploymentApi.runDeployments(runId) : await agentDeploymentApi.list();
        if (!mounted) return;
        setDeployments(list);
        if (deploymentId) setDetail(await agentDeploymentApi.detail(deploymentId));
        setState(list.length || deploymentId || mode === "new" ? "success" : "empty");
      } catch {
        if (mounted) setState("error");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [deploymentId, mode, runId]);

  async function createDeployment() {
    if (!window.confirm("Create deployment draft from this release configuration?")) return;
    const created = await agentDeploymentApi.create(JSON.parse(payload) as Record<string, unknown>);
    setDetail(created);
    setDeployments((items) => [created, ...items]);
  }

  async function action(name: "prepare" | "deploy" | "verify" | "rollback") {
    if (!detail) return;
    const signature = window.prompt(`Signed ${name} token for ${detail.deploymentId}`);
    if (!signature) return;
    const reason = name === "rollback" ? window.prompt("Rollback reason") || "Manual rollback requested." : undefined;
    if (!window.confirm(`Confirm ${name} for ${detail.deploymentId}?`)) return;
    setDetail(await agentDeploymentApi.action(detail.deploymentId, name, { signature, reason, confirmedProduction: detail.environment === "production" }));
  }

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Deployment Agent</h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">Prepare, verify, deploy, monitor, and roll back VaanForge-generated applications with release records, readiness gates, health checks, and masked logs.</p>
        </div>
        <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href="/admin/agent/deployments">Deployments</Link>
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href="/admin/agent/deployments/new">New</Link>
        {detail ? <>
          <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/agent/deployments/${detail.deploymentId}`}>Detail</Link>
          <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/agent/deployments/${detail.deploymentId}/logs`}>Logs</Link>
          <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/agent/deployments/${detail.deploymentId}/rollback`}>Rollback</Link>
        </> : null}
      </nav>

      {state === "error" ? <StatePanel state="error" title="Deployment data unavailable" detail="Check admin permissions and deployment APIs." /> : null}
      {mode === "new" ? <Panel title="New Deployment"><textarea className="min-h-96 rounded-md border border-line bg-canvas p-3 font-mono text-xs" value={payload} onChange={(event) => setPayload(event.target.value)} /><button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={createDeployment}>Create draft</button></Panel> : null}
      {mode === "list" || mode === "run" ? <DeploymentList deployments={deployments} /> : null}
      {detail ? <DeploymentDetail deployment={detail} mode={mode} onAction={action} /> : null}
    </section>
  );
}

function DeploymentList({ deployments }: { deployments: AgentDeployment[] }) {
  if (!deployments.length) return <StatePanel state="empty" title="No deployments" detail="Create a deployment draft after a VaanForge run is completed and reviewed." />;
  return <Panel title="Deployment Pipeline">{deployments.map((deployment) => <Link key={deployment.deploymentId} href={`/admin/agent/deployments/${deployment.deploymentId}`} className="grid gap-2 rounded-md border border-line bg-muted p-3 hover:bg-primary-soft md:grid-cols-[1fr_0.5fr_1fr]"><strong>{deployment.deploymentId}<span className="block text-xs text-ink-muted">{deployment.runId}</span></strong><span>{deployment.status}</span><span>{deployment.nextAction}</span></Link>)}</Panel>;
}

function DeploymentDetail({ deployment, mode, onAction }: { deployment: AgentDeployment; mode: Mode; onAction: (name: "prepare" | "deploy" | "verify" | "rollback") => void }) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1fr]">
      <Panel title="Release Control">
        <Mini label="Deployment" value={deployment.deploymentId} />
        <Mini label="Status" value={deployment.status} />
        <Mini label="Release" value={deployment.releaseId} />
        <Mini label="Next action" value={deployment.nextAction} />
        {deployment.errorMessage ? <Mini label="Failure" value={deployment.errorMessage} /> : null}
        <div className="flex flex-wrap gap-2">
          {(["prepare", "deploy", "verify", "rollback"] as const).map((name) => <button key={name} className="rounded-md border border-line bg-muted px-3 py-2 text-sm font-semibold hover:bg-primary-soft" onClick={() => onAction(name)}>{name}</button>)}
        </div>
      </Panel>
      <Panel title={mode === "logs" ? "Deployment Logs" : mode === "rollback" ? "Rollback Metadata" : "Readiness Evidence"}>
        <Json title="Target" value={deployment.target || {}} />
        <Json title="Checks" value={deployment.checks || []} />
        <Json title="Releases" value={deployment.releases || []} />
        <Json title="Rollbacks" value={deployment.rollbacks || []} />
        <Json title="Health" value={deployment.healthChecks || []} />
        <Json title="Logs" value={deployment.logs || []} />
      </Panel>
    </section>
  );
}

function Json({ title, value }: { title: string; value: unknown }) {
  return <div><p className="text-xs font-semibold uppercase text-accent">{title}</p><pre className="mt-2 max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(value, null, 2)}</pre></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid gap-3">{children}</div></section>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line bg-muted p-3"><p className="text-xs font-semibold uppercase text-accent">{label}</p><p className="mt-1 break-words text-sm text-ink">{value}</p></div>;
}
