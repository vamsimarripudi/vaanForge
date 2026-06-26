"use client";

import { useCallback, useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

interface CustomerSummary {
  customers: number;
  leads: number;
  expectedPipeline: number;
  won: number;
  demoScheduled: number;
}

type CustomerPortalOs = {
  subscription: Array<{ customerId: string; name: string; activePlan: string; status: string }>;
  invoices: Array<{ customerId: string; number: string; status: string; billingRoute: string }>;
  supportTickets: Array<{ customerId: string; route: string; status: string }>;
  productAccess: Array<{ customerId: string; planId: string; entitlementRoute: string; status: string }>;
  announcements: Array<{ title: string; channel: string; route: string }>;
  documents: Array<{ customerId: string; route: string; documentTypes: string[] }>;
  renewalStatus: Array<{ customerId: string; renewalDate: string; status: string }>;
};

const fallbackPortal: CustomerPortalOs = {
  subscription: [],
  invoices: [],
  supportTickets: [],
  productAccess: [],
  announcements: [
    { title: "Workspace launch notice", channel: "ANNOUNCEMENT", route: "/api/v1/communication" },
    { title: "Renewal reminder", channel: "CUSTOMER_FOLLOW_UP", route: "/api/v1/communication" }
  ],
  documents: [],
  renewalStatus: []
};

function SectionList<T extends Record<string, string | number>>({ title, records, fields }: { title: string; records: T[]; fields: Array<keyof T> }) {
  return (
    <section className="rounded-panel border border-line bg-surface p-5 shadow-panel">
      <h2 className="text-xl font-bold">{title}</h2>
      {records.length ? (
        <div className="mt-4 space-y-3">
          {records.map((record, index) => (
            <article key={`${title}-${index}`} className="rounded-md border border-line bg-canvas p-4 text-sm">
              {fields.map((field) => (
                <div key={String(field)} className="flex justify-between gap-4 border-b border-line py-2 last:border-0">
                  <span className="text-ink-muted">{String(field)}</span>
                  <strong className="text-right">{String(record[field])}</strong>
                </div>
              ))}
            </article>
          ))}
        </div>
      ) : (
        <StatePanel state="empty" title="No records" detail={`${title} will appear after customer records are added.`} />
      )}
    </section>
  );
}

export function CustomerPortal() {
  const [summary, setSummary] = useState<CustomerSummary>({ customers: 0, leads: 0, expectedPipeline: 0, won: 0, demoScheduled: 0 });
  const [portal, setPortal] = useState<CustomerPortalOs>(fallbackPortal);
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [lastCustomerId, setLastCustomerId] = useState("");
  const [workflowState, setWorkflowState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [workflowMessage, setWorkflowMessage] = useState("Ready for customer or support entry.");

  const refreshSummary = useCallback(async () => {
    return apiClient<CustomerSummary>("/crm/summary")
      .then((data) => {
        setSummary(data);
        setState(data.customers ? "success" : "empty");
      })
      .catch(() => setState("error"));
  }, []);

  const refreshCustomerPortal = useCallback(async () => {
    try {
      const nextPortal = await apiClient<CustomerPortalOs>("/crm/customer-portal");
      setPortal(nextPortal);
    } catch {
      setPortal(fallbackPortal);
    }
  }, []);

  useEffect(() => {
    void refreshCustomerPortal();
  }, [refreshCustomerPortal]);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  async function createCustomer(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating customer.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const customer = await apiClient<{ id: string }>("/crm/customers", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          activePlan: String(formData.get("activePlan") || ""),
          renewalDate: String(formData.get("renewalDate") || "")
        })
      });
      setLastCustomerId(customer.id);
      await refreshSummary();
      await refreshCustomerPortal();
      setWorkflowState("success");
      setWorkflowMessage("Customer created and portal metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Customer creation failed.");
    }
  }

  async function createSupportTicket(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating support ticket.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient("/support/tickets", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          customerId: String(formData.get("customerId") || lastCustomerId || ""),
          subject: String(formData.get("subject") || ""),
          priority: String(formData.get("priority") || "MEDIUM"),
          status: String(formData.get("status") || "OPEN")
        })
      });
      setWorkflowState("success");
      setWorkflowMessage("Support ticket created for the customer.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Support ticket creation failed.");
    }
  }

  return (
    <section className="py-8">
      <h1 className="text-4xl font-bold">Customer Portal</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Customer subscription, invoice, support ticket, product access, announcement, document, and renewal surfaces.
      </p>
      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <MetricGrid
          metrics={[
            { label: "Customers", value: String(summary.customers), detail: "Portal records" },
            { label: "Subscription", value: String(portal.subscription.length), detail: "Customer plans" },
            { label: "Invoices", value: String(portal.invoices.length), detail: "Billing handoffs" },
            { label: "Support tickets", value: String(portal.supportTickets.length), detail: "Support links" },
            { label: "Documents", value: String(portal.documents.length), detail: "Document OS metadata" },
            { label: "Renewal status", value: String(portal.renewalStatus.length), detail: "Tracked renewals" },
            { label: "State", value: state, detail: "Customer portal status" }
          ]}
        />
      </div>
      <div className="mt-6 flex justify-end">
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={refreshCustomerPortal}>
          Refresh customer portal
        </button>
      </div>
      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <SectionList title="Subscription" records={portal.subscription} fields={["name", "activePlan", "status"]} />
        <SectionList title="Invoices" records={portal.invoices} fields={["number", "status", "billingRoute"]} />
        <SectionList title="Support Tickets" records={portal.supportTickets} fields={["route", "status"]} />
        <SectionList title="Product Access" records={portal.productAccess} fields={["planId", "entitlementRoute", "status"]} />
        <SectionList title="Announcements" records={portal.announcements} fields={["title", "channel", "route"]} />
        <SectionList title="Documents" records={portal.documents.map((item) => ({ ...item, documentTypes: item.documentTypes.join(", ") }))} fields={["route", "documentTypes"]} />
        <SectionList title="Renewal Status" records={portal.renewalStatus} fields={["renewalDate", "status"]} />
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <form action={createCustomer} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Create Customer</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm font-semibold">
              Name
              <input name="name" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Customer name" />
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
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Customer
          </button>
        </form>

        <form action={createSupportTicket} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Open Support Ticket</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm font-semibold">
              Customer ID
              <input name="customerId" defaultValue={lastCustomerId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved customer" />
            </label>
            <label className="text-sm font-semibold">
              Subject
              <input name="subject" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Need onboarding help" />
            </label>
            <label className="text-sm font-semibold">
              Priority
              <select name="priority" defaultValue="MEDIUM" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" defaultValue="OPEN" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="WAITING_ON_CUSTOMER">Waiting on customer</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Ticket
          </button>
        </form>
      </section>
      <div className="mt-6">
        <StatePanel state={workflowState} title="Customer workflow" detail={workflowMessage} />
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Loading portal" detail="Shown while customer data loads." />
        <StatePanel state="empty" title="No customers" detail="Shown before customer records exist." />
        <StatePanel state="error" title="Portal error" detail="Shown when portal APIs fail." />
        <StatePanel state="success" title="Portal ready" detail="Customer records are available." />
      </div>
    </section>
  );
}
