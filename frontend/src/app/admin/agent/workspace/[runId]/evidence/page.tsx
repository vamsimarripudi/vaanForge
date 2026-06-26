import { AppShell } from "@/layouts/AppShell";
import { AgentWorkspace } from "@/features/agent/components/AgentWorkspace";

export default async function AgentWorkspaceEvidencePage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return (
    <AppShell>
      <AgentWorkspace mode="evidence" runId={runId} />
    </AppShell>
  );
}
