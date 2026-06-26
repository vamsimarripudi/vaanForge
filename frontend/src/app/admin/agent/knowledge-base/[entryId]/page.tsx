import { AppShell } from "@/layouts/AppShell";
import { AgentMemoryDashboard } from "@/features/agent/components/AgentMemoryDashboard";

export default async function AgentKnowledgeEntryPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  return (
    <AppShell>
      <AgentMemoryDashboard mode="knowledgeDetail" entryId={entryId} />
    </AppShell>
  );
}
