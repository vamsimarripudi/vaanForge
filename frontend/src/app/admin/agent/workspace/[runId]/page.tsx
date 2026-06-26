import { AppShell } from "@/layouts/AppShell";
import { AgentWorkspace } from "@/features/agent/components/AgentWorkspace";

export default async function AgentWorkspaceRunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return (
    <AppShell>
      <AgentWorkspace mode="workspace" runId={runId} />
    </AppShell>
  );
}
