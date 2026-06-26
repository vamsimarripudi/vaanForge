import { OnboardingFlow } from "@/features/onboarding/components/OnboardingFlow";
import { AppShell } from "@/layouts/AppShell";

export default function EducationOnboardingPage() {
  return (
    <AppShell>
      <section className="py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Education Suite</p>
        <h1 className="mt-2 text-4xl font-bold">Education Onboarding</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Institution onboarding starts with suite selection, plan recommendation, workspace activation, entitlements, and the Education dashboard handoff.
        </p>
        <div className="mt-6">
          <OnboardingFlow />
        </div>
        <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Education Suite Questions</h2>
          <div className="mt-4 grid gap-2 text-sm text-ink-muted md:grid-cols-2">
            {[
              "Institution name",
              "Institution type",
              "School/college/coaching",
              "Number of students",
              "Number of teachers",
              "Admin contact",
              "Required modules",
              "Current pain points",
              "Meeting requirements",
              "Form requirements",
              "Support requirements",
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
