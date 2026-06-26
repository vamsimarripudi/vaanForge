import { AppShell } from "@/layouts/AppShell";
import { ModuleSummaryDashboard } from "@/features/growth/components/ModuleSummaryDashboard";
import { CommunicationOsPanel } from "@/features/communication/components/CommunicationOsPanel";

export default function CommunicationPage() {
  return (
    <AppShell>
      <ModuleSummaryDashboard
        title="Communication OS"
        description="Notifications, announcements, direct messages, team channels, support conversations, customer follow-ups, email templates, and SMS templates."
        endpoint="/communication/summary"
        metricLabels={[
          { key: "messages", label: "Messages", detail: "Communication records" },
          { key: "announcements", label: "Announcements", detail: "Broadcasts" },
          { key: "direct", label: "Direct", detail: "Direct messages" },
          { key: "support", label: "Support", detail: "Support conversations" },
          { key: "followUps", label: "Follow-ups", detail: "Customer follow-ups" },
          { key: "state", label: "State", detail: "Communication status" }
        ]}
        workflow={{
          title: "Create Communication",
          endpoint: "/communication",
          submitLabel: "Save Communication",
          successMessage: "Communication saved and metrics refreshed.",
          fields: [
            {
              name: "channel",
              label: "Channel",
              type: "select",
              defaultValue: "ANNOUNCEMENT",
              options: [
                { label: "Announcement", value: "ANNOUNCEMENT" },
                { label: "Direct", value: "DIRECT" },
                { label: "Team", value: "TEAM" },
                { label: "Support", value: "SUPPORT" },
                { label: "Customer follow-up", value: "CUSTOMER_FOLLOW_UP" }
              ]
            },
            { name: "title", label: "Title", placeholder: "Announcement title" },
            { name: "message", label: "Message", placeholder: "Message body" },
            { name: "audience", label: "Audience", placeholder: "All team members" }
          ]
        }}
        listEndpoint="/communication"
        listTitle="Recent Communications"
        listColumns={[
          { key: "channel", label: "Channel" },
          { key: "title", label: "Title" },
          { key: "audience", label: "Audience" },
          { key: "createdAt", label: "Created" }
        ]}
      />
      <CommunicationOsPanel />
    </AppShell>
  );
}
