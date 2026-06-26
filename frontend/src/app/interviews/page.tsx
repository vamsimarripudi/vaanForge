import { AppShell } from "@/layouts/AppShell";
import { HrDashboard } from "@/features/hr/components/HrDashboard";

export default function InterviewsPage() {
  return (
    <AppShell>
      <HrDashboard view="interviews" />
    </AppShell>
  );
}
