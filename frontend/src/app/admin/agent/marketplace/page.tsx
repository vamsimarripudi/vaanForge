import { AppShell } from "@/layouts/AppShell";
import { AgentTemplateDashboard } from "@/features/agent/components/AgentTemplateDashboard";

export default function AgentMarketplacePage() {
  return (
    <AppShell>
      <AgentTemplateDashboard mode="marketplace" />
    </AppShell>
  );
}
