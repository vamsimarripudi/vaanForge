import { AppShell } from "@/layouts/AppShell";
import { VFormixAgentDashboard } from "@/features/vformix-agent/components/VFormixAgentDashboard";

export default async function VFormixFormAgentTriggersPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  return (
    <AppShell>
      <VFormixAgentDashboard mode="triggers" formId={formId} />
    </AppShell>
  );
}
