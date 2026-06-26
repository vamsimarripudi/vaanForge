import { AppShell } from "@/layouts/AppShell";
import { BuilderPortal } from "@/features/builder/components/BuilderPortal";

export default async function BuilderRequirementsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <AppShell>
      <BuilderPortal mode="requirements" projectId={projectId} />
    </AppShell>
  );
}
