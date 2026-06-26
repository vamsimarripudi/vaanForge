import { AppShell } from "@/layouts/AppShell";
import { ComplianceDashboard } from "@/features/compliance/components/ComplianceDashboard";

export default function RegistrationsPage() {
  return (
    <AppShell>
      <ComplianceDashboard view="registrations" />
    </AppShell>
  );
}
