import Link from "next/link";
import { productLabels } from "@vmnexus/shared/suites";

const suites = [
  {
    title: "Education Suite",
    description: "For schools, colleges, institutes, coaching centers, and educational organizations.",
    products: ["VIDYALUMA", "VAANMEET", "VFORMIX", "SUPPORT"] as const,
    href: "/onboarding"
  },
  {
    title: "VMetron Suite",
    description: "For events, organizers, communities, businesses, creators, colleges, and webinars.",
    products: ["VMETRON", "VAANMEET", "VFORMIX", "SUPPORT"] as const,
    href: "/onboarding"
  }
] as const;

export function SuiteCards() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {suites.map((suite) => (
        <article key={suite.title} className="rounded-panel border border-line bg-surface p-6 shadow-panel">
          <h2 className="text-2xl font-bold">{suite.title}</h2>
          <p className="mt-3 text-ink-muted">{suite.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {suite.products.map((product) => (
              <span key={product} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                {productLabels[product]}
              </span>
            ))}
          </div>
          <Link href={suite.href} className="mt-6 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">
            Start
          </Link>
        </article>
      ))}
    </section>
  );
}
