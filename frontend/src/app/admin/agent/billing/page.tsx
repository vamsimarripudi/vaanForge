import { AppShell } from "@/layouts/AppShell";
import { BuilderBillingDashboard } from "@/features/builder/components/BuilderBillingDashboard";

export default function AgentBillingPage() {
  return (
    <AppShell>
      <BuilderBillingDashboard mode="admin" />
    </AppShell>
  );
}
