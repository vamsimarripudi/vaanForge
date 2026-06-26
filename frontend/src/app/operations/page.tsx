import { AppShell } from "@/layouts/AppShell";
import { OperationsDashboard } from "@/features/operations/components/OperationsDashboard";

export default function OperationsPage() {
  return (
    <AppShell>
      <OperationsDashboard />
    </AppShell>
  );
}
