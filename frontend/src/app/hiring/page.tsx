import { AppShell } from "@/layouts/AppShell";
import { HrDashboard } from "@/features/hr/components/HrDashboard";

export default function HiringPage() {
  return (
    <AppShell>
      <HrDashboard view="hiring" />
    </AppShell>
  );
}
