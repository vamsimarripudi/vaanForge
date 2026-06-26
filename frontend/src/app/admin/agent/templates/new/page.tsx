import { AppShell } from "@/layouts/AppShell";
import { AgentTemplateDashboard } from "@/features/agent/components/AgentTemplateDashboard";

export default function NewAgentTemplatePage() {
  return (
    <AppShell>
      <AgentTemplateDashboard mode="new" />
    </AppShell>
  );
}
