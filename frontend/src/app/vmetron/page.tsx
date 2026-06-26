import Link from "next/link";
import { AppShell } from "@/layouts/AppShell";

const routes = [
  ["/vmetron/onboarding", "Onboarding"],
  ["/vmetron/dashboard", "Dashboard"],
  ["/vmetron/events", "Events"],
  ["/vmetron/registrations", "Registrations"],
  ["/vmetron/meetings", "Meetings"],
  ["/vmetron/forms", "Forms"],
  ["/vmetron/promotions", "Promotions"],
  ["/vmetron/support", "Support"],
  ["/vmetron/settings", "Settings"]
];

export default function VMetronSuitePage() {
  return (
    <AppShell>
      <section className="py-8">
        <h1 className="text-4xl font-bold">VMetron Suite</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">For events, organizers, communities, creators, businesses, colleges, webinars, and event managers.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {routes.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-panel border border-line bg-surface p-5 font-semibold shadow-panel">
              {label}
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
