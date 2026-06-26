import { AppShell } from "@/layouts/AppShell";
import { BuilderBillingDashboard } from "@/features/builder/components/BuilderBillingDashboard";

export default function BuilderBillingPlansPage() {
  return (
    <AppShell>
      <BuilderBillingDashboard mode="plans" />
    </AppShell>
  );
}
