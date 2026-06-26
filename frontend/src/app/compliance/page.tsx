import { AppShell } from "@/layouts/AppShell";
import { ComplianceDashboard } from "@/features/compliance/components/ComplianceDashboard";

export default function CompliancePage() {
  return (
    <AppShell>
      <ComplianceDashboard view="compliance" />
    </AppShell>
  );
}
