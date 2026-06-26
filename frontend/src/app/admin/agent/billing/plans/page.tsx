import { AppShell } from "@/layouts/AppShell";
import { BuilderBillingDashboard } from "@/features/builder/components/BuilderBillingDashboard";

export default function AgentBillingPlansPage() {
  return (
    <AppShell>
      <BuilderBillingDashboard mode="adminPlans" />
    </AppShell>
  );
}
