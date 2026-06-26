"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { agentMemoryApi } from "../services/agentMemoryApi";
import type { AgentKnowledgeEntry, AgentMemoryEntry } from "../types.memory";

type Mode = "memory" | "new" | "detail" | "review" | "knowledge" | "knowledgeDetail";

const draftMemory = {
  title: "Reusable architecture lesson",
  memoryType: "project",
  content: "Use modular VMNexus services with explicit audit logs, owner, status, priority, due date, and next action on every workflow.",
  summary: "VMNexus workflow metadata pattern.",
  tags: ["architecture", "workflow"],
  confidenceScore: 0.82,
  source: { sourceType: "manual", sourceRef: "admin-note", evidence: { reviewed: true } },
  ownerId: "admin",
  priority: "MEDIUM"
};

export function AgentMemoryDashboard({ mode, memoryId, entryId }: { mode: Mode; memoryId?: string; entryId?: string }) {
  const [memory, setMemory] = useState<AgentMemoryEntry[]>([]);
  const [knowledge, setKnowledge] = useState<AgentKnowledgeEntry[]>([]);
  const [detail, setDetail] = useState<AgentMemoryEntry | null>(null);
  const [query, setQuery] = useState("architecture security fix");
  const [payload, setPayload] = useState(JSON.stringify(draftMemory, null, 2));
  const [retrieval, setRetrieval] = useState<unknown>(null);
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [memoryData, knowledgeData] = await Promise.all([mode === "review" ? agentMemoryApi.reviewQueue() : agentMemoryApi.memory(), agentMemoryApi.knowledge()]);
        if (!mounted) return;
        setMemory(memoryData);
        setKnowledge(knowledgeData);
        if (memoryId) setDetail(await agentMemoryApi.memoryDetail(memoryId));
        setState(memoryData.length || knowledgeData.length || memoryId || entryId || mode === "new" ? "success" : "empty");
      } catch {
        if (mounted) setState("error");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [entryId, memoryId, mode]);

  async function createMemory() {
    if (!window.confirm("Create this memory entry for review?")) return;
    const created = await agentMemoryApi.createMemory(JSON.parse(payload) as Record<string, unknown>);
    setDetail(created);
    setMemory((items) => [created, ...items]);
  }

  async function memoryAction(action: "approve" | "reject" | "archive") {
    if (!detail) return;
    const reason = window.prompt(`Reason for ${action}`) || "";
    if ((action === "reject" || action === "archive") && !reason.trim()) return;
    if (!window.confirm(`Confirm ${action} for ${detail.memoryId}?`)) return;
    setDetail(await agentMemoryApi.action(detail.memoryId, action, { reason, trustLevel: action === "approve" ? "trusted" : "untrusted" }));
    setKnowledge(await agentMemoryApi.knowledge());
  }

  async function retrieve() {
    setRetrieval(await agentMemoryApi.retrieve({ query, tags: query.split(" ").filter(Boolean), limit: 8 }));
  }

  const selectedKnowledge = entryId ? knowledge.find((entry) => entry.entryId === entryId) : undefined;

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Agent Memory</h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">Reviewed project lessons, verified fixes, architecture patterns, deployment lessons, security rules, and design rules with source-backed retrieval.</p>
        </div>
        <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href="/admin/agent/memory">Memory</Link>
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href="/admin/agent/memory/new">New</Link>
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href="/admin/agent/memory/review">Review</Link>
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href="/admin/agent/knowledge-base">Knowledge Base</Link>
      </nav>

      {state === "error" ? <StatePanel state="error" title="Memory unavailable" detail="Check admin permissions and memory APIs." /> : null}
      {mode === "new" ? <Panel title="New Memory"><textarea className="min-h-96 rounded-md border border-line bg-canvas p-3 font-mono text-xs" value={payload} onChange={(event) => setPayload(event.target.value)} /><button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={createMemory}>Create memory</button></Panel> : null}
      {mode === "memory" || mode === "review" ? <MemoryList memory={memory} /> : null}
      {mode === "detail" && detail ? <MemoryDetail detail={detail} onAction={memoryAction} /> : null}
      {mode === "knowledge" ? <KnowledgePanel knowledge={knowledge} query={query} setQuery={setQuery} retrieve={retrieve} retrieval={retrieval} /> : null}
      {mode === "knowledgeDetail" ? <Panel title="Knowledge Entry"><pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(selectedKnowledge || {}, null, 2)}</pre></Panel> : null}
    </section>
  );
}

function MemoryList({ memory }: { memory: AgentMemoryEntry[] }) {
  if (!memory.length) return <StatePanel state="empty" title="No memory entries" detail="Create memory from a sourced project, error, fix, template, deployment, or approval." />;
  return <Panel title="Memory Entries">{memory.map((entry) => <Link key={entry.memoryId} href={`/admin/agent/memory/${entry.memoryId}`} className="grid gap-2 rounded-md border border-line bg-muted p-3 hover:bg-primary-soft md:grid-cols-[1fr_0.6fr_1fr]"><strong>{entry.title}<span className="block text-xs text-ink-muted">{entry.memoryId}</span></strong><span>{entry.status} · {entry.trustLevel}</span><span>{entry.nextAction}</span></Link>)}</Panel>;
}

function MemoryDetail({ detail, onAction }: { detail: AgentMemoryEntry; onAction: (action: "approve" | "reject" | "archive") => void }) {
  return (
    <Panel title={detail.title}>
      <div className="grid gap-3 md:grid-cols-4">
        <Mini label="Status" value={detail.status} />
        <Mini label="Trust" value={detail.trustLevel} />
        <Mini label="Confidence" value={String(detail.confidenceScore)} />
        <Mini label="Next action" value={detail.nextAction} />
      </div>
      <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(detail, null, 2)}</pre>
      <div className="flex flex-wrap gap-2">
        {(["approve", "reject", "archive"] as const).map((action) => <button key={action} className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={() => onAction(action)}>{action}</button>)}
      </div>
    </Panel>
  );
}

function KnowledgePanel(props: { knowledge: AgentKnowledgeEntry[]; query: string; setQuery: (value: string) => void; retrieve: () => void; retrieval: unknown }) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1fr]">
      <Panel title="Retrieve Knowledge">
        <input className="rounded-md border border-line bg-canvas px-3 py-2" value={props.query} onChange={(event) => props.setQuery(event.target.value)} />
        <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={props.retrieve}>Retrieve</button>
        {props.retrieval ? <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(props.retrieval, null, 2)}</pre> : null}
      </Panel>
      <Panel title="Knowledge Base">{props.knowledge.length ? props.knowledge.map((entry) => <Link key={entry.entryId} href={`/admin/agent/knowledge-base/${entry.entryId}`} className="rounded-md border border-line bg-muted p-3 hover:bg-primary-soft"><strong>{entry.title}</strong><span className="block text-xs text-ink-muted">{entry.knowledgeType} · sources: {entry.sourceRefs.join(", ")}</span></Link>) : <p className="text-sm text-ink-muted">No approved trusted knowledge yet.</p>}</Panel>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid gap-3">{children}</div></section>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line bg-muted p-3"><p className="text-xs font-semibold uppercase text-accent">{label}</p><p className="mt-1 break-words text-sm text-ink">{value}</p></div>;
}
