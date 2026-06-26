import { AppShell } from "@/layouts/AppShell";
import { AgentDeploymentDashboard } from "@/features/agent/components/AgentDeploymentDashboard";

export default function NewAgentDeploymentPage() {
  return (
    <AppShell>
      <AgentDeploymentDashboard mode="new" />
    </AppShell>
  );
}
