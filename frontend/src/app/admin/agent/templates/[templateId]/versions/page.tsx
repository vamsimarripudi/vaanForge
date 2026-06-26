import { AppShell } from "@/layouts/AppShell";
import { AgentTemplateDashboard } from "@/features/agent/components/AgentTemplateDashboard";

export default async function AgentTemplateVersionsPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  return (
    <AppShell>
      <AgentTemplateDashboard mode="versions" templateId={templateId} />
    </AppShell>
  );
}
