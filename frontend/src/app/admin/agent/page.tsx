import { AppShell } from "@/layouts/AppShell";
import { AgentDashboard } from "@/features/agent/components/AgentDashboard";

export default function AgentAdminPage() {
  return (
    <AppShell>
      <AgentDashboard mode="overview" />
    </AppShell>
  );
}
