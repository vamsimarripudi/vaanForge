"use client";

import { useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

type AuditAction =
  | "FINANCE_ACTION"
  | "LEGAL_ACTION"
  | "SECURITY_ACTION"
  | "BILLING_ACTION"
  | "ENTITLEMENT_CHECK"
  | "WORKSPACE_CREATED"
  | "PERMISSION_CHECK"
  | "SETTINGS_CHANGED"
  | "AUTOMATION_CHANGED"
  | "FILE_UPLOADED";

type AuditSummary = {
  total: number;
  finance: number;
  legal: number;
  security: number;
  workspace: number;
};

type AuditLogEntry = {
  id: string;
  actorId: string;
  organizationId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  createdAt: string;
};

const auditActions: AuditAction[] = [
  "FINANCE_ACTION",
  "LEGAL_ACTION",
  "SECURITY_ACTION",
  "BILLING_ACTION",
  "ENTITLEMENT_CHECK",
  "WORKSPACE_CREATED",
  "PERMISSION_CHECK",
  "SETTINGS_CHANGED",
  "AUTOMATION_CHANGED",
  "FILE_UPLOADED"
];

export function AuditPanel() {
  const [summary, setSummary] = useState<AuditSummary>({ total: 0, finance: 0, legal: 0, security: 0, workspace: 0 });
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [workflowState, setWorkflowState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [message, setMessage] = useState("Loading audit activity.");

  async function refreshAudit() {
    setState("loading");
    try {
      const [nextSummary, nextEntries] = await Promise.all([
        apiClient<AuditSummary>("/audit/summary"),
        apiClient<AuditLogEntry[]>("/audit")
      ]);
      setSummary(nextSummary);
      setEntries(nextEntries.slice(-6).reverse());
      setState(nextEntries.length ? "success" : "empty");
      setMessage(nextEntries.length ? "Audit activity loaded." : "No audit entries are available yet.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Audit activity failed to load.");
    }
  }

  useEffect(() => {
    void refreshAudit();
  }, []);

  async function recordAudit(formData: FormData) {
    setWorkflowState("loading");
    setMessage("Recording audit entry.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient<AuditLogEntry>("/audit", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          actorId: String(formData.get("actorId") || "manual-admin"),
          organizationId: String(formData.get("organizationId") || "manual-org"),
          action: String(formData.get("action") || "SECURITY_ACTION"),
          entityType: String(formData.get("entityType") || "ManualAudit"),
          entityId: String(formData.get("entityId") || "") || undefined,
          metadata: { note: String(formData.get("note") || "") }
        })
      });
      await refreshAudit();
      setWorkflowState("success");
      setMessage("Audit entry recorded.");
    } catch (error) {
      setWorkflowState("error");
      setMessage(error instanceof Error ? error.message : "Audit entry failed.");
    }
  }

  return (
    <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold">Audit Log</h2>
          <p className="mt-2 text-sm text-ink-muted">{message}</p>
        </div>
        <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" type="button" onClick={refreshAudit}>
          Refresh
        </button>
      </div>
      <div className="mt-5">
        <MetricGrid
          metrics={[
            { label: "Total", value: String(summary.total), detail: "Audit entries" },
            { label: "Finance", value: String(summary.finance), detail: "Finance actions" },
            { label: "Legal", value: String(summary.legal), detail: "Legal actions" },
            { label: "Security", value: String(summary.security), detail: "Security actions" },
            { label: "Workspace", value: String(summary.workspace), detail: "Workspace actions" }
          ]}
        />
      </div>
      <form action={recordAudit} className="mt-5 rounded-md border border-line bg-canvas p-4">
        <h3 className="text-sm font-bold">Record Manual Audit Entry</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Actor ID
            <input name="actorId" className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2" placeholder="manual-admin" />
          </label>
          <label className="text-sm font-semibold">
            Organization ID
            <input name="organizationId" className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2" placeholder="manual-org" />
          </label>
          <label className="text-sm font-semibold">
            Action
            <select name="action" defaultValue="SECURITY_ACTION" className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2">
              {auditActions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Entity type
            <input name="entityType" className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2" placeholder="ManualAudit" />
          </label>
          <label className="text-sm font-semibold">
            Entity ID
            <input name="entityId" className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2" placeholder="Optional entity ID" />
          </label>
          <label className="text-sm font-semibold">
            Note
            <input name="note" className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2" placeholder="Reason for manual audit entry" />
          </label>
        </div>
        <button className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
          Record Audit
        </button>
      </form>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <StatePanel state={state} title="Audit API" detail="Audit summary and recent entries are permission protected." />
        <StatePanel state={workflowState} title="Audit workflow" detail="Manual audit entries require CSRF and audit permission." />
      </div>
      {entries.length ? (
        <ul className="mt-5 divide-y divide-line">
          {entries.map((entry) => (
            <li key={entry.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{entry.action}</p>
                <span className="text-xs text-ink-muted">{entry.createdAt}</span>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {entry.entityType} {entry.entityId ? `/ ${entry.entityId}` : ""} by {entry.actorId}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
