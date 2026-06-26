"use client";

import { useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

type CommunicationOs = {
  notifications: { provider: string; status: string; generatedFromCommunications: number };
  channelCatalog: Array<{ channel: string; label: string; useCase: string; records: number }>;
  emailTemplates: Array<{ key: string; subject: string; audience: string; status: string }>;
  smsTemplates: Array<{ key: string; message: string; audience: string; status: string }>;
  routingRules: Array<{ trigger: string; channel: string; owner: string }>;
};

const emptyCommunicationOs: CommunicationOs = {
  notifications: { provider: "notificationsService", status: "empty", generatedFromCommunications: 0 },
  channelCatalog: [
    { channel: "ANNOUNCEMENT", label: "Announcements", useCase: "Broadcast company, product, and customer updates.", records: 0 },
    { channel: "DIRECT", label: "Direct messages", useCase: "One-to-one communication.", records: 0 },
    { channel: "TEAM", label: "Team channels", useCase: "Internal workstream updates.", records: 0 },
    { channel: "SUPPORT", label: "Support conversations", useCase: "Customer support replies.", records: 0 },
    { channel: "CUSTOMER_FOLLOW_UP", label: "Customer follow-ups", useCase: "Renewal, onboarding, and health-check follow-ups.", records: 0 }
  ],
  emailTemplates: [],
  smsTemplates: [],
  routingRules: []
};

export function CommunicationOsPanel() {
  const [communicationOs, setCommunicationOs] = useState<CommunicationOs>(emptyCommunicationOs);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  async function refreshCommunicationOs() {
    setState("loading");
    try {
      const next = await apiClient<CommunicationOs>("/communication/operating-system");
      setCommunicationOs(next);
      setState("success");
    } catch {
      setCommunicationOs(emptyCommunicationOs);
      setState("error");
    }
  }

  useEffect(() => {
    void refreshCommunicationOs();
  }, []);

  return (
    <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Communication OS</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Notifications, announcements, direct messages, team channels, support conversations, customer follow-ups, email templates, and SMS templates.
          </p>
        </div>
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={refreshCommunicationOs}>
          Refresh communication
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-line bg-canvas p-4">
          <h3 className="font-bold">Channel Catalog</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {communicationOs.channelCatalog.map((item) => (
              <li key={item.channel} className="border-b border-line pb-3 last:border-0">
                <div className="flex justify-between gap-3">
                  <strong>{item.label}</strong>
                  <span>{item.records}</span>
                </div>
                <p className="mt-1 text-ink-muted">{item.channel} / {item.useCase}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-line bg-canvas p-4">
          <h3 className="font-bold">Email Templates</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {communicationOs.emailTemplates.map((template) => (
              <li key={template.key} className="border-b border-line pb-3 last:border-0">
                <strong>{template.subject}</strong>
                <p className="mt-1 text-ink-muted">{template.audience} / {template.status}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-line bg-canvas p-4">
          <h3 className="font-bold">SMS Templates</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {communicationOs.smsTemplates.map((template) => (
              <li key={template.key} className="border-b border-line pb-3 last:border-0">
                <strong>{template.key}</strong>
                <p className="mt-1 text-ink-muted">{template.message}</p>
                <p className="mt-1 text-ink-muted">{template.audience} / {template.status}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.6fr)]">
        <div className="rounded-md border border-line bg-canvas p-4">
          <h3 className="font-bold">Routing Rules</h3>
          <ul className="mt-3 grid gap-3 text-sm md:grid-cols-3">
            {communicationOs.routingRules.map((rule) => (
              <li key={rule.trigger} className="rounded-md border border-line bg-surface p-3">
                <strong>{rule.trigger}</strong>
                <p className="mt-1 text-ink-muted">{rule.channel} / {rule.owner}</p>
              </li>
            ))}
          </ul>
        </div>
        <StatePanel
          state={state === "success" ? "success" : state === "error" ? "error" : "loading"}
          title="Notifications"
          detail={`${communicationOs.notifications.provider}: ${communicationOs.notifications.status}, ${communicationOs.notifications.generatedFromCommunications} generated.`}
        />
      </div>
    </section>
  );
}
