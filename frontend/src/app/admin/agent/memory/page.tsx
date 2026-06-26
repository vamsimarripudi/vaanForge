import { AppShell } from "@/layouts/AppShell";
import { AgentMemoryDashboard } from "@/features/agent/components/AgentMemoryDashboard";

export default function AgentMemoryPage() {
  return (
    <AppShell>
      <AgentMemoryDashboard mode="memory" />
    </AppShell>
  );
}
