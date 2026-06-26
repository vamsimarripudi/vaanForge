import { AppShell } from "@/layouts/AppShell";
import { LegalDashboard } from "@/features/legal/components/LegalDashboard";

export default function LegalPage() {
  return (
    <AppShell>
      <LegalDashboard />
    </AppShell>
  );
}
