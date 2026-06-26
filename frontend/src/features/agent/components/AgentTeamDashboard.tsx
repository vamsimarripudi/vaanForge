"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { agentTeamApi } from "../services/agentTeamApi";
import type { AgentRole, AgentTeamSnapshot } from "../types.team";

type Mode = "team" | "roles" | "run" | "handoffs" | "comments" | "conflicts" | "reviews";

export function AgentTeamDashboard({ mode, runId }: { mode: Mode; runId?: string }) {
  const [roles, setRoles] = useState<AgentRole[]>([]);
  const [snapshot, setSnapshot] = useState<AgentTeamSnapshot | null>(null);
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const roleData = await agentTeamApi.roles();
        if (!mounted) return;
        setRoles(roleData);
        if (runId) setSnapshot(await agentTeamApi.runTeam(runId));
        setState(roleData.length || runId ? "success" : "empty");
      } catch {
        if (mounted) setState("error");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [runId]);

  async function assignTeam() {
    if (!runId || !window.confirm("Assign all active specialist agents to this run?")) return;
    setSnapshot(await agentTeamApi.assign(runId));
  }

  async function quickAction(action: "comment" | "conflict" | "review" | "final") {
    if (!runId || !snapshot?.roles.length) return;
    const roleId = snapshot.assignments[0]?.roleId || snapshot.roles[0].roleId;
    if (action === "comment") {
      const message = window.prompt("Agent comment") || "";
      if (!message.trim()) return;
      await agentTeamApi.comment(runId, { roleId, message, visibility: "team" });
    }
    if (action === "conflict") {
      const reason = window.prompt("Conflict reason") || "";
      if (!reason.trim()) return;
      await agentTeamApi.conflict(runId, { raisedByRoleId: roleId, reason, nextAction: "Resolve conflict before final review." });
    }
    if (action === "review") {
      if (!window.confirm("Approve this role review?")) return;
      setSnapshot(await agentTeamApi.review(runId, { roleId, decision: "approved", findings: ["Reviewed against role responsibilities."], nextAction: "Continue final review checklist." }));
      return;
    }
    if (action === "final") {
      const summary = window.prompt("Final reviewer summary") || "";
      if (!summary.trim()) return;
      await agentTeamApi.finalReview(runId, { decision: "approved", summary });
    }
    setSnapshot(await agentTeamApi.runTeam(runId));
  }

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Multi-Agent Team</h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">Specialized VaanForge agents coordinate product, architecture, UI, backend, frontend, QA, security, DevOps, and documentation work with handoffs, reviews, conflicts, and final approval.</p>
        </div>
        <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href="/admin/agent/team">Team</Link>
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href="/admin/agent/team/roles">Roles</Link>
        {runId ? <>
          <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/agent/runs/${runId}/team`}>Run team</Link>
          <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/agent/runs/${runId}/handoffs`}>Handoffs</Link>
          <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/agent/runs/${runId}/comments`}>Comments</Link>
          <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/agent/runs/${runId}/conflicts`}>Conflicts</Link>
          <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/agent/runs/${runId}/reviews`}>Reviews</Link>
        </> : null}
      </nav>

      {state === "error" ? <StatePanel state="error" title="Team data unavailable" detail="Check admin permissions and VaanForge team APIs." /> : null}
      {mode === "team" || mode === "roles" ? <RoleGrid roles={roles} /> : null}
      {runId && snapshot ? (
        <>
          <Panel title="Run Team Controls">
            <div className="flex flex-wrap gap-2">
              <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={assignTeam}>Assign team</button>
              <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={() => quickAction("comment")}>Add comment</button>
              <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={() => quickAction("conflict")}>Log conflict</button>
              <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={() => quickAction("review")}>Approve role review</button>
              <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={() => quickAction("final")}>Final review</button>
            </div>
          </Panel>
          {mode === "run" ? <Assignments snapshot={snapshot} /> : null}
          {mode === "handoffs" ? <JsonList title="Handoffs" items={snapshot.handoffs} /> : null}
          {mode === "comments" ? <JsonList title="Agent Comments" items={snapshot.comments} /> : null}
          {mode === "conflicts" ? <JsonList title="Conflicts" items={snapshot.conflicts} /> : null}
          {mode === "reviews" ? <><JsonList title="Role Reviews" items={snapshot.reviews} /><JsonList title="Final Reviews" items={snapshot.finalReviews} /></> : null}
        </>
      ) : null}
    </section>
  );
}

function RoleGrid({ roles }: { roles: AgentRole[] }) {
  if (!roles.length) return <StatePanel state="empty" title="No agent roles" detail="Open the team API to seed the default VaanForge product-team roles." />;
  return <Panel title="Agent Registry">{roles.map((role) => <Mini key={role.roleId} label={`${role.name} · ${role.status}`} value={`${role.responsibilities.join(", ")}${role.requiredReview ? " · required final review" : ""}`} />)}</Panel>;
}

function Assignments({ snapshot }: { snapshot: AgentTeamSnapshot }) {
  return <Panel title="Assignments">{snapshot.assignments.length ? snapshot.assignments.map((item) => <Mini key={item.assignmentId} label={`${item.status} · v${item.outputVersion}`} value={`${item.scope}. Next: ${item.nextAction}`} />) : <p className="text-sm text-ink-muted">No assignments yet. Assign the team to create primary agent owners.</p>}</Panel>;
}

function JsonList({ title, items }: { title: string; items: Array<Record<string, unknown>> }) {
  return <Panel title={title}>{items.length ? items.map((item, index) => <pre key={String(item.id || item.commentId || item.reviewId || index)} className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(item, null, 2)}</pre>) : <p className="text-sm text-ink-muted">No records yet.</p>}</Panel>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid gap-3">{children}</div></section>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line bg-muted p-3"><p className="text-xs font-semibold uppercase text-accent">{label}</p><p className="mt-1 break-words text-sm text-ink">{value}</p></div>;
}
