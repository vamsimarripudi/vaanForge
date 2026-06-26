"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { agentWorkspaceApi } from "../services/agentWorkspaceApi";
import type { AgentRunListItem } from "../types";
import type { AgentLiveEvent, AgentWorkspaceInstruction, AgentWorkspaceSnapshot } from "../types.workspace";

type Mode = "overview" | "workspace" | "live" | "evidence" | "instructions";

export function AgentWorkspace({ mode, runId }: { mode: Mode; runId?: string }) {
  const [runs, setRuns] = useState<AgentRunListItem[]>([]);
  const [snapshot, setSnapshot] = useState<AgentWorkspaceSnapshot | null>(null);
  const [events, setEvents] = useState<AgentLiveEvent[]>([]);
  const [instructionType, setInstructionType] = useState<AgentWorkspaceInstruction["instructionType"]>("extra");
  const [instruction, setInstruction] = useState("");
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const overview = await agentWorkspaceApi.overview();
        if (!mounted) return;
        setRuns(overview);
        if (runId) {
          const data = await agentWorkspaceApi.workspace(runId);
          if (!mounted) return;
          setSnapshot(data);
          setEvents(data.liveEvents);
        }
        setState(overview.length || runId ? "success" : "empty");
      } catch {
        if (mounted) setState("error");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [runId]);

  useEffect(() => {
    if (!runId || mode !== "live") return;
    const source = new EventSource(agentWorkspaceApi.liveUrl(runId), { withCredentials: true });
    source.onmessage = (event) => appendEvent(JSON.parse(event.data) as AgentLiveEvent);
    for (const eventName of ["agent.run.started", "agent.run.updated", "agent.task.started", "agent.task.progress", "agent.task.completed", "agent.task.failed", "agent.validation.completed", "agent.validation.failed", "agent.repair.completed", "agent.approval.required", "agent.run.completed", "agent.run.failed", "agent.run.blocked"]) {
      source.addEventListener(eventName, (event) => appendEvent(JSON.parse((event as MessageEvent).data) as AgentLiveEvent));
    }
    return () => source.close();
  }, [mode, runId]);

  const metrics = useMemo(() => {
    const tasks = snapshot?.tasks || [];
    const validations = snapshot?.validations || [];
    const errors = snapshot?.errors || [];
    return [
      { label: "Tasks", value: String(tasks.length), detail: `${tasks.filter((task) => task.status === "completed").length} completed` },
      { label: "Validations", value: String(validations.length), detail: `${validations.filter((item) => item.status === "passed").length} passed` },
      { label: "Errors", value: String(errors.length), detail: `${errors.filter((item) => item.status === "open").length} open` },
      { label: "Approvals", value: String(snapshot?.approvals.length || 0), detail: "Step decisions" }
    ];
  }, [snapshot]);

  function appendEvent(event: AgentLiveEvent) {
    setEvents((current) => (current.some((item) => item.eventId === event.eventId) ? current : [...current, event]));
  }

  async function control(action: "pause" | "resume" | "stop" | "approve-step" | "reject-step" | "regenerate") {
    if (!runId) return;
    const reason = ["pause", "stop", "reject-step", "regenerate"].includes(action) ? window.prompt(`Reason for ${action}`) || "" : "";
    if (["pause", "stop", "reject-step", "regenerate"].includes(action) && !reason.trim()) return;
    if (!window.confirm(`Confirm ${action} for ${runId}?`)) return;
    setSnapshot(await agentWorkspaceApi.control(runId, action, { reason, stepId: snapshot?.activeTask?.taskId || snapshot?.logs[0]?.step }));
  }

  async function addInstruction() {
    if (!runId || !instruction.trim() || !window.confirm("Pause run and apply this instruction?")) return;
    await agentWorkspaceApi.addInstruction(runId, { instructionType, content: instruction });
    setInstruction("");
    setSnapshot(await agentWorkspaceApi.workspace(runId));
  }

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Live Agent Workspace</h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">Watch VaanForge think, plan, code, validate, repair, and request approval from one command-center interface.</p>
        </div>
        <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/agent/workspace" className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted">Workspace</Link>
        {runId ? <>
          <Link href={`/admin/agent/workspace/${runId}`} className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted">Run</Link>
          <Link href={`/admin/agent/workspace/${runId}/live`} className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted">Live</Link>
          <Link href={`/admin/agent/workspace/${runId}/evidence`} className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted">Evidence</Link>
          <Link href={`/admin/agent/workspace/${runId}/instructions`} className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted">Instructions</Link>
        </> : null}
      </nav>

      {state === "error" ? <StatePanel state="error" title="Workspace unavailable" detail="Check admin permissions and the live workspace APIs." /> : null}
      {mode === "overview" ? <RunPicker runs={runs} /> : null}
      {runId && snapshot ? (
        <>
          <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
            <MetricGrid metrics={metrics} />
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <Mini label="Current run" value={snapshot.run.runId || snapshot.run.executionId || runId} />
              <Mini label="Status" value={snapshot.run.status} />
              <Mini label="Active task" value={snapshot.activeTask?.title || "No active task"} />
              <Mini label="Next action" value={snapshot.nextAction} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["pause", "resume", "stop", "approve-step", "reject-step", "regenerate"] as const).map((action) => <button key={action} className="rounded-md border border-line bg-muted px-3 py-2 text-sm font-semibold hover:bg-primary-soft" onClick={() => control(action)}>{action}</button>)}
            </div>
          </section>
          {mode === "workspace" || mode === "live" ? <LivePanel snapshot={snapshot} events={events} /> : null}
          {mode === "evidence" ? <EvidencePanel snapshot={snapshot} /> : null}
          {mode === "instructions" ? <InstructionPanel snapshot={snapshot} instructionType={instructionType} setInstructionType={setInstructionType} instruction={instruction} setInstruction={setInstruction} onAdd={addInstruction} /> : null}
        </>
      ) : runId && state === "success" ? <StatePanel state="empty" title="Run not found" detail="Select an existing VaanForge run from the workspace overview." /> : null}
    </section>
  );
}

