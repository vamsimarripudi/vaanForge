import { AppShell } from "@/layouts/AppShell";
import { BuilderBillingDashboard } from "@/features/builder/components/BuilderBillingDashboard";

export default function BuilderBillingInvoicesPage() {
  return (
    <AppShell>
      <BuilderBillingDashboard mode="invoices" />
    </AppShell>
  );
}
