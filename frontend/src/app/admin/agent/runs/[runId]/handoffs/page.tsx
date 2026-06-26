import { AppShell } from "@/layouts/AppShell";
import { AgentTeamDashboard } from "@/features/agent/components/AgentTeamDashboard";

export default async function AgentRunHandoffsPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return (
    <AppShell>
      <AgentTeamDashboard mode="handoffs" runId={runId} />
    </AppShell>
  );
}
