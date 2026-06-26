import { AppShell } from "@/layouts/AppShell";
import { BuilderBillingDashboard } from "@/features/builder/components/BuilderBillingDashboard";

export default function BuilderBillingCreditsPage() {
  return (
    <AppShell>
      <BuilderBillingDashboard mode="credits" />
    </AppShell>
  );
}
