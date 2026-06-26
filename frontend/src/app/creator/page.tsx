import { AppShell } from "@/layouts/AppShell";
import { CreatorPortalPanel } from "@/features/creator/components/CreatorPortalPanel";
import { ModuleSummaryDashboard } from "@/features/growth/components/ModuleSummaryDashboard";

export default function CreatorPage() {
  return (
    <AppShell>
      <ModuleSummaryDashboard
        title="Creator Portal"
        description="Campaigns, billing, ideas, concept sharing, approval flow, brand guidelines, payouts, and performance tracking."
        endpoint="/creators/summary"
        metricLabels={[
          { key: "creators", label: "Creators", detail: "Creator profiles" },
          { key: "campaigns", label: "Campaigns", detail: "Campaign records" },
          { key: "activeCampaigns", label: "Active", detail: "Live campaigns" },
          { key: "approvals", label: "Approvals", detail: "Needs review" },
          { key: "payoutPending", label: "Payouts", detail: "Pending payouts" },
          { key: "state", label: "State", detail: "Portal status" }
        ]}
        workflows={[
          {
            title: "Create Creator Profile",
            endpoint: "/creators/profiles",
            submitLabel: "Save Creator",
            successMessage: "Creator profile saved and metrics refreshed.",
            fields: [
              { name: "name", label: "Name", placeholder: "Creator name" },
              { name: "niche", label: "Niche", placeholder: "Events" },
              { name: "payoutStatus", label: "Payout status", placeholder: "PENDING", defaultValue: "PENDING" }
            ]
          },
          {
            title: "Create Campaign",
            endpoint: "/creators/campaigns",
            submitLabel: "Save Campaign",
            successMessage: "Campaign saved and approval metrics refreshed.",
            fields: [
              { name: "creatorId", label: "Creator ID", placeholder: "Optional creator ID", optional: true },
              { name: "title", label: "Title", placeholder: "Launch campaign" },
              {
                name: "status",
                label: "Status",
                type: "select",
                defaultValue: "IN_REVIEW",
                options: [
                  { label: "Draft", value: "DRAFT" },
                  { label: "In review", value: "IN_REVIEW" },
                  { label: "Approved", value: "APPROVED" },
                  { label: "Active", value: "ACTIVE" },
                  { label: "Completed", value: "COMPLETED" }
                ]
              },
              { name: "budget", label: "Budget", type: "number", defaultValue: 0 }
            ]
          }
        ]}
        lists={[
          {
            endpoint: "/creators/profiles",
            title: "Recent Creator Profiles",
            columns: [
              { key: "name", label: "Name" },
              { key: "niche", label: "Niche" },
              { key: "payoutStatus", label: "Payout" },
              { key: "createdAt", label: "Created" }
            ]
          },
          {
            endpoint: "/creators/campaigns",
            title: "Recent Campaigns",
            columns: [
              { key: "title", label: "Title" },
              { key: "status", label: "Status" },
              { key: "budget", label: "Budget" },
              { key: "createdAt", label: "Created" }
            ]
          }
        ]}
      />
      <CreatorPortalPanel />
    </AppShell>
  );
}
