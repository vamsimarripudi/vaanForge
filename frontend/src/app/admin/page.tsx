import { AppShell } from "@/layouts/AppShell";
import { AuditPanel } from "@/features/audit/components/AuditPanel";
import { StatePanel } from "@/components/StatePanel";

export default function AdminPage() {
  return (
    <AppShell>
      <section className="py-8">
        <h1 className="text-4xl font-bold">Admin</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Founder and administrator workspace for audit visibility, role checks, operational oversight, and launch readiness review.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatePanel state="loading" title="Loading admin" detail="Shown while protected admin data loads." />
          <StatePanel state="empty" title="No events" detail="Shown before audit or admin records exist." />
          <StatePanel state="error" title="Admin error" detail="Shown when permissions or admin APIs fail." />
          <StatePanel state="success" title="Admin ready" detail="Admin workspace respects role permissions and audit coverage." />
        </div>
        <div className="mt-6">
          <AuditPanel />
        </div>
      </section>
    </AppShell>
  );
}
