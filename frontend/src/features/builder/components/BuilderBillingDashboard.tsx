"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { builderBillingApi, type BillingCredits, type BillingInvoice, type BillingPlan, type BillingUsage } from "../services/builderBillingApi";

type Mode = "overview" | "plans" | "invoices" | "usage" | "credits" | "admin" | "adminPlans" | "adminUsage";

export function BuilderBillingDashboard({ mode }: { mode: Mode }) {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [credits, setCredits] = useState<BillingCredits | null>(null);
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");
  const [message, setMessage] = useState("");
  const [topup, setTopup] = useState(100);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [nextPlans, nextUsage] = await Promise.all([mode.startsWith("admin") ? builderBillingApi.adminPlans() : builderBillingApi.plans(), mode.startsWith("admin") ? builderBillingApi.adminUsage() : builderBillingApi.usage().catch(() => null)]);
        if (!mounted) return;
        setPlans(nextPlans);
        setUsage(nextUsage);
        if (!mode.startsWith("admin")) {
          setInvoices(await builderBillingApi.invoices().catch(() => []));
          setCredits(await builderBillingApi.credits().catch(() => null));
        }
        setState("success");
      } catch (error) {
        if (mounted) {
          setMessage(error instanceof Error ? error.message : "Billing data unavailable.");
          setState("error");
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [mode]);

  async function subscribe(planId: string) {
    if (!window.confirm("Subscribe to this builder plan?")) return;
    await builderBillingApi.subscribe(planId, "MONTHLY");
    setMessage("Subscription request created.");
    setUsage(await builderBillingApi.usage());
    setCredits(await builderBillingApi.credits());
  }

  async function cancel() {
    if (!window.confirm("Cancel current builder subscription?")) return;
    await builderBillingApi.cancel();
    setMessage("Subscription cancellation recorded.");
  }

  async function topupCredits() {
    if (!window.confirm(`Top up ${topup} AI credits?`)) return;
    setCredits(await builderBillingApi.topup(topup));
  }

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Builder Billing</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Plans, Usage, and Credits</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">Control builder subscriptions, invoices, monthly limits, AI credits, and Razorpay-backed payment state.</p>
        </div>
        <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {[
          ["/builder/billing", "Overview"],
          ["/builder/billing/plans", "Plans"],
          ["/builder/billing/invoices", "Invoices"],
          ["/builder/billing/usage", "Usage"],
          ["/builder/billing/credits", "Credits"],
          ["/admin/agent/billing", "Admin Billing"],
          ["/admin/agent/billing/plans", "Admin Plans"],
          ["/admin/agent/billing/usage", "Admin Usage"]
        ].map(([href, label]) => <Link key={href} href={href} className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted">{label}</Link>)}
      </nav>
      {message ? <p className="mt-4 rounded-md border border-line bg-primary-soft p-3 text-sm font-semibold">{message}</p> : null}
      {state === "error" ? <StatePanel state="error" title="Billing unavailable" detail={message || "Check billing permissions and session state."} /> : null}
      {mode === "overview" || mode === "admin" ? <Overview plans={plans} usage={usage} credits={credits} invoices={invoices} /> : null}
      {mode === "plans" || mode === "adminPlans" ? <Plans plans={plans} onSubscribe={subscribe} admin={mode === "adminPlans"} /> : null}
      {mode === "invoices" ? <Invoices invoices={invoices} /> : null}
      {mode === "usage" || mode === "adminUsage" ? <Usage usage={usage} /> : null}
      {mode === "credits" ? <Credits credits={credits} topup={topup} setTopup={setTopup} onTopup={topupCredits} onCancel={cancel} /> : null}
    </section>
  );
}

function Overview({ plans, usage, credits, invoices }: { plans: BillingPlan[]; usage: BillingUsage | null; credits: BillingCredits | null; invoices: BillingInvoice[] }) {
  return <section className="mt-6 grid gap-4 md:grid-cols-4"><Mini label="Plans" value={String(plans.length)} /><Mini label="Usage metrics" value={String(usage?.limits.length || 0)} /><Mini label="Credit balance" value={String(credits?.wallet.balance || 0)} /><Mini label="Invoices" value={String(invoices.length)} /></section>;
}

function Plans({ plans, onSubscribe, admin }: { plans: BillingPlan[]; onSubscribe: (planId: string) => void; admin: boolean }) {
  if (!plans.length) return <StatePanel state="empty" title="No billing plans" detail="Admin must create or seed billing plans before subscriptions are available." />;
  return <section className="mt-6 grid gap-4 lg:grid-cols-3">{plans.map((plan) => <article key={plan.planId} className="rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="text-xl font-bold">{plan.name}</h2><p className="mt-2 text-sm text-ink-muted">{plan.description}</p><Mini label="Monthly" value={`₹${plan.monthlyPrice / 100}`} /><Mini label="Credits" value={String(plan.creditsIncluded)} /><pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(plan.limits, null, 2)}</pre>{admin ? <p className="text-sm text-ink-muted">{plan.nextAction}</p> : <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={() => onSubscribe(plan.planId)}>Subscribe</button>}</article>)}</section>;
}

function Invoices({ invoices }: { invoices: BillingInvoice[] }) {
  if (!invoices.length) return <StatePanel state="empty" title="No invoices" detail="Invoices appear after subscription, top-up, or payment activity." />;
  return <Panel title="Invoices">{invoices.map((invoice) => <Mini key={invoice.invoiceId} label={`${invoice.number} · ${invoice.status}`} value={`₹${invoice.amount / 100} · due ${new Date(invoice.dueDate).toLocaleDateString()}`} />)}</Panel>;
}

function Usage({ usage }: { usage: BillingUsage | null }) {
  if (!usage) return <StatePanel state="empty" title="No usage" detail="Usage limits are created when a subscription is active." />;
  return <Panel title="Usage Limits">{usage.limits.map((limit) => <Mini key={limit.metric} label={limit.metric} value={`${limit.usedValue}/${limit.limitValue}${limit.adminOverride ? " · override" : ""}`} />)}<pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(usage.events, null, 2)}</pre></Panel>;
}

function Credits(props: { credits: BillingCredits | null; topup: number; setTopup: (value: number) => void; onTopup: () => void; onCancel: () => void }) {
  if (!props.credits) return <StatePanel state="empty" title="No wallet" detail="A credit wallet is created when billing is initialized." />;
  return <Panel title="Credit Wallet"><Mini label="Balance" value={String(props.credits.wallet.balance)} /><Mini label="Lifetime debits" value={String(props.credits.wallet.lifetimeDebits)} /><input className="rounded-md border border-line bg-canvas px-3 py-2" type="number" value={props.topup} onChange={(event) => props.setTopup(Number(event.target.value || 0))} /><div className="flex flex-wrap gap-2"><button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={props.onTopup}>Top up credits</button><button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" onClick={props.onCancel}>Cancel subscription</button></div><pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(props.credits.transactions, null, 2)}</pre></Panel>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid gap-3">{children}</div></section>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line bg-muted p-3"><p className="text-xs font-semibold uppercase text-accent">{label}</p><p className="mt-1 break-words text-sm text-ink">{value}</p></div>;
}
