import Link from "next/link";
import { AppShell } from "@/layouts/AppShell";

const routes = [
  ["/education/onboarding", "Onboarding"],
  ["/education/dashboard", "Dashboard"],
  ["/education/students", "Students"],
  ["/education/teachers", "Teachers"],
  ["/education/meetings", "Meetings"],
  ["/education/forms", "Forms"],
  ["/education/support", "Support"],
  ["/education/settings", "Settings"]
];

export default function EducationSuitePage() {
  return (
    <AppShell>
      <section className="py-8">
        <h1 className="text-4xl font-bold">Education Suite</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">For schools, colleges, institutes, coaching centers, and educational organizations.</p>
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
