import Link from "next/link";
import { AppShell } from "@/layouts/AppShell";
import { StatePanel } from "@/components/StatePanel";

type PublicInfoPageProps = {
  title: string;
  description: string;
  sections: Array<{ title: string; detail: string }>;
};

export function PublicInfoPage({ title, description, sections }: PublicInfoPageProps) {
  return (
    <AppShell>
      <section className="py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Public Website</p>
            <h1 className="mt-2 text-4xl font-bold">{title}</h1>
            <p className="mt-3 max-w-2xl text-ink-muted">{description}</p>
          </div>
          <Link className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" href="/onboarding">
            Start onboarding
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {sections.map((section) => (
            <section key={section.title} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
              <h2 className="text-xl font-bold">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-muted">{section.detail}</p>
            </section>
          ))}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatePanel state="loading" title="Loading" detail="Shown while public content or plan data loads." />
          <StatePanel state="empty" title="Empty" detail="Shown before a public content block is configured." />
          <StatePanel state="error" title="Error" detail="Shown when public content fails to load." />
          <StatePanel state="success" title="Ready" detail="Public website content is available." />
        </div>
      </section>
    </AppShell>
  );
}
