import { AppShell } from "@/layouts/AppShell";
import { AgentTemplateDashboard } from "@/features/agent/components/AgentTemplateDashboard";

export default function AgentTemplatesPage() {
  return (
    <AppShell>
      <AgentTemplateDashboard mode="templates" />
    </AppShell>
  );
}
