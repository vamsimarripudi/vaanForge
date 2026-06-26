import { AppShell } from "@/layouts/AppShell";
import { FinanceDashboard } from "@/features/finance/components/FinanceDashboard";

export default function FinancePage() {
  return (
    <AppShell>
      <FinanceDashboard />
    </AppShell>
  );
}
