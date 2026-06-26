import { AppShell } from "@/layouts/AppShell";
import { BuilderPortal } from "@/features/builder/components/BuilderPortal";

export default function BuilderProjectsPage() {
  return (
    <AppShell>
      <BuilderPortal mode="projects" />
    </AppShell>
  );
}
