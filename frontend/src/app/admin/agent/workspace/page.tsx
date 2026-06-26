import { AppShell } from "@/layouts/AppShell";
import { AgentWorkspace } from "@/features/agent/components/AgentWorkspace";

export default function AgentWorkspacePage() {
  return (
    <AppShell>
      <AgentWorkspace mode="overview" />
    </AppShell>
  );
}
