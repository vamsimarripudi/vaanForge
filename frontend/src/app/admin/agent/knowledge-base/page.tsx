import { AppShell } from "@/layouts/AppShell";
import { AgentMemoryDashboard } from "@/features/agent/components/AgentMemoryDashboard";

export default function AgentKnowledgeBasePage() {
  return (
    <AppShell>
      <AgentMemoryDashboard mode="knowledge" />
    </AppShell>
  );
}
