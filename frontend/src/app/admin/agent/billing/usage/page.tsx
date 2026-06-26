import { AppShell } from "@/layouts/AppShell";
import { BuilderBillingDashboard } from "@/features/builder/components/BuilderBillingDashboard";

export default function AgentBillingUsagePage() {
  return (
    <AppShell>
      <BuilderBillingDashboard mode="adminUsage" />
    </AppShell>
  );
}
