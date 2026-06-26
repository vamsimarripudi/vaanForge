import { AppShell } from "@/layouts/AppShell";
import { AgentDashboard } from "@/features/agent/components/AgentDashboard";

export default function AgentSettingsPage() {
  return (
    <AppShell>
      <AgentDashboard mode="settings" />
    </AppShell>
  );
}
