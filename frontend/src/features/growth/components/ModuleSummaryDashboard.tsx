"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

type WorkflowField = {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "checkbox";
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: Array<{ label: string; value: string }>;
  optional?: boolean;
};

type WorkflowConfig = {
  title: string;
  endpoint: string;
  method?: "POST" | "PATCH";
  submitLabel: string;
  successMessage: string;
  fields: WorkflowField[];
};

type ListColumn = {
  key: string;
  label: string;
};

type ListConfig = {
  endpoint: string;
  title: string;
  columns: ListColumn[];
};

interface ModuleSummaryDashboardProps {
  title: string;
  description: string;
  endpoint: string;
  metricLabels: Array<{ key: string; label: string; detail: string }>;
  note?: string;
  workflow?: WorkflowConfig;
  workflows?: WorkflowConfig[];
  listEndpoint?: string;
  listTitle?: string;
  listColumns?: ListColumn[];
  lists?: ListConfig[];
}

export function ModuleSummaryDashboard({ title, description, endpoint, metricLabels, note, workflow, workflows, listEndpoint, listTitle, listColumns = [], lists }: ModuleSummaryDashboardProps) {
  const activeWorkflows = useMemo(() => workflows || (workflow ? [workflow] : []), [workflow, workflows]);
  const activeLists = useMemo(() => lists || (listEndpoint && listColumns.length ? [{ endpoint: listEndpoint, title: listTitle || "Recent Records", columns: listColumns }] : []), [listColumns, listEndpoint, listTitle, lists]);
  const [summary, setSummary] = useState<Record<string, string | number | boolean>>({});
  const [recordsByEndpoint, setRecordsByEndpoint] = useState<Record<string, Array<Record<string, string | number | boolean | undefined>>>>({});
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [workflowState, setWorkflowState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [workflowMessage, setWorkflowMessage] = useState(activeWorkflows.length ? `Ready for ${activeWorkflows[0].title.toLowerCase()}.` : "No workflow configured.");

  const refreshSummary = useCallback(async () => {
    return apiClient<Record<string, string | number | boolean>>(endpoint)
      .then((data) => {
        setSummary(data);
        setState(Object.keys(data).length ? "success" : "empty");
      })
      .catch(() => setState("error"));
  }, [endpoint]);

  const refreshRecords = useCallback(async (selectedList?: ListConfig) => {
    const listsToRefresh = selectedList ? [selectedList] : activeLists;
    if (!listsToRefresh.length) {
      return;
    }
    const nextRecords = await Promise.all(
      listsToRefresh.map((listConfig) =>
        apiClient<Array<Record<string, string | number | boolean | undefined>>>(listConfig.endpoint)
          .then((data) => [listConfig.endpoint, data.slice(0, 8)] as const)
          .catch(() => [listConfig.endpoint, []] as const)
      )
    );
    setRecordsByEndpoint((current) => ({
      ...current,
      ...Object.fromEntries(nextRecords)
    }));
  }, [activeLists]);

  useEffect(() => {
    void refreshSummary();
    void refreshRecords();
  }, [refreshRecords, refreshSummary]);

  async function submitWorkflow(formData: FormData, selectedWorkflow: WorkflowConfig) {
    if (!selectedWorkflow) {
      return;
    }

    setWorkflowState("loading");
    setWorkflowMessage(`Saving ${selectedWorkflow.title.toLowerCase()}.`);
    const payload = selectedWorkflow.fields.reduce<Record<string, string | number | boolean>>((nextPayload, field) => {
      const value = formData.get(field.name);
      if (field.type === "number") {
        nextPayload[field.name] = Number(value || 0);
      } else if (field.type === "checkbox") {
        nextPayload[field.name] = value === "on";
      } else {
        const textValue = String(value || "");
        if (field.optional && !textValue) {
          return nextPayload;
        }
        nextPayload[field.name] = textValue;
      }
      return nextPayload;
    }, {});

    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient(selectedWorkflow.endpoint, {
        method: selectedWorkflow.method || "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify(payload)
      });
      await refreshSummary();
      await refreshRecords();
      setWorkflowState("success");
      setWorkflowMessage(selectedWorkflow.successMessage);
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : `${selectedWorkflow.title} failed.`);
    }
  }

  return (
    <section className="py-8">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">{description}</p>
      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <MetricGrid
          metrics={metricLabels.map((metric) => ({
            label: metric.label,
            value: String(summary[metric.key] ?? 0),
            detail: metric.detail
          }))}
        />
      </div>
      {note ? (
        <aside className="mt-6 rounded-panel border border-line bg-muted p-5">
          <p className="text-sm font-semibold text-accent">Implementation note</p>
          <p className="mt-2 text-sm text-ink-muted">{note}</p>
        </aside>
      ) : null}
      {activeWorkflows.length ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {activeWorkflows.map((selectedWorkflow) => (
            <form key={selectedWorkflow.endpoint} action={(formData) => submitWorkflow(formData, selectedWorkflow)} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
              <h2 className="text-xl font-bold">{selectedWorkflow.title}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {selectedWorkflow.fields.map((field) => (
                  <label key={field.name} className="text-sm font-semibold">
                    {field.label}
                    {field.type === "select" ? (
                      <select name={field.name} defaultValue={String(field.defaultValue ?? field.options?.[0]?.value ?? "")} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                        {(field.options || []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "checkbox" ? (
                      <span className="mt-2 flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2">
                        <input name={field.name} type="checkbox" defaultChecked={Boolean(field.defaultValue)} className="h-4 w-4" />
                        Enabled
                      </span>
                    ) : (
                      <input
                        name={field.name}
                        type={field.type === "number" ? "number" : "text"}
                        min={field.type === "number" ? 0 : undefined}
                        defaultValue={typeof field.defaultValue === "boolean" ? undefined : field.defaultValue}
                        className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2"
                        placeholder={field.placeholder}
                      />
                    )}
                  </label>
                ))}
              </div>
              <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
                {selectedWorkflow.submitLabel}
              </button>
            </form>
          ))}
        </section>
      ) : null}
      {activeLists.map((listConfig) => {
        const records = recordsByEndpoint[listConfig.endpoint] || [];
        return (
          <section key={listConfig.endpoint} className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold">{listConfig.title}</h2>
              <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={() => void refreshRecords(listConfig)}>
                Refresh records
              </button>
            </div>
            {records.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-ink-muted">
                    <tr>
                      {listConfig.columns.map((column) => (
                        <th key={column.key} className="border-b border-line py-2 pr-4 font-semibold">
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={String(record.id)} className="border-b border-line last:border-0">
                        {listConfig.columns.map((column) => (
                          <td key={column.key} className="py-3 pr-4">
                            {String(record[column.key] ?? "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <StatePanel state="empty" title="No records" detail={`${listConfig.title} records will appear after creation.`} />
            )}
          </section>
        );
      })}
      {activeWorkflows.length ? (
        <div className="mt-6">
          <StatePanel state={workflowState} title="Workflow" detail={workflowMessage} />
        </div>
      ) : null}
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Loading" detail={`Shown while ${title} data loads.`} />
        <StatePanel state="empty" title="Empty" detail={`Shown before ${title} records exist.`} />
        <StatePanel state="error" title="Error" detail={`Shown when ${title} APIs fail.`} />
        <StatePanel state={state === "success" ? "success" : state === "error" ? "error" : "empty"} title="Ready" detail={`${title} foundation is available.`} />
      </div>
    </section>
  );
}
