import { AppShell } from "@/layouts/AppShell";
import { FounderCommandCenter } from "@/features/dashboard/components/FounderCommandCenter";

export default function FounderDashboardPage() {
  return (
    <AppShell>
      <FounderCommandCenter />
    </AppShell>
  );
}
