import { AppShell } from "@/layouts/AppShell";
import { BuilderPortal } from "@/features/builder/components/BuilderPortal";

export default function BuilderPage() {
  return (
    <AppShell>
      <BuilderPortal mode="overview" />
    </AppShell>
  );
}
