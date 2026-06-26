import { AppShell } from "@/layouts/AppShell";
import { BuilderPortal } from "@/features/builder/components/BuilderPortal";

export default function NewBuilderProjectPage() {
  return (
    <AppShell>
      <BuilderPortal mode="new" />
    </AppShell>
  );
}
