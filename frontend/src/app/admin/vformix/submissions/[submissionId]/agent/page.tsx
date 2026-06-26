import { AppShell } from "@/layouts/AppShell";
import { VFormixAgentDashboard } from "@/features/vformix-agent/components/VFormixAgentDashboard";

export default async function VFormixSubmissionAgentPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  return (
    <AppShell>
      <VFormixAgentDashboard mode="submission" submissionId={submissionId} />
    </AppShell>
  );
}
