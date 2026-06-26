"use client";

import { useCallback, useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

type IntelligenceSnapshot = {
  id: string;
  reportExplanation: string;
  riskSignals: string[];
  nextTasks: string[];
  disclaimer: string;
  placeholders: number;
  createdAt: string;
};

export function IntelligenceSnapshotPanel() {
  const [snapshot, setSnapshot] = useState<IntelligenceSnapshot | null>(null);
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [message, setMessage] = useState("Loading latest intelligence snapshot.");

  const refreshLatestSnapshot = useCallback(async () => {
    setState("loading");
    setMessage("Loading latest intelligence snapshot.");
    try {
      const latest = await apiClient<IntelligenceSnapshot | null>("/intelligence/latest");
      setSnapshot(latest);
      setState(latest ? "success" : "empty");
      setMessage(latest ? `Snapshot ${latest.id} generated at ${latest.createdAt}.` : "Generate intelligence to create the first snapshot.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Latest intelligence failed.");
    }
  }, []);

  useEffect(() => {
    void refreshLatestSnapshot();
  }, [refreshLatestSnapshot]);

  return (
    <section className="mb-8 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Latest Intelligence Snapshot</h2>
          <p className="mt-2 text-sm text-ink-muted">{message}</p>
        </div>
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={refreshLatestSnapshot}>
          Refresh snapshot
        </button>
      </div>

      {snapshot ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <section className="rounded-md border border-line bg-canvas p-4 lg:col-span-3">
            <h3 className="text-sm font-bold">Report Explanation</h3>
            <p className="mt-2 text-sm text-ink-muted">{snapshot.reportExplanation}</p>
          </section>
          <section className="rounded-md border border-line bg-canvas p-4">
            <h3 className="text-sm font-bold">Risk Signals</h3>
            <ul className="mt-2 space-y-2 text-sm text-ink-muted">
              {snapshot.riskSignals.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-md border border-line bg-canvas p-4">
            <h3 className="text-sm font-bold">Next Tasks</h3>
            <ul className="mt-2 space-y-2 text-sm text-ink-muted">
              {snapshot.nextTasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-md border border-line bg-canvas p-4">
            <h3 className="text-sm font-bold">Safety</h3>
            <p className="mt-2 text-sm text-ink-muted">{snapshot.disclaimer}</p>
            <p className="mt-3 text-xs font-semibold text-accent">{snapshot.placeholders} deterministic placeholder surfaces</p>
          </section>
        </div>
      ) : (
        <div className="mt-5">
          <StatePanel state={state} title="No snapshot" detail="Run the intelligence summary to persist a snapshot." />
        </div>
      )}
    </section>
  );
}
