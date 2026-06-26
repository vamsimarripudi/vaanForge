"use client";

import { useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

type AutomationOs = {
  triggers: Array<{ trigger: string; purpose: string }>;
  actions: Array<{ action: string; route: string }>;
  conditions: Array<{ condition: string; appliesTo: string }>;
  approvalRules: Array<{ ruleId: string; name: string; trigger: string; action: string; status: string }>;
  followUpAutomation: Array<{ ruleId: string; name: string; action: string; destination: string }>;
  renewalReminders: Array<{ ruleId: string; name: string; action: string; destination: string }>;
  reportGeneration: Array<{ ruleId: string; name: string; route: string; status: string }>;
  taskCreation: Array<{ ruleId: string; name: string; route: string; status: string }>;
  templates: Array<{ title: string; trigger: string; action: string }>;
};

const fallbackAutomationOs: AutomationOs = {
  triggers: [
    { trigger: "LEAD_CREATED", purpose: "Start sales follow-up automation." },
    { trigger: "TICKET_CREATED", purpose: "Notify support owners and create escalation tasks." },
    { trigger: "RENEWAL_DUE", purpose: "Send renewal reminders before plan expiry." },
    { trigger: "REPORT_READY", purpose: "Notify founders when report generation completes." },
    { trigger: "TASK_OVERDUE", purpose: "Create recovery tasks and approval checks." }
  ],
  actions: [
    { action: "CREATE_TASK", route: "/api/v1/tasks" },
    { action: "SEND_NOTIFICATION", route: "/api/v1/notifications" },
    { action: "QUEUE_REPORT", route: "/api/v1/reports/exports" },
    { action: "REQUEST_APPROVAL", route: "/api/v1/audit" }
  ],
  conditions: [
    { condition: "status === ACTIVE", appliesTo: "All automation runs" },
    { condition: "approvalRequired === true", appliesTo: "Approval rules" },
    { condition: "trigger matches source event", appliesTo: "Follow-up, renewal, report, and task flows" }
  ],
  approvalRules: [],
  followUpAutomation: [],
  renewalReminders: [],
  reportGeneration: [],
  taskCreation: [],
  templates: [
    { title: "Lead follow-up", trigger: "LEAD_CREATED", action: "SEND_NOTIFICATION" },
    { title: "Renewal reminder", trigger: "RENEWAL_DUE", action: "SEND_NOTIFICATION" },
    { title: "Monthly report generation", trigger: "REPORT_READY", action: "QUEUE_REPORT" },
    { title: "Overdue task recovery", trigger: "TASK_OVERDUE", action: "CREATE_TASK" }
  ]
};

function SectionList<T extends Record<string, string>>({ title, records, fields }: { title: string; records: T[]; fields: Array<keyof T> }) {
  return (
    <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
      <h2 className="text-xl font-bold">{title}</h2>
      {records.length ? (
        <div className="mt-4 space-y-3">
          {records.map((record, index) => (
            <article key={`${title}-${index}`} className="rounded-md border border-line bg-canvas p-4 text-sm">
              {fields.map((field) => (
                <div key={String(field)} className="flex justify-between gap-4 border-b border-line py-2 last:border-0">
                  <span className="text-ink-muted">{String(field)}</span>
                  <strong className="text-right">{record[field]}</strong>
                </div>
              ))}
            </article>
          ))}
        </div>
      ) : (
        <StatePanel state="empty" title="No records" detail={`${title} will appear after matching automation rules are added.`} />
      )}
    </section>
  );
}

export function AutomationOsPanel() {
  const [automationOs, setAutomationOs] = useState<AutomationOs>(fallbackAutomationOs);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  async function refreshAutomationOs() {
    setState("loading");
    try {
      const nextAutomationOs = await apiClient<AutomationOs>("/automation/operating-system");
      setAutomationOs(nextAutomationOs);
      setState("success");
    } catch {
      setAutomationOs(fallbackAutomationOs);
      setState("error");
    }
  }

  useEffect(() => {
    void refreshAutomationOs();
  }, []);

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Automation OS</h1>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Triggers, actions, conditions, approval rules, follow-up automation, renewal reminders, report generation, and task creation.
          </p>
        </div>
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={refreshAutomationOs}>
          Refresh automation OS
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SectionList title="Triggers" records={automationOs.triggers} fields={["trigger", "purpose"]} />
        <SectionList title="Actions" records={automationOs.actions} fields={["action", "route"]} />
        <SectionList title="Conditions" records={automationOs.conditions} fields={["condition", "appliesTo"]} />
        <SectionList title="Approval Rules" records={automationOs.approvalRules} fields={["name", "trigger", "action", "status"]} />
        <SectionList title="Follow-up Automation" records={automationOs.followUpAutomation} fields={["name", "action", "destination"]} />
        <SectionList title="Renewal Reminders" records={automationOs.renewalReminders} fields={["name", "action", "destination"]} />
        <SectionList title="Report Generation" records={automationOs.reportGeneration} fields={["name", "route", "status"]} />
        <SectionList title="Task Creation" records={automationOs.taskCreation} fields={["name", "route", "status"]} />
        <SectionList title="Automation Templates" records={automationOs.templates} fields={["title", "trigger", "action"]} />
      </div>

      <div className="mt-6">
        <StatePanel state={state === "success" ? "success" : state === "error" ? "error" : "loading"} title="Automation operating system" detail="Automation OS records are available." />
      </div>
    </section>
  );
}
