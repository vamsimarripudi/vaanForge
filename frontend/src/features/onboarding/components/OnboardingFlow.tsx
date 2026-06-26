"use client";

import { useState } from "react";
import Link from "next/link";
import { StatePanel } from "@/components/StatePanel";
import { SuiteCards } from "./SuiteCards";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { SuiteType } from "@vmnexus/shared/types";

type SuiteChoice = "education" | "vmetron";

const businessTypes = ["Startup", "School", "College", "SaaS company", "Event company", "Creator business", "Agency", "Consultancy", "Hospital", "Local business", "Enterprise", "Other"];
const productOptions = ["Vidyaluma", "VaanMeet", "VFormix", "Support", "Customer Portal", "Client Portal", "Billing", "Reports", "Communication", "Promotions"];
const portalOptions = ["Founder", "Admin", "Finance", "HR", "Sales", "Support", "Legal", "CA", "Creator", "Customer", "Partner"];

const recommendedSuite = (businessType: string, productsNeeded: string[]): SuiteType => {
  const normalized = `${businessType} ${productsNeeded.join(" ")}`.toLowerCase();
  return normalized.includes("event") || normalized.includes("creator") || normalized.includes("promotion") ? "VMETRON_SUITE" : "EDUCATION_SUITE";
};

const recommendedPlan = (suiteType: SuiteType, teamSize: string, revenueStage: string) => {
  const scaleSignal = `${teamSize} ${revenueStage}`.toLowerCase();
  const planLevel = scaleSignal.includes("enterprise") || scaleSignal.includes("51") || scaleSignal.includes("100") ? "enterprise" : "growth";
  return suiteType === "EDUCATION_SUITE" ? `education-${planLevel}` : `vmetron-${planLevel}`;
};

const recommendedModules = (portals: string[], complianceNeeds: string, supportNeeds: string) => {
  const modules = new Set(["Onboarding", "Workspace", "Billing", "Reports"]);
  portals.forEach((portal) => modules.add(portal));
  if (complianceNeeds.trim()) {
    modules.add("Compliance");
    modules.add("Legal");
  }
  if (supportNeeds.trim()) {
    modules.add("Support");
  }
  return [...modules];
};

