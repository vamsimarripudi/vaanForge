import { AppShell } from "@/layouts/AppShell";
import { AgentDashboard } from "@/features/agent/components/AgentDashboard";

export default function AgentRunsPage() {
  return (
    <AppShell>
      <AgentDashboard mode="runs" />
    </AppShell>
  );
}
