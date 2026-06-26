import { AppShell } from "@/layouts/AppShell";
import { AgentTeamDashboard } from "@/features/agent/components/AgentTeamDashboard";

export default async function AgentRunReviewsPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return (
    <AppShell>
      <AgentTeamDashboard mode="reviews" runId={runId} />
    </AppShell>
  );
}
