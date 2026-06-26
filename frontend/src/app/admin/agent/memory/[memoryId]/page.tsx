import { AppShell } from "@/layouts/AppShell";
import { AgentMemoryDashboard } from "@/features/agent/components/AgentMemoryDashboard";

export default async function AgentMemoryDetailPage({ params }: { params: Promise<{ memoryId: string }> }) {
  const { memoryId } = await params;
  return (
    <AppShell>
      <AgentMemoryDashboard mode="detail" memoryId={memoryId} />
    </AppShell>
  );
}
