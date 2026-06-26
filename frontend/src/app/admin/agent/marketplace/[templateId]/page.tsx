import { AppShell } from "@/layouts/AppShell";
import { AgentTemplateDashboard } from "@/features/agent/components/AgentTemplateDashboard";

export default async function AgentMarketplaceDetailPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  return (
    <AppShell>
      <AgentTemplateDashboard mode="marketplaceDetail" templateId={templateId} />
    </AppShell>
  );
}
