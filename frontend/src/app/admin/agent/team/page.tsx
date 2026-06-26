import { AppShell } from "@/layouts/AppShell";
import { AgentTeamDashboard } from "@/features/agent/components/AgentTeamDashboard";

export default function AgentTeamPage() {
  return (
    <AppShell>
      <AgentTeamDashboard mode="team" />
    </AppShell>
  );
}
