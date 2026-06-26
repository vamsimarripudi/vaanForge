"use client";

import { useCallback, useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

interface CrmSummary {
  leads: number;
  customers: number;
  expectedPipeline: number;
  won: number;
  demoScheduled: number;
}

type LeadRecord = {
  id: string;
  name: string;
  company?: string;
  stage: string;
  expectedValue?: number;
  createdAt: string;
};

type CustomerRecord = {
  id: string;
  name: string;
  email?: string;
  activePlan?: string;
  renewalDate?: string;
  createdAt: string;
};

type SalesOperations = {
  deals: Array<{ id: string; name: string; company: string; stage: string; value: number; probability: number }>;
  followUps: Array<{ leadId: string; title: string; dueAt: string; channel: string; reason: string }>;
  demoScheduling: Array<{ leadId: string; title: string; meetingMode: string; scheduledAt: string; objective: string }>;
  proposals: Array<{ leadId: string; title: string; status: string; value: number; nextStep: string }>;
  objections: Array<{ label: string; response: string }>;
  renewals: Array<{ customerId: string; name: string; activePlan: string; renewalDate: string; status: string }>;
  salesPsychologyAssistant: { mode: string; prompts: string[]; nextBestAction: string };
};

const emptySummary: CrmSummary = { leads: 0, customers: 0, expectedPipeline: 0, won: 0, demoScheduled: 0 };

const emptySalesOperations: SalesOperations = {
  deals: [],
  followUps: [],
  demoScheduling: [],
  proposals: [],
  objections: [],
  renewals: [],
  salesPsychologyAssistant: { mode: "empty", prompts: [], nextBestAction: "Create a lead to load sales guidance." }
};

export function CrmDashboard() {
  const [summary, setSummary] = useState<CrmSummary>(emptySummary);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [salesOperations, setSalesOperations] = useState<SalesOperations>(emptySalesOperations);
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [workflowState, setWorkflowState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [workflowMessage, setWorkflowMessage] = useState("Ready for lead or customer entry.");
  const [lastLeadId, setLastLeadId] = useState("");

  const refreshSummary = useCallback(async () => {
    return apiClient<CrmSummary>("/crm/summary")
      .then((data) => {
        setSummary(data);
        setState(data.leads || data.customers ? "success" : "empty");
      })
      .catch(() => setState("error"));
  }, []);

  const refreshRecords = useCallback(async () => {
    const [nextLeads, nextCustomers, nextSalesOperations] = await Promise.all([
      apiClient<LeadRecord[]>("/crm/leads").catch(() => []),
      apiClient<CustomerRecord[]>("/crm/customers").catch(() => []),
      apiClient<SalesOperations>("/crm/sales-operations").catch(() => emptySalesOperations)
    ]);
    setLeads(nextLeads.slice(0, 8));
    setCustomers(nextCustomers.slice(0, 8));
    setSalesOperations(nextSalesOperations);
  }, []);

  useEffect(() => {
    void refreshSummary();
    void refreshRecords();
  }, [refreshRecords, refreshSummary]);

  async function createLead(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Saving lead.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const lead = await apiClient<{ id: string }>("/crm/leads", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          name: String(formData.get("name") || ""),
          company: String(formData.get("company") || ""),
          email: String(formData.get("email") || ""),
          phone: String(formData.get("phone") || ""),
          source: String(formData.get("source") || ""),
          stage: String(formData.get("stage") || "NEW"),
          expectedValue: Number(formData.get("expectedValue") || 0)
        })
      });
      setLastLeadId(lead.id);
      await refreshSummary();
      await refreshRecords();
      setWorkflowState("success");
      setWorkflowMessage("Lead saved and pipeline metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Lead creation failed.");
    }
  }

  async function updateLeadStage(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Updating lead stage.");
    const leadId = String(formData.get("leadId") || lastLeadId || "");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient(`/crm/leads/${leadId}/stage`, {
        method: "PATCH",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          stage: String(formData.get("stage") || "CONTACTED")
        })
      });
      await refreshSummary();
      await refreshRecords();
      setWorkflowState("success");
      setWorkflowMessage("Lead stage updated and pipeline metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Lead stage update failed.");
    }
  }

  async function createCustomer(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Saving customer.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient("/crm/customers", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          activePlan: String(formData.get("activePlan") || ""),
          renewalDate: String(formData.get("renewalDate") || "")
        })
      });
      await refreshSummary();
      await refreshRecords();
      setWorkflowState("success");
      setWorkflowMessage("Customer saved and portal metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Customer creation failed.");
    }
  }

  return (
    <section className="py-8">
      <h1 className="text-4xl font-bold">Sales & CRM OS</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Lead capture, demo scheduling, proposal flow, customer records, and renewal visibility.
      </p>
      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <MetricGrid
          metrics={[
            { label: "Leads", value: String(summary.leads), detail: "Pipeline records" },
            { label: "Customers", value: String(summary.customers), detail: "Active customer records" },
            { label: "Pipeline value", value: `₹${summary.expectedPipeline}`, detail: "Expected lead value" },
            { label: "Won", value: String(summary.won), detail: "Closed-won leads" },
            { label: "Demos", value: String(summary.demoScheduled), detail: "Scheduled demos" },
            { label: "State", value: state, detail: "CRM API status" }
          ]}
        />
      </div>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <form action={createLead} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Add Lead</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Name
              <input name="name" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Demo lead" />
            </label>
            <label className="text-sm font-semibold">
              Company
              <input name="company" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Company name" />
            </label>
            <label className="text-sm font-semibold">
              Email
              <input name="email" type="email" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="lead@vmnexus.local" />
            </label>
            <label className="text-sm font-semibold">
              Phone
              <input name="phone" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="+91..." />
            </label>
            <label className="text-sm font-semibold">
              Source
              <input name="source" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Referral" />
            </label>
            <label className="text-sm font-semibold">
              Stage
              <select name="stage" defaultValue="NEW" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="DEMO_SCHEDULED">Demo scheduled</option>
                <option value="PROPOSAL_SENT">Proposal sent</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Expected value
              <input name="expectedValue" type="number" min="0" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="75000" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Lead
          </button>
        </form>

        <form action={createCustomer} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Add Customer</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm font-semibold">
              Name
              <input name="name" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Demo customer" />
            </label>
            <label className="text-sm font-semibold">
              Email
              <input name="email" type="email" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="customer@vmnexus.local" />
            </label>
            <label className="text-sm font-semibold">
              Active plan
              <input name="activePlan" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="vmetron-growth" />
            </label>
            <label className="text-sm font-semibold">
              Renewal date
              <input name="renewalDate" type="date" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Customer
          </button>
        </form>

        <form action={updateLeadStage} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Update Lead Stage</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Lead ID
              <input name="leadId" defaultValue={lastLeadId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved lead" />
            </label>
            <label className="text-sm font-semibold">
              Stage
              <select name="stage" defaultValue="CONTACTED" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="DEMO_SCHEDULED">Demo scheduled</option>
                <option value="PROPOSAL_SENT">Proposal sent</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Update Stage
          </button>
        </form>
      </section>
      <div className="mt-6">
        <StatePanel state={workflowState} title="CRM workflow" detail={workflowMessage} />
      </div>
      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold">Recent Leads</h2>
            <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={() => void refreshRecords()}>
              Refresh CRM records
            </button>
          </div>
          {leads.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-ink-muted">
                  <tr>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Name</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Company</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Stage</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4">{lead.name}</td>
                      <td className="py-3 pr-4">{lead.company || "-"}</td>
                      <td className="py-3 pr-4">{lead.stage}</td>
                      <td className="py-3 pr-4">{lead.expectedValue ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <StatePanel state="empty" title="No leads" detail="Saved leads will appear here." />
          )}
        </div>

        <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold">Recent Customers</h2>
            <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={() => void refreshRecords()}>
              Refresh customers
            </button>
          </div>
          {customers.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-ink-muted">
                  <tr>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Name</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Email</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Plan</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Renewal</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4">{customer.name}</td>
                      <td className="py-3 pr-4">{customer.email || "-"}</td>
                      <td className="py-3 pr-4">{customer.activePlan || "-"}</td>
                      <td className="py-3 pr-4">{customer.renewalDate || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <StatePanel state="empty" title="No customers" detail="Saved customers will appear here." />
          )}
        </div>
      </section>
      <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <h2 className="text-xl font-bold">Sales Operations</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Deals</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {salesOperations.deals.slice(0, 4).map((deal) => (
                <li key={deal.id} className="border-b border-line pb-2 last:border-0">
                  <strong>{deal.name}</strong>
                  <p className="text-ink-muted">{deal.stage} / ₹{deal.value} / {deal.probability}%</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Follow-ups</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {salesOperations.followUps.slice(0, 4).map((followUp) => (
                <li key={`${followUp.leadId}-${followUp.dueAt}`} className="border-b border-line pb-2 last:border-0">
                  <strong>{followUp.title}</strong>
                  <p className="text-ink-muted">{followUp.dueAt} / {followUp.channel} / {followUp.reason}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Demo Scheduling</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {salesOperations.demoScheduling.slice(0, 4).map((demo) => (
                <li key={`${demo.leadId}-${demo.scheduledAt}`} className="border-b border-line pb-2 last:border-0">
                  <strong>{demo.title}</strong>
                  <p className="text-ink-muted">{demo.meetingMode} / {demo.scheduledAt.slice(0, 10)}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Proposals</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {salesOperations.proposals.slice(0, 4).map((proposal) => (
                <li key={proposal.leadId} className="border-b border-line pb-2 last:border-0">
                  <strong>{proposal.title}</strong>
                  <p className="text-ink-muted">{proposal.status} / ₹{proposal.value}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Objections</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {salesOperations.objections.map((objection) => (
                <li key={objection.label} className="border-b border-line pb-2 last:border-0">
                  <strong>{objection.label}</strong>
                  <p className="text-ink-muted">{objection.response}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Renewals</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {salesOperations.renewals.slice(0, 4).map((renewal) => (
                <li key={renewal.customerId} className="border-b border-line pb-2 last:border-0">
                  <strong>{renewal.name}</strong>
                  <p className="text-ink-muted">{renewal.activePlan} / {renewal.renewalDate} / {renewal.status}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-md border border-line bg-canvas p-4">
          <h3 className="font-bold">Sales Psychology Assistant</h3>
          <p className="mt-2 text-sm text-ink-muted">{salesOperations.salesPsychologyAssistant.nextBestAction}</p>
          <ul className="mt-3 grid gap-2 text-sm md:grid-cols-3">
            {salesOperations.salesPsychologyAssistant.prompts.map((prompt) => (
              <li key={prompt} className="rounded-md border border-line bg-surface p-3">
                {prompt}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Loading CRM" detail="Shown while pipeline loads." />
        <StatePanel state="empty" title="No leads" detail="Shown before sales activity exists." />
        <StatePanel state="error" title="CRM error" detail="Shown when CRM APIs fail." />
        <StatePanel state="success" title="Pipeline ready" detail="Leads and customers can be tracked." />
      </div>
    </section>
  );
}
