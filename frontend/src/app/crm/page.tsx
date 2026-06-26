import { AppShell } from "@/layouts/AppShell";
import { CrmDashboard } from "@/features/crm/components/CrmDashboard";

export default function CrmPage() {
  return (
    <AppShell>
      <CrmDashboard />
    </AppShell>
  );
}
