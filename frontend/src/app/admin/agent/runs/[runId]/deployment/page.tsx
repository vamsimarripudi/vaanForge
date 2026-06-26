import { AppShell } from "@/layouts/AppShell";
import { AgentDeploymentDashboard } from "@/features/agent/components/AgentDeploymentDashboard";

export default async function AgentRunDeploymentPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return (
    <AppShell>
      <AgentDeploymentDashboard mode="run" runId={runId} />
    </AppShell>
  );
}
