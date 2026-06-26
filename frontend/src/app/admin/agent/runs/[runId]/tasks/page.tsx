import { AppShell } from "@/layouts/AppShell";
import { AgentDashboard } from "@/features/agent/components/AgentDashboard";

export default async function AgentRunTasksPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return (
    <AppShell>
      <AgentDashboard mode="tasks" runId={runId} />
    </AppShell>
  );
}
