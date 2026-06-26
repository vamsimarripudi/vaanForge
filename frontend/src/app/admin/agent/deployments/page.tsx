import { AppShell } from "@/layouts/AppShell";
import { AgentDeploymentDashboard } from "@/features/agent/components/AgentDeploymentDashboard";

export default function AgentDeploymentsPage() {
  return (
    <AppShell>
      <AgentDeploymentDashboard mode="list" />
    </AppShell>
  );
}
