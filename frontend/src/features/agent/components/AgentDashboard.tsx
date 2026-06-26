"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { agentAdminApi } from "../services/agentAdminApi";
import type { AgentError, AgentFile, AgentLog, AgentRunDetail, AgentRunListItem, AgentSummary, AgentTask, AgentValidation } from "../types";

type Mode = "overview" | "runs" | "detail" | "tasks" | "files" | "diff" | "logs" | "approvals" | "settings";

const emptySummary: AgentSummary = {
  totalRuns: 0,
  activeRuns: 0,
  completedRuns: 0,
  failedOrBlockedRuns: 0,
  averageValidationSuccessRate: 0,
  recentActivity: [],
  notifications: []
};

export function AgentDashboard({ mode, runId }: { mode: Mode; runId?: string }) {
  const [summary, setSummary] = useState<AgentSummary>(emptySummary);
  const [runs, setRuns] = useState<AgentRunListItem[]>([]);
  const [detail, setDetail] = useState<AgentRunDetail | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [validations, setValidations] = useState<AgentValidation[]>([]);
  const [errors, setErrors] = useState<AgentError[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [owner, setOwner] = useState("");
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [summaryData, runData] = await Promise.all([agentAdminApi.summary(), agentAdminApi.runs()]);
        if (!mounted) {
          return;
        }
        setSummary(summaryData);
        setRuns(runData);
        if (runId) {
          const [detailData, taskData, fileData, validationData, errorData, logData] = await Promise.all([
            agentAdminApi.run(runId),
            agentAdminApi.tasks(runId),
            agentAdminApi.files(runId),
            agentAdminApi.validations(runId),
            agentAdminApi.errors(runId),
            agentAdminApi.logs(runId)
          ]);
          if (!mounted) {
            return;
          }
          setDetail(detailData);
          setTasks(taskData);
          setFiles(fileData);
          setValidations(validationData);
          setErrors(errorData);
          setLogs(logData);
        }
        setState(runData.length || runId ? "success" : "empty");
      } catch {
        if (mounted) {
          setState("error");
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [runId]);

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const matchesQuery = [run.runId, run.product, run.ownerId].some((value) => value.toLowerCase().includes(query.toLowerCase()));
      const matchesStatus = status === "all" || run.status === status;
      const matchesOwner = !owner || run.ownerId.toLowerCase().includes(owner.toLowerCase());
      return matchesQuery && matchesStatus && matchesOwner;
    });
  }, [owner, query, runs, status]);

  async function act(action: "approve" | "reject" | "block" | "resume" | "cancel") {
    if (!runId) {
      return;
    }
    const needsReason = action === "reject" || action === "block" || action === "cancel";
    const reason = needsReason ? window.prompt(`Reason for ${action}`) || "" : "";
    if (needsReason && !reason.trim()) {
      return;
    }
    if (!window.confirm(`Confirm ${action} for ${runId}?`)) {
      return;
    }
    await agentAdminApi.action(runId, action, reason);
    const updated = await agentAdminApi.run(runId);
    setDetail(updated);
  }

  const pageTitle = mode === "overview" ? "Agent Dashboard" : mode === "approvals" ? "Agent Approvals" : mode === "settings" ? "Agent Settings" : "Agent Runs";

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{pageTitle}</h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">
            Monitor VaanForge blueprint and coding execution runs with real validation state, approvals, diff review, audit history, and next actions.
          </p>
        </div>
        <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {[
          ["/admin/agent", "Overview"],
          ["/admin/agent/runs", "Runs"],
          ["/admin/agent/templates", "Templates"],
          ["/admin/agent/marketplace", "Marketplace"],
          ["/admin/agent/approvals", "Approvals"],
          ["/admin/agent/settings", "Settings"]
        ].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted">{label}</Link>
        ))}
      </nav>

      {state === "error" ? <StatePanel state="error" title="Agent data unavailable" detail="Check admin permissions, session state, and the VaanForge admin API." /> : null}
      {mode === "overview" || mode === "runs" || mode === "approvals" || mode === "settings" ? (
        <>
          <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
            <MetricGrid
              metrics={[
                { label: "Total runs", value: String(summary.totalRuns), detail: "Blueprint and execution runs" },
                { label: "Active", value: String(summary.activeRuns), detail: "Currently in progress" },
                { label: "Completed", value: String(summary.completedRuns), detail: "Passed required gates" },
                { label: "Failed or blocked", value: String(summary.failedOrBlockedRuns), detail: "Needs admin action" },
                { label: "Validation success", value: `${summary.averageValidationSuccessRate}%`, detail: "Stored validation outcomes" },
                { label: "Notifications", value: String(summary.notifications.length), detail: "Actionable run events" }
              ]}
            />
          </section>
          <Filters query={query} setQuery={setQuery} status={status} setStatus={setStatus} owner={owner} setOwner={setOwner} />
          <RunTable runs={filteredRuns} />
          {mode === "approvals" ? <ApprovalQueue runs={filteredRuns.filter((run) => ["blocked", "planned", "completed"].includes(run.status))} /> : null}
          {mode === "settings" ? <SettingsPanel /> : null}
        </>
      ) : null}

      {runId ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.75fr]">
          <div className="space-y-4">
            <RunHeader detail={detail} onAction={act} />
            {mode === "detail" ? <DetailPanel detail={detail} validations={validations} errors={errors} /> : null}
            {mode === "tasks" ? <TaskList tasks={tasks} /> : null}
            {mode === "files" ? <FileList files={files} /> : null}
            {mode === "diff" ? <DiffReview files={files} onAction={act} /> : null}
            {mode === "logs" ? <LogList logs={logs} /> : null}
          </div>
          <LiveMonitor detail={detail} logs={logs} errors={errors} />
        </section>
      ) : null}
    </section>
  );
}

