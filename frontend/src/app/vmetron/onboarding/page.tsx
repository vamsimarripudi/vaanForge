import { OnboardingFlow } from "@/features/onboarding/components/OnboardingFlow";
import { AppShell } from "@/layouts/AppShell";

export default function VMetronOnboardingPage() {
  return (
    <AppShell>
      <section className="py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">VMetron Suite</p>
        <h1 className="mt-2 text-4xl font-bold">VMetron Onboarding</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Event and community onboarding starts with suite selection, plan recommendation, workspace activation, entitlements, and the VMetron dashboard handoff.
        </p>
        <div className="mt-6">
          <OnboardingFlow />
        </div>
        <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">VMetron Suite Questions</h2>
          <div className="mt-4 grid gap-2 text-sm text-ink-muted md:grid-cols-2">
            {[
              "Organization name",
              "Organizer type",
              "Event types",
              "Expected monthly events",
              "Average attendees",
              "Online/offline/hybrid",
              "Registration form needs",
              "Meeting room needs",
              "Promotion/collab needs",
              "Billing needs",
              "Support needs",
              "Preferred plan"
            ].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
