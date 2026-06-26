import { AppShell } from "@/layouts/AppShell";
import { CustomerPortal } from "@/features/customer/components/CustomerPortal";

export default function CustomerPage() {
  return (
    <AppShell>
      <CustomerPortal />
    </AppShell>
  );
}