function Filters(props: { query: string; setQuery: (value: string) => void; status: string; setStatus: (value: string) => void; owner: string; setOwner: (value: string) => void }) {
  return (
    <section className="mt-4 grid gap-3 rounded-panel border border-line bg-surface p-4 shadow-panel md:grid-cols-3">
      <input className="rounded-md border border-line bg-canvas px-3 py-2" placeholder="Search by run, product, owner" value={props.query} onChange={(event) => props.setQuery(event.target.value)} />
      <select className="rounded-md border border-line bg-canvas px-3 py-2" value={props.status} onChange={(event) => props.setStatus(event.target.value)}>
        {["all", "pending", "analyzing", "planned", "preparing", "generating", "validating", "repairing", "completed", "blocked", "failed"].map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      <input className="rounded-md border border-line bg-canvas px-3 py-2" placeholder="Filter by owner" value={props.owner} onChange={(event) => props.setOwner(event.target.value)} />
    </section>
  );
}

function RunTable({ runs }: { runs: AgentRunListItem[] }) {
  if (!runs.length) {
    return <StatePanel state="empty" title="No agent runs" detail="Create a VaanForge blueprint run, then start execution to populate this dashboard." />;
  }
  return (
    <section className="mt-4 overflow-hidden rounded-panel border border-line bg-surface shadow-panel">
      <div className="grid min-w-[860px] grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.7fr_1.2fr] gap-2 border-b border-line bg-muted px-4 py-3 text-xs font-semibold uppercase text-ink-muted">
        <span>Run</span><span>Status</span><span>Owner</span><span>Priority</span><span>Due</span><span>Next action</span>
      </div>
      {runs.map((run) => (
        <Link key={run.runId} href={`/admin/agent/runs/${run.runId}`} className="grid min-w-[860px] grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.7fr_1.2fr] gap-2 border-b border-line px-4 py-3 text-sm hover:bg-muted">
          <span className="font-semibold">{run.runId}<span className="block text-xs text-ink-muted">{run.product}</span></span>
          <span>{run.status}</span><span>{run.ownerId}</span><span>{run.priority}</span><span>{run.dueDate.slice(0, 10)}</span><span>{run.nextAction}</span>
        </Link>
      ))}
    </section>
  );
}

function RunHeader({ detail, onAction }: { detail: AgentRunDetail | null; onAction: (action: "approve" | "reject" | "block" | "resume" | "cancel") => void }) {
  if (!detail) {
    return <StatePanel state="loading" title="Loading run" detail="Fetching run details, files, validations, logs, and errors." />;
  }
  const id = detail.executionId || detail.runId || "";
  return (
    <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">{detail.kind}</p>
          <h2 className="mt-1 text-2xl font-bold">{id}</h2>
          <p className="mt-2 text-sm text-ink-muted">{detail.nextAction}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["approve", "reject", "block", "resume", "cancel"] as const).map((action) => (
            <button key={action} className="rounded-md border border-line bg-muted px-3 py-2 text-sm font-semibold hover:bg-primary-soft" onClick={() => onAction(action)}>
              {action}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Mini label="Owner" value={detail.ownerId} />
        <Mini label="Status" value={detail.status} />
        <Mini label="Priority" value={detail.priority} />
        <Mini label="Due" value={detail.dueDate?.slice(0, 10) || "Unscheduled"} />
      </div>
    </section>
  );
}

function DetailPanel({ detail, validations, errors }: { detail: AgentRunDetail | null; validations: AgentValidation[]; errors: AgentError[] }) {
  if (!detail) return null;
  return (
    <section className="space-y-4">
      <JsonPanel title="Requirement Input" value={detail.inputRequirements || detail.approvedBlueprint || {}} />
      <JsonPanel title="Generated Blueprint / Task Graph" value={detail.taskGraph || detail.outputs || {}} />
      <ValidationList validations={validations} />
      <ErrorList errors={errors} />
    </section>
  );
}

function TaskList({ tasks }: { tasks: AgentTask[] }) {
  if (!tasks.length) return <StatePanel state="empty" title="No execution tasks" detail="Start Phase 2 execution to create the task graph." />;
  return <Panel title="Task Graph">{tasks.map((task) => <Mini key={task.taskId} label={`${task.module} · ${task.status}`} value={`${task.title} · ${task.nextAction}`} />)}</Panel>;
}

function FileList({ files }: { files: AgentFile[] }) {
  if (!files.length) return <StatePanel state="empty" title="No generated files" detail="Execution has not written or reviewed files yet." />;
  return <Panel title="Generated Files">{files.map((file) => <Mini key={file.fileId} label={`${file.module} · ${file.status}`} value={`${file.path}${file.humanReviewRequired ? " · review required" : ""}`} />)}</Panel>;
}

function DiffReview({ files, onAction }: { files: AgentFile[]; onAction: (action: "approve" | "reject") => void }) {
  const reviewFiles = files.filter((file) => file.humanReviewRequired || file.diffSummary);
  if (!reviewFiles.length) return <StatePanel state="empty" title="No diffs need review" detail="Files are either unchanged or already approved." />;
  return (
    <Panel title="Diff Review">
      {reviewFiles.map((file) => (
        <div key={file.fileId} className="rounded-md border border-line bg-canvas p-3">
          <p className="font-semibold">{file.path}</p>
          <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs">{file.diffSummary || "No diff summary available."}</pre>
        </div>
      ))}
      <div className="flex gap-2">
        <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={() => onAction("approve")}>Approve changes</button>
        <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={() => onAction("reject")}>Reject changes</button>
      </div>
    </Panel>
  );
}

function LiveMonitor({ detail, logs, errors }: { detail: AgentRunDetail | null; logs: AgentLog[]; errors: AgentError[] }) {
  return (
    <aside className="space-y-4">
      <Panel title="Live Monitor">
        <Mini label="Current task" value={detail?.nextAction || "No active run selected."} />
        <Mini label="Warnings" value={String((detail?.files || []).filter((file) => file.humanReviewRequired).length)} />
        <Mini label="Errors" value={String(errors.length)} />
      </Panel>
      <LogList logs={logs.slice(0, 8)} />
    </aside>
  );
}

function ValidationList({ validations }: { validations: AgentValidation[] }) {
  return <Panel title="Validation Results">{validations.length ? validations.map((item) => <Mini key={item.validationId} label={`${item.checkName} · ${item.status}`} value={item.command} />) : <p className="text-sm text-ink-muted">No validation runs recorded yet.</p>}</Panel>;
}

function ErrorList({ errors }: { errors: AgentError[] }) {
  return <Panel title="Error Logs">{errors.length ? errors.map((item) => <Mini key={item.errorId} label={`${item.source} · ${item.status}`} value={`${item.filePath || "general"}${item.line ? `:${item.line}` : ""} · ${item.reason}`} />) : <p className="text-sm text-ink-muted">No stored errors.</p>}</Panel>;
}

function LogList({ logs }: { logs: AgentLog[] }) {
  return <Panel title="Status Timeline">{logs.length ? logs.map((log, index) => <Mini key={log.activityId || log.id || index} label={`${log.status} · ${log.step}`} value={`${log.message} · ${log.createdAt}`} />) : <p className="text-sm text-ink-muted">No activity logs yet.</p>}</Panel>;
}

function ApprovalQueue({ runs }: { runs: AgentRunListItem[] }) {
  return <Panel title="Approval Queue">{runs.length ? runs.map((run) => <Mini key={run.runId} label={`${run.status} · ${run.priority}`} value={`${run.runId} · ${run.nextAction}`} />) : <p className="text-sm text-ink-muted">No approval work is waiting.</p>}</Panel>;
}

function SettingsPanel() {
  return <Panel title="Agent Settings"><Mini label="Provider keys" value="Provider API keys are never exposed in this dashboard." /><Mini label="Access" value="Admin routes require authenticated audit permissions." /><Mini label="Approvals" value="All approval actions require confirmation and are audited." /></Panel>;
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return <Panel title={title}><pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(value, null, 2)}</pre></Panel>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-panel border border-line bg-surface p-5 shadow-panel"><h3 className="text-lg font-bold">{title}</h3><div className="mt-4 space-y-3">{children}</div></section>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line bg-muted p-3"><p className="text-xs font-semibold uppercase text-accent">{label}</p><p className="mt-1 break-words text-sm text-ink">{value}</p></div>;
}
