import { AppShell } from "@/layouts/AppShell";
import { BillingSystemPanel } from "@/features/billing/components/BillingSystemPanel";
import { PlanCatalogPanel } from "@/features/billing/components/PlanCatalogPanel";
import { PlanGrid } from "@/features/billing/components/PlanGrid";
import { educationSuitePlans } from "@/config/plans/educationSuitePlans";
import { vmetronSuitePlans } from "@/config/plans/vmetronSuitePlans";

export default function BillingPage() {
  return (
    <AppShell>
      <section className="py-8">
        <h1 className="text-4xl font-bold">Billing</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Shared suite billing for plan selection, entitlement checks, trial controls, checkout placeholders, and future production payments.
        </p>
      </section>
      <BillingSystemPanel />
      <PlanCatalogPanel />
      <PlanGrid title="Education Suite Billing" plans={educationSuitePlans} />
      <PlanGrid title="VMetron Suite Billing" plans={vmetronSuitePlans} />
    </AppShell>
  );
}
