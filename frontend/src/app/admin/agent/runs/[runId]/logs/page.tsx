import { AppShell } from "@/layouts/AppShell";
import { AgentDashboard } from "@/features/agent/components/AgentDashboard";

export default async function AgentRunLogsPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return (
    <AppShell>
      <AgentDashboard mode="logs" runId={runId} />
    </AppShell>
  );
}
