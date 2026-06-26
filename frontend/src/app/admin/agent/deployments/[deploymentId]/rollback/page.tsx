import { AppShell } from "@/layouts/AppShell";
import { AgentDeploymentDashboard } from "@/features/agent/components/AgentDeploymentDashboard";

export default async function AgentDeploymentRollbackPage({ params }: { params: Promise<{ deploymentId: string }> }) {
  const { deploymentId } = await params;
  return (
    <AppShell>
      <AgentDeploymentDashboard mode="rollback" deploymentId={deploymentId} />
    </AppShell>
  );
}
