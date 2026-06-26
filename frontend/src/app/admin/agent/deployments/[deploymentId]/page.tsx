import { AppShell } from "@/layouts/AppShell";
import { AgentDeploymentDashboard } from "@/features/agent/components/AgentDeploymentDashboard";

export default async function AgentDeploymentDetailPage({ params }: { params: Promise<{ deploymentId: string }> }) {
  const { deploymentId } = await params;
  return (
    <AppShell>
      <AgentDeploymentDashboard mode="detail" deploymentId={deploymentId} />
    </AppShell>
  );
}
