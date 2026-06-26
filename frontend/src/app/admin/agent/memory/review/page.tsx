import { AppShell } from "@/layouts/AppShell";
import { AgentMemoryDashboard } from "@/features/agent/components/AgentMemoryDashboard";

export default function AgentMemoryReviewPage() {
  return (
    <AppShell>
      <AgentMemoryDashboard mode="review" />
    </AppShell>
  );
}
