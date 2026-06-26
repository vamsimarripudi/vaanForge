import { AppShell } from "@/layouts/AppShell";
import { PlanCatalogPanel } from "@/features/billing/components/PlanCatalogPanel";
import { PlanGrid } from "@/features/billing/components/PlanGrid";
import { educationSuitePlans } from "@/config/plans/educationSuitePlans";
import { vmetronSuitePlans } from "@/config/plans/vmetronSuitePlans";

export default function PricingPage() {
  return (
    <AppShell>
      <div className="py-8">
        <h1 className="text-4xl font-bold">Suite Plans</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Pricing values are placeholders until commercial approval. Entitlements, products, support levels, and usage
          limits are configured now so billing can be connected cleanly later.
        </p>
      </div>
      <PlanCatalogPanel />
      <PlanGrid title="Education Suite" plans={educationSuitePlans} />
      <PlanGrid title="VMetron Suite" plans={vmetronSuitePlans} />
    </AppShell>
  );
}
