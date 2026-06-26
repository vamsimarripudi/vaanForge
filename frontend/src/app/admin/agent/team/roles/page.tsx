import { AppShell } from "@/layouts/AppShell";
import { AgentTeamDashboard } from "@/features/agent/components/AgentTeamDashboard";

export default function AgentTeamRolesPage() {
  return (
    <AppShell>
      <AgentTeamDashboard mode="roles" />
    </AppShell>
  );
}
