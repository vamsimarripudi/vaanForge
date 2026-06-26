import { AppShell } from "@/layouts/AppShell";
import { AgentTeamDashboard } from "@/features/agent/components/AgentTeamDashboard";

export default async function AgentRunTeamPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return (
    <AppShell>
      <AgentTeamDashboard mode="run" runId={runId} />
    </AppShell>
  );
}
