import { AppShell } from "@/layouts/AppShell";
import { AgentMemoryDashboard } from "@/features/agent/components/AgentMemoryDashboard";

export default function NewAgentMemoryPage() {
  return (
    <AppShell>
      <AgentMemoryDashboard mode="new" />
    </AppShell>
  );
}
