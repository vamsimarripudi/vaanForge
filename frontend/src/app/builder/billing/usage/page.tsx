import { AppShell } from "@/layouts/AppShell";
import { BuilderBillingDashboard } from "@/features/builder/components/BuilderBillingDashboard";

export default function BuilderBillingUsagePage() {
  return (
    <AppShell>
      <BuilderBillingDashboard mode="usage" />
    </AppShell>
  );
}
