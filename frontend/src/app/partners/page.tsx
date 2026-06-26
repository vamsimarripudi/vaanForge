import { AppShell } from "@/layouts/AppShell";
import { ModuleSummaryDashboard } from "@/features/growth/components/ModuleSummaryDashboard";
import { PartnerCollaborationPanel } from "@/features/partners/components/PartnerCollaborationPanel";

export default function PartnersPage() {
  return (
    <AppShell>
      <ModuleSummaryDashboard
        title="Partner Portal"
        description="Partners, collaborations, revenue share, agreements, tasks, approvals, and communications."
        endpoint="/partners/summary"
        metricLabels={[
          { key: "partners", label: "Partners", detail: "Partner records" },
          { key: "active", label: "Active", detail: "Active relationships" },
          { key: "prospects", label: "Prospects", detail: "Partner pipeline" },
          { key: "averageShare", label: "Avg share", detail: "Revenue share percent" },
          { key: "state", label: "State", detail: "Partner API status" },
          { key: "agreements", label: "Agreements", detail: "Legal link pending" }
        ]}
        workflow={{
          title: "Create Partner",
          endpoint: "/partners",
          submitLabel: "Save Partner",
          successMessage: "Partner saved and metrics refreshed.",
          fields: [
            { name: "name", label: "Name", placeholder: "Partner name" },
            {
              name: "status",
              label: "Status",
              type: "select",
              defaultValue: "ACTIVE",
              options: [
                { label: "Prospect", value: "PROSPECT" },
                { label: "Active", value: "ACTIVE" },
                { label: "Paused", value: "PAUSED" },
                { label: "Ended", value: "ENDED" }
              ]
            },
            { name: "revenueSharePercent", label: "Revenue share", type: "number", placeholder: "12" }
          ]
        }}
        listEndpoint="/partners"
        listTitle="Recent Partners"
        listColumns={[
          { key: "name", label: "Name" },
          { key: "status", label: "Status" },
          { key: "revenueSharePercent", label: "Revenue share" },
          { key: "createdAt", label: "Created" }
        ]}
      />
      <PartnerCollaborationPanel />
    </AppShell>
  );
}
