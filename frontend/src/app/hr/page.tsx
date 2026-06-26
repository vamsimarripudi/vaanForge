import { AppShell } from "@/layouts/AppShell";
import { HrDashboard } from "@/features/hr/components/HrDashboard";

export default function HrPage() {
  return (
    <AppShell>
      <HrDashboard view="hr" />
    </AppShell>
  );
}
