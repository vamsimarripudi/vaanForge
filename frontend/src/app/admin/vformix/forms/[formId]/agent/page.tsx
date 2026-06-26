import { AppShell } from "@/layouts/AppShell";
import { VFormixAgentDashboard } from "@/features/vformix-agent/components/VFormixAgentDashboard";

export default async function VFormixFormAgentPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  return (
    <AppShell>
      <VFormixAgentDashboard mode="config" formId={formId} />
    </AppShell>
  );
}
