import { AppShell } from "@/layouts/AppShell";
import { AutomationOsPanel } from "@/features/automation/components/AutomationOsPanel";
import { ModuleSummaryDashboard } from "@/features/growth/components/ModuleSummaryDashboard";

export default function AutomationPage() {
  return (
    <AppShell>
      <ModuleSummaryDashboard
        title="Automation Engine"
        description="Triggers, actions, conditions, approval rules, follow-up automation, renewal reminders, report generation, and task creation."
        endpoint="/automation/summary"
        metricLabels={[
          { key: "rules", label: "Rules", detail: "Automation rules" },
          { key: "active", label: "Active", detail: "Running rules" },
          { key: "paused", label: "Paused", detail: "Paused rules" },
          { key: "approvalRequired", label: "Approvals", detail: "Rules requiring approval" },
          { key: "state", label: "State", detail: "Automation status" },
          { key: "runs", label: "Runs", detail: "Execution log pending" }
        ]}
        workflow={{
          title: "Create Automation Rule",
          endpoint: "/automation/rules",
          submitLabel: "Save Rule",
          successMessage: "Automation rule saved and metrics refreshed.",
          fields: [
            { name: "name", label: "Name", placeholder: "Notify on new lead" },
            {
              name: "trigger",
              label: "Trigger",
              type: "select",
              defaultValue: "LEAD_CREATED",
              options: [
                { label: "Lead created", value: "LEAD_CREATED" },
                { label: "Ticket created", value: "TICKET_CREATED" },
                { label: "Renewal due", value: "RENEWAL_DUE" },
                { label: "Report ready", value: "REPORT_READY" },
                { label: "Task overdue", value: "TASK_OVERDUE" }
              ]
            },
            {
              name: "action",
              label: "Action",
              type: "select",
              defaultValue: "SEND_NOTIFICATION",
              options: [
                { label: "Create task", value: "CREATE_TASK" },
                { label: "Send notification", value: "SEND_NOTIFICATION" },
                { label: "Queue report", value: "QUEUE_REPORT" },
                { label: "Request approval", value: "REQUEST_APPROVAL" }
              ]
            },
            {
              name: "status",
              label: "Status",
              type: "select",
              defaultValue: "ACTIVE",
              options: [
                { label: "Draft", value: "DRAFT" },
                { label: "Active", value: "ACTIVE" },
                { label: "Paused", value: "PAUSED" }
              ]
            },
            { name: "approvalRequired", label: "Approval required", type: "checkbox", defaultValue: false }
          ]
        }}
        listEndpoint="/automation/rules"
        listTitle="Recent Automation Rules"
        listColumns={[
          { key: "name", label: "Name" },
          { key: "trigger", label: "Trigger" },
          { key: "action", label: "Action" },
          { key: "status", label: "Status" }
        ]}
      />
      <AutomationOsPanel />
    </AppShell>
  );
}
