import { AppShell } from "@/layouts/AppShell";
import { BuilderPortal } from "@/features/builder/components/BuilderPortal";

export default async function BuilderChangeRequestsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <AppShell>
      <BuilderPortal mode="changes" projectId={projectId} />
    </AppShell>
  );
}
