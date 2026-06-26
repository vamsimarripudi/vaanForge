"use client";

import { useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

type PartnerCollaborationOs = {
  collaborations: Array<{ partnerId: string; title: string; status: string; nextStep: string }>;
  revenueShare: Array<{ partnerId: string; partnerName: string; percent: number; status: string }>;
  agreements: Array<{ partnerId: string; title: string; route: string; status: string }>;
  tasks: Array<{ partnerId: string; title: string; route: string; priority: string }>;
  approvals: Array<{ partnerId: string; title: string; status: string; owner: string }>;
  communications: Array<{ partnerId: string; title: string; route: string; channel: string }>;
};

const emptyCollaborationOs: PartnerCollaborationOs = {
  collaborations: [],
  revenueShare: [],
  agreements: [],
  tasks: [],
  approvals: [],
  communications: []
};

function MiniList<T extends { partnerId: string }>({ title, records, render }: { title: string; records: T[]; render: (record: T) => string }) {
  return (
    <div className="rounded-md border border-line bg-canvas p-4">
      <h3 className="font-bold">{title}</h3>
      {records.length ? (
        <ul className="mt-3 space-y-3 text-sm">
          {records.slice(0, 5).map((record) => (
            <li key={`${title}-${record.partnerId}`} className="border-b border-line pb-3 last:border-0">
              {render(record)}
            </li>
          ))}
        </ul>
      ) : (
        <StatePanel state="empty" title="No records" detail={`${title} appear after partners are added.`} />
      )}
    </div>
  );
}

export function PartnerCollaborationPanel() {
  const [collaborationOs, setCollaborationOs] = useState<PartnerCollaborationOs>(emptyCollaborationOs);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  async function refreshCollaborationOs() {
    setState("loading");
    try {
      const next = await apiClient<PartnerCollaborationOs>("/partners/collaboration-os");
      setCollaborationOs(next);
      setState("success");
    } catch {
      setCollaborationOs(emptyCollaborationOs);
      setState("error");
    }
  }

  useEffect(() => {
    void refreshCollaborationOs();
  }, []);

  return (
    <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Partner & Collaboration OS</h2>
          <p className="mt-2 text-sm text-ink-muted">Partners, collabs, revenue share, agreements, tasks, approvals, and communications.</p>
        </div>
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={refreshCollaborationOs}>
          Refresh collaborations
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <MiniList title="Collaborations" records={collaborationOs.collaborations} render={(record) => `${record.title} / ${record.status} / ${record.nextStep}`} />
        <MiniList title="Revenue Share" records={collaborationOs.revenueShare} render={(record) => `${record.partnerName} / ${record.percent}% / ${record.status}`} />
        <MiniList title="Agreements" records={collaborationOs.agreements} render={(record) => `${record.title} / ${record.route} / ${record.status}`} />
        <MiniList title="Tasks" records={collaborationOs.tasks} render={(record) => `${record.title} / ${record.route} / ${record.priority}`} />
        <MiniList title="Approvals" records={collaborationOs.approvals} render={(record) => `${record.title} / ${record.status} / ${record.owner}`} />
        <MiniList title="Communications" records={collaborationOs.communications} render={(record) => `${record.title} / ${record.route} / ${record.channel}`} />
      </div>

      <div className="mt-4">
        <StatePanel state={state === "success" ? "success" : state === "error" ? "error" : "loading"} title="Partner collaboration" detail="Partner collaboration operating data is available." />
      </div>
    </section>
  );
}
