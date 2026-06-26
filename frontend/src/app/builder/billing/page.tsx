import { AppShell } from "@/layouts/AppShell";
import { BuilderBillingDashboard } from "@/features/builder/components/BuilderBillingDashboard";

export default function BuilderBillingPage() {
  return (
    <AppShell>
      <BuilderBillingDashboard mode="overview" />
    </AppShell>
  );
}