export function OnboardingFlow() {
  const [suite, setSuite] = useState<SuiteChoice>("education");
  const [status, setStatus] = useState<"empty" | "success">("empty");
  const { setPreview } = useWorkspaceStore();

  function createPreview(formData: FormData) {
    const productsNeeded = formData.getAll("productsNeeded").map(String);
    const requiredPortals = formData.getAll("requiredPortals").map(String);
    const businessType = String(formData.get("businessType"));
    const teamSize = String(formData.get("teamSize"));
    const revenueStage = String(formData.get("revenueStage"));
    const suiteType = recommendedSuite(businessType, productsNeeded);
    const modules = recommendedModules(requiredPortals, String(formData.get("complianceNeeds")), String(formData.get("supportNeeds")));

    setPreview({
      founderName: String(formData.get("founderName")),
      organizationName: String(formData.get("companyName")),
      workspaceName: `${String(formData.get("companyName")) || "Founder"} Workspace`,
      suiteType,
      planId: recommendedPlan(suiteType, teamSize, revenueStage),
      businessType,
      country: String(formData.get("country")),
      industry: String(formData.get("industry")),
      teamSize,
      productsNeeded,
      painPoints: String(formData.get("painPoints")),
      revenueStage,
      requiredPortals,
      complianceNeeds: String(formData.get("complianceNeeds")),
      supportNeeds: String(formData.get("supportNeeds")),
      recommendedModules: modules
    });
    setStatus("success");
  }

  return (
    <section className="py-8">
      <h1 className="text-4xl font-bold">Which suite do you want to start with?</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Choose one suite now. Cross-sell can happen after workspace activation, without forcing both suites during
        onboarding.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button className="rounded-panel border border-line bg-surface p-5 text-left shadow-panel" onClick={() => setSuite("education")}>
          <strong>Education Suite</strong>
          <span className="mt-2 block text-sm text-ink-muted">Schools, colleges, institutes.</span>
        </button>
        <button className="rounded-panel border border-line bg-surface p-5 text-left shadow-panel" onClick={() => setSuite("vmetron")}>
          <strong>VMetron Suite</strong>
          <span className="mt-2 block text-sm text-ink-muted">Events, organizers, communities.</span>
        </button>
      </div>

      <form action={createPreview} className="mt-8 rounded-panel border border-line bg-surface p-6 shadow-panel">
          <h2 className="text-2xl font-bold">{suite === "education" ? "Education Suite" : "VMetron Suite"} onboarding</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">
              Founder name
              <input name="founderName" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Vamsi Marripudi" />
            </label>
            <label className="text-sm font-semibold">
              Company name
              <input name="companyName" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="VM nexus Pvt Ltd" />
            </label>
            <label className="text-sm font-semibold">
              Business type
              <select name="businessType" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                {businessTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Country
              <input name="country" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="India" />
            </label>
            <label className="text-sm font-semibold">
              Industry
              <input name="industry" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Education, events, SaaS..." />
            </label>
            <label className="text-sm font-semibold">
              Team size
              <select name="teamSize" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="1-5">1-5</option>
                <option value="6-20">6-20</option>
                <option value="21-50">21-50</option>
                <option value="51-100">51-100</option>
                <option value="100+">100+</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Revenue stage
              <select name="revenueStage" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="Idea">Idea</option>
                <option value="Pre-revenue">Pre-revenue</option>
                <option value="Early revenue">Early revenue</option>
                <option value="Growth">Growth</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Preferred plan
              <select name="preferredPlan" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="growth">Growth</option>
                <option value="scale">Scale</option>
                <option value="trial">Trial</option>
              </select>
            </label>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <fieldset className="rounded-md border border-line p-4">
              <legend className="px-1 text-sm font-semibold">Products needed</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {productOptions.map((product) => (
                  <label key={product} className="flex items-center gap-2 text-sm">
                    <input name="productsNeeded" type="checkbox" value={product} defaultChecked={product === "Support" || product === "Reports"} />
                    {product}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="rounded-md border border-line p-4">
              <legend className="px-1 text-sm font-semibold">Required portals</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {portalOptions.map((portal) => (
                  <label key={portal} className="flex items-center gap-2 text-sm">
                    <input name="requiredPortals" type="checkbox" value={portal} defaultChecked={["Founder", "Admin", "Support"].includes(portal)} />
                    {portal}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold">
              Current pain points
              <textarea name="painPoints" className="mt-2 min-h-28 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Operations, finance, support, hiring..." />
            </label>
            <label className="text-sm font-semibold">
              Compliance needs
              <textarea name="complianceNeeds" className="mt-2 min-h-28 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="GST, company registration, legal review..." />
            </label>
            <label className="text-sm font-semibold">
              Support needs
              <textarea name="supportNeeds" className="mt-2 min-h-28 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Ticketing, escalation, customer help..." />
            </label>
          </div>
          <button
            type="submit"
            className="mt-6 rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white"
          >
            Create workspace preview
          </button>
          {status === "success" ? (
            <Link className="ml-3 inline-flex rounded-md border border-line px-5 py-3 text-sm font-semibold" href="/account">
              Continue to account
            </Link>
          ) : null}
        </form>

      <div className="mt-8">
        <SuiteCards />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Loading state" detail="Skeleton and progress states are available for async setup." />
        <StatePanel state="empty" title="Empty state" detail="Shown before a suite, plan, or workspace exists." />
        <StatePanel state="error" title="Error state" detail="Used when validation, payment, or API checks fail." />
        <StatePanel state={status} title="Workspace state" detail={status === "success" ? "Workspace preview created." : "Waiting for onboarding."} />
      </div>
    </section>
  );
}
