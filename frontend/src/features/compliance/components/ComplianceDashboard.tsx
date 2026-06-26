"use client";

import { useCallback, useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

interface ComplianceSummary {
  complianceItems: number;
  completed: number;
  overdue: number;
  registrations: number;
  registrationCompleted: number;
  registrationInProgress: number;
}

interface ComplianceOperatingSystem {
  registrationCatalog: Array<{ type: string; label: string; authority: string; reminder: string; records: number; status: string }>;
  complianceCalendar: Array<{ id: string; title: string; category: string; dueDate: string; status: string; ownerId?: string }>;
  filingReminders: Array<{ label: string; cadence: string; nextDue: string; category: string }>;
  riskSummary: { overdue: number; inProgressRegistrations: number; openCalendarItems: number };
}

const emptyComplianceOs: ComplianceOperatingSystem = {
  registrationCatalog: [],
  complianceCalendar: [],
  filingReminders: [],
  riskSummary: { overdue: 0, inProgressRegistrations: 0, openCalendarItems: 0 }
};

export function ComplianceDashboard({ view }: { view: "compliance" | "registrations" }) {
  const [summary, setSummary] = useState<ComplianceSummary>({
    complianceItems: 0,
    completed: 0,
    overdue: 0,
    registrations: 0,
    registrationCompleted: 0,
    registrationInProgress: 0
  });
  const [complianceOs, setComplianceOs] = useState<ComplianceOperatingSystem>(emptyComplianceOs);
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [workflowState, setWorkflowState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [workflowMessage, setWorkflowMessage] = useState("Ready for compliance or registration entry.");
  const [lastComplianceItemId, setLastComplianceItemId] = useState("");
  const [lastRegistrationId, setLastRegistrationId] = useState("");

  const refreshSummary = useCallback(async () => {
    return Promise.all([apiClient<ComplianceSummary>("/compliance/summary"), apiClient<ComplianceOperatingSystem>("/compliance/operating-system")])
      .then((data) => {
        const [nextSummary, nextComplianceOs] = data;
        setSummary(nextSummary);
        setComplianceOs(nextComplianceOs);
        setState(nextSummary.complianceItems || nextSummary.registrations ? "success" : "empty");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  async function createComplianceItem(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating compliance item.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const item = await apiClient<{ id: string }>("/compliance/items", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          title: String(formData.get("title") || ""),
          category: String(formData.get("category") || ""),
          dueDate: String(formData.get("dueDate") || ""),
          status: String(formData.get("status") || "NOT_STARTED"),
          ownerId: String(formData.get("ownerId") || "")
        })
      });
      setLastComplianceItemId(item.id);
      await refreshSummary();
      setWorkflowState("success");
      setWorkflowMessage("Compliance item created and tracker refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Compliance item creation failed.");
    }
  }

  async function updateComplianceItemStatus(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Updating compliance item status.");
    const itemId = String(formData.get("itemId") || lastComplianceItemId || "");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient(`/compliance/items/${itemId}/status`, {
        method: "PATCH",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          status: String(formData.get("status") || "IN_PROGRESS")
        })
      });
      await refreshSummary();
      setWorkflowState("success");
      setWorkflowMessage("Compliance item status updated.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Compliance item status update failed.");
    }
  }

  async function createRegistration(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating registration.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const registration = await apiClient<{ id: string }>("/compliance/registrations", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          type: String(formData.get("type") || "GST"),
          title: String(formData.get("title") || ""),
          status: String(formData.get("status") || "NOT_STARTED"),
          referenceNumber: String(formData.get("referenceNumber") || ""),
          dueDate: String(formData.get("dueDate") || "")
        })
      });
      setLastRegistrationId(registration.id);
      await refreshSummary();
      setWorkflowState("success");
      setWorkflowMessage("Registration created and tracker refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Registration creation failed.");
    }
  }

  async function updateRegistrationStatus(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Updating registration status.");
    const registrationId = String(formData.get("registrationId") || lastRegistrationId || "");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient(`/compliance/registrations/${registrationId}/status`, {
        method: "PATCH",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          status: String(formData.get("status") || "IN_PROGRESS")
        })
      });
      await refreshSummary();
      setWorkflowState("success");
      setWorkflowMessage("Registration status updated.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Registration status update failed.");
    }
  }

  const title = view === "compliance" ? "Compliance Tracker" : "Government Registration Tracker";
  const description =
    view === "compliance"
      ? "GST, filing reminders, compliance calendar, owners, deadlines, and overdue visibility."
      : "Company incorporation, GST, PAN/TAN, DIN/DSC, MCA/ROC, trademark, Startup India, and MSME/Udyam.";

  return (
    <section className="py-8">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">{description}</p>
      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <MetricGrid
          metrics={[
            { label: "Compliance items", value: String(summary.complianceItems), detail: "Calendar records" },
            { label: "Completed", value: String(summary.completed), detail: "Finished compliance work" },
            { label: "Overdue", value: String(summary.overdue), detail: "Needs attention" },
            { label: "Registrations", value: String(summary.registrations), detail: "Government trackers" },
            { label: "In progress", value: String(summary.registrationInProgress), detail: "Registration workflow" },
            { label: "State", value: state, detail: "Compliance API status" }
          ]}
        />
      </div>
      <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <h2 className="text-xl font-bold">Compliance & Government Registration OS</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Registration Catalog</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {complianceOs.registrationCatalog.map((item) => (
                <li key={item.type} className="border-b border-line pb-3 last:border-0">
                  <div className="flex justify-between gap-3">
                    <strong>{item.label}</strong>
                    <span>{item.status}</span>
                  </div>
                  <p className="mt-1 text-ink-muted">{item.authority} / records {item.records}</p>
                  <p className="mt-1 text-ink-muted">{item.reminder}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Compliance Calendar</h3>
            {complianceOs.complianceCalendar.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {complianceOs.complianceCalendar.slice(0, 6).map((item) => (
                  <li key={item.id} className="border-b border-line pb-3 last:border-0">
                    <strong>{item.title}</strong>
                    <p className="mt-1 text-ink-muted">{item.category} / {item.dueDate} / {item.status}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <StatePanel state="empty" title="No calendar items" detail="Compliance calendar entries appear after creation." />
            )}
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Filing Reminders</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {complianceOs.filingReminders.map((reminder) => (
                <li key={reminder.label} className="border-b border-line pb-3 last:border-0">
                  <div className="flex justify-between gap-3">
                    <strong>{reminder.label}</strong>
                    <span>{reminder.cadence}</span>
                  </div>
                  <p className="mt-1 text-ink-muted">{reminder.category} / next due {reminder.nextDue}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-md border border-line bg-surface p-3 text-sm">
              Overdue {complianceOs.riskSummary.overdue} / open {complianceOs.riskSummary.openCalendarItems} / registrations {complianceOs.riskSummary.inProgressRegistrations}
            </div>
          </div>
        </div>
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <form action={createComplianceItem} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Create Compliance Item</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Title
              <input name="title" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Quarterly GST filing" />
            </label>
            <label className="text-sm font-semibold">
              Category
              <input name="category" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="GST" />
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" defaultValue="IN_PROGRESS" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Due date
              <input name="dueDate" type="date" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Owner ID
              <input name="ownerId" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Optional user ID" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Compliance Item
          </button>
        </form>

        <form action={createRegistration} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Create Registration</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Type
              <select name="type" defaultValue="GST" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="INCORPORATION">Incorporation</option>
                <option value="GST">GST</option>
                <option value="PAN_TAN">PAN/TAN</option>
                <option value="DIN_DSC">DIN/DSC</option>
                <option value="MCA_ROC">MCA/ROC</option>
                <option value="TRADEMARK">Trademark</option>
                <option value="STARTUP_INDIA">Startup India</option>
                <option value="MSME_UDYAM">MSME/Udyam</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" defaultValue="IN_PROGRESS" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Title
              <input name="title" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="GST registration" />
            </label>
            <label className="text-sm font-semibold">
              Reference
              <input name="referenceNumber" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Optional reference" />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Due date
              <input name="dueDate" type="date" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Registration
          </button>
        </form>

        <form action={updateComplianceItemStatus} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Update Compliance Status</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Compliance Item ID
              <input name="itemId" defaultValue={lastComplianceItemId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved item" />
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" defaultValue="COMPLETED" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Update Compliance Status
          </button>
        </form>

        <form action={updateRegistrationStatus} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Update Registration Status</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Registration ID
              <input name="registrationId" defaultValue={lastRegistrationId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved registration" />
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" defaultValue="COMPLETED" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Update Status
          </button>
        </form>
      </section>
      <div className="mt-6">
        <StatePanel state={workflowState} title="Compliance workflow" detail={workflowMessage} />
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Loading tracker" detail="Shown while compliance data loads." />
        <StatePanel state="empty" title="No records" detail="Shown before tracker records exist." />
        <StatePanel state="error" title="Tracker error" detail="Shown when tracker APIs fail." />
        <StatePanel state="success" title="Tracker ready" detail={`${title} foundation is available.`} />
      </div>
    </section>
  );
}