function RunPicker({ runs }: { runs: AgentRunListItem[] }) {
  if (!runs.length) return <StatePanel state="empty" title="No runs available" detail="Create a VaanForge run, then return here to monitor it live." />;
  return <Panel title="Current Agent Runs">{runs.map((run) => <Link key={run.runId} className="grid gap-2 rounded-md border border-line bg-muted p-3 hover:bg-primary-soft md:grid-cols-[1fr_0.5fr_1fr]" href={`/admin/agent/workspace/${run.runId}`}><strong>{run.runId}<span className="block text-xs text-ink-muted">{run.product}</span></strong><span>{run.status}</span><span>{run.nextAction}</span></Link>)}</Panel>;
}

function LivePanel({ snapshot, events }: { snapshot: AgentWorkspaceSnapshot; events: AgentLiveEvent[] }) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.75fr]">
      <Panel title="Step Timeline">{snapshot.logs.length ? snapshot.logs.map((log, index) => <Mini key={log.activityId || index} label={`${log.status} · ${log.step}`} value={`${log.message} · ${log.createdAt}`} />) : <p className="text-sm text-ink-muted">No logs yet.</p>}</Panel>
      <Panel title="Live Event Stream">{events.length ? events.slice(-20).reverse().map((event) => <Mini key={event.eventId} label={event.eventType} value={`${JSON.stringify(event.payload)} · ${event.createdAt}`} />) : <p className="text-sm text-ink-muted">Open the live view to stream backend events.</p>}</Panel>
    </section>
  );
}

function EvidencePanel({ snapshot }: { snapshot: AgentWorkspaceSnapshot }) {
  return <Panel title="Workspace Evidence">{snapshot.evidence.map((item) => <div key={item.evidenceId} className="rounded-md border border-line bg-muted p-3"><Mini label={item.evidenceType} value={item.title} /><pre className="mt-2 max-h-72 overflow-auto rounded-md bg-canvas p-3 text-xs">{JSON.stringify(item.payload, null, 2)}</pre></div>)}</Panel>;
}

function InstructionPanel(props: { snapshot: AgentWorkspaceSnapshot; instructionType: AgentWorkspaceInstruction["instructionType"]; setInstructionType: (value: AgentWorkspaceInstruction["instructionType"]) => void; instruction: string; setInstruction: (value: string) => void; onAdd: () => void }) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1fr]">
      <Panel title="Add Instruction">
        <select className="rounded-md border border-line bg-canvas px-3 py-2" value={props.instructionType} onChange={(event) => props.setInstructionType(event.target.value as AgentWorkspaceInstruction["instructionType"])}>
          {["extra", "constraint", "design", "backend", "security", "deadline_priority"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <textarea className="min-h-48 rounded-md border border-line bg-canvas p-3" value={props.instruction} onChange={(event) => props.setInstruction(event.target.value)} placeholder="Add a scoped instruction, constraint, design note, backend note, security note, or deadline/priority update." />
        <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={props.onAdd}>Pause and apply</button>
      </Panel>
      <Panel title="Instruction History">{props.snapshot.instructions.length ? props.snapshot.instructions.map((item) => <Mini key={item.instructionId} label={`${item.instructionType} · ${item.applied ? "applied" : "pending"}`} value={`${item.content} · ${item.createdAt}`} />) : <p className="text-sm text-ink-muted">No instructions added yet.</p>}</Panel>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid gap-3">{children}</div></section>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line bg-muted p-3"><p className="text-xs font-semibold uppercase text-accent">{label}</p><p className="mt-1 break-words text-sm text-ink">{value}</p></div>;
}
