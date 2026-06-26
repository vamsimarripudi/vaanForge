import { AppShell } from "@/layouts/AppShell";
import { AgentDashboard } from "@/features/agent/components/AgentDashboard";

export default function AgentApprovalsPage() {
  return (
    <AppShell>
      <AgentDashboard mode="approvals" />
    </AppShell>
  );
}
