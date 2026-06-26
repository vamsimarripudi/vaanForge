import { AppShell } from "@/layouts/AppShell";
import { AgentWorkspace } from "@/features/agent/components/AgentWorkspace";

export default async function AgentWorkspaceLivePage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return (
    <AppShell>
      <AgentWorkspace mode="live" runId={runId} />
    </AppShell>
  );
}
