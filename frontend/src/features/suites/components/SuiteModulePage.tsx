import Link from "next/link";
import { AppShell } from "@/layouts/AppShell";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";

type SuiteModulePageProps = {
  suiteName: string;
  title: string;
  description: string;
  primaryRoute: string;
  product: string;
  metrics: Array<{ label: string; value: string; detail: string }>;
  workflows: string[];
};

export function SuiteModulePage({ suiteName, title, description, primaryRoute, product, metrics, workflows }: SuiteModulePageProps) {
  return (
    <AppShell>
      <section className="py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">{suiteName}</p>
            <h1 className="mt-2 text-4xl font-bold">{title}</h1>
            <p className="mt-3 max-w-2xl text-ink-muted">{description}</p>
          </div>
          <Link className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" href={primaryRoute}>
            Open workflow
          </Link>
        </div>
        <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
          <MetricGrid metrics={metrics} />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatePanel state="loading" title="Loading" detail={`${title} waits for suite-scoped data and permissions.`} />
          <StatePanel state="empty" title="Empty" detail={`Shown before ${product} records exist for this workspace.`} />
          <StatePanel state="error" title="Error" detail="Shown when product entitlement, role permission, or API checks fail." />
          <StatePanel state="success" title="Ready" detail={`${product} is aligned to suite type, active plan, entitlement, and usage limits.`} />
        </div>
        <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Expected Workflows</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {workflows.map((workflow) => (
              <div key={workflow} className="rounded-md border border-line bg-canvas p-4">
                <p className="text-sm font-semibold">{workflow}</p>
                <p className="mt-1 text-sm text-ink-muted">Scoped to this suite workspace and guarded by role permissions.</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
