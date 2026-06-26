import { AppShell } from "@/layouts/AppShell";
import { VFormixAgentDashboard } from "@/features/vformix-agent/components/VFormixAgentDashboard";

export default async function VFormixSubmissionAgentStatusPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  return (
    <AppShell>
      <VFormixAgentDashboard mode="status" submissionId={submissionId} />
    </AppShell>
  );
}
