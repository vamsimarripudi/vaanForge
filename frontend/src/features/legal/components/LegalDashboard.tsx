"use client";

import { useCallback, useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

interface LegalSummary {
  agreements: number;
  drafts: number;
  inReview: number;
  signed: number;
  expiring: number;
  disclaimer?: string;
}

interface AgreementRecord {
  id: string;
  type: string;
  title: string;
  partyName?: string;
  status: string;
  expiresAt?: string;
  createdAt: string;
}

interface LegalOperatingSystem {
  agreementCatalog: Array<{ type: string; label: string; purpose: string; records: number }>;
  policyRegister: Array<{ type: string; label: string; route: string; status: string; records: number }>;
  awarenessNotes: Array<{ title: string; note: string }>;
  disclaimer: string;
}

const emptyLegalOperatingSystem: LegalOperatingSystem = {
  agreementCatalog: [],
  policyRegister: [],
  awarenessNotes: [],
  disclaimer: "This document workflow is an operational helper, not legal advice. Review with a qualified legal professional before use."
};

export function LegalDashboard() {
  const [summary, setSummary] = useState<LegalSummary>({ agreements: 0, drafts: 0, inReview: 0, signed: 0, expiring: 0 });
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [legalOs, setLegalOs] = useState<LegalOperatingSystem>(emptyLegalOperatingSystem);
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [workflowState, setWorkflowState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [workflowMessage, setWorkflowMessage] = useState("Ready for agreement entry.");
  const [lastAgreementId, setLastAgreementId] = useState("");

  const refreshSummary = useCallback(async () => {
    return apiClient<LegalSummary>("/legal/summary")
      .then((data) => {
        setSummary(data);
        setState(data.agreements ? "success" : "empty");
      })
      .catch(() => setState("error"));
  }, []);

  const refreshAgreements = useCallback(async () => {
    const [records, operatingSystem] = await Promise.all([
      apiClient<AgreementRecord[]>("/legal/agreements").catch(() => []),
      apiClient<LegalOperatingSystem>("/legal/operating-system").catch(() => emptyLegalOperatingSystem)
    ]);
    setAgreements(records);
    setLegalOs(operatingSystem);
  }, []);

  useEffect(() => {
    void refreshSummary();
    void refreshAgreements();
  }, [refreshAgreements, refreshSummary]);

  async function createAgreement(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating agreement.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const agreement = await apiClient<{ id: string }>("/legal/agreements", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          type: String(formData.get("type") || "NDA"),
          title: String(formData.get("title") || ""),
          partyName: String(formData.get("partyName") || ""),
          status: String(formData.get("status") || "DRAFT"),
          expiresAt: String(formData.get("expiresAt") || "")
        })
      });
      setLastAgreementId(agreement.id);
      await refreshSummary();
      await refreshAgreements();
      setWorkflowState("success");
      setWorkflowMessage("Agreement created and legal metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Agreement creation failed.");
    }
  }

  async function updateAgreementStatus(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Updating agreement status.");
    const agreementId = String(formData.get("agreementId") || lastAgreementId || "");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient(`/legal/agreements/${agreementId}/status`, {
        method: "PATCH",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          status: String(formData.get("status") || "IN_REVIEW")
        })
      });
      await refreshSummary();
      await refreshAgreements();
      setWorkflowState("success");
      setWorkflowMessage("Agreement status updated and legal metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Agreement status update failed.");
    }
  }

  return (
    <section className="py-8">
      <h1 className="text-4xl font-bold">Legal Document OS</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Founder, co-founder, employee, NDA, client, vendor, terms, privacy, refund, and data-policy workflows.
      </p>
      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <MetricGrid
          metrics={[
            { label: "Agreements", value: String(summary.agreements), detail: "Total legal records" },
            { label: "Drafts", value: String(summary.drafts), detail: "Needs drafting" },
            { label: "In review", value: String(summary.inReview), detail: "Needs legal review" },
            { label: "Signed", value: String(summary.signed), detail: "Completed documents" },
            { label: "Expiring", value: String(summary.expiring), detail: "Next 30 days" },
            { label: "State", value: state, detail: "Legal API status" }
          ]}
        />
      </div>
      <aside className="mt-6 rounded-panel border border-line bg-muted p-5">
        <p className="text-sm font-semibold text-accent">Legal disclaimer</p>
        <p className="mt-2 text-sm text-ink-muted">
          {summary.disclaimer || "This document workflow is an operational helper, not legal advice. Review with a qualified legal professional before use."}
        </p>
      </aside>
      <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <h2 className="text-xl font-bold">Legal OS</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Agreement Catalog</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {legalOs.agreementCatalog.map((item) => (
                <li key={item.type} className="border-b border-line pb-3 last:border-0">
                  <div className="flex justify-between gap-3">
                    <strong>{item.label}</strong>
                    <span>{item.records}</span>
                  </div>
                  <p className="mt-1 text-ink-muted">{item.purpose}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Policy Register</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {legalOs.policyRegister.map((item) => (
                <li key={item.type} className="border-b border-line pb-3 last:border-0">
                  <div className="flex justify-between gap-3">
                    <strong>{item.label}</strong>
                    <span>{item.status}</span>
                  </div>
                  <p className="mt-1 text-ink-muted">{item.route} / records {item.records}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Legal Awareness Notes</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {legalOs.awarenessNotes.map((item) => (
                <li key={item.title} className="border-b border-line pb-3 last:border-0">
                  <strong>{item.title}</strong>
                  <p className="mt-1 text-ink-muted">{item.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <form action={createAgreement} className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <h2 className="text-xl font-bold">Create Agreement</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Type
            <select name="type" defaultValue="NDA" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
              <option value="FOUNDER_AGREEMENT">Founder agreement</option>
              <option value="COFOUNDER_AGREEMENT">Co-founder agreement</option>
              <option value="EMPLOYEE_AGREEMENT">Employee agreement</option>
              <option value="NDA">NDA</option>
              <option value="CLIENT_AGREEMENT">Client agreement</option>
              <option value="VENDOR_AGREEMENT">Vendor agreement</option>
              <option value="TERMS">Terms</option>
              <option value="PRIVACY">Privacy</option>
              <option value="REFUND_POLICY">Refund policy</option>
              <option value="DATA_POLICY">Data policy</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Status
            <select name="status" defaultValue="DRAFT" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
              <option value="DRAFT">Draft</option>
              <option value="IN_REVIEW">In review</option>
              <option value="APPROVED">Approved</option>
              <option value="SIGNED">Signed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Title
            <input name="title" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Client agreement" />
          </label>
          <label className="text-sm font-semibold">
            Party
            <input name="partyName" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Counterparty name" />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Expires
            <input name="expiresAt" type="date" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" />
          </label>
        </div>
        <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
          Save Agreement
        </button>
      </form>
      <form action={updateAgreementStatus} className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <h2 className="text-xl font-bold">Update Agreement Status</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Agreement ID
            <input name="agreementId" defaultValue={lastAgreementId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved agreement" />
          </label>
          <label className="text-sm font-semibold">
            Status
            <select name="status" defaultValue="IN_REVIEW" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
              <option value="DRAFT">Draft</option>
              <option value="IN_REVIEW">In review</option>
              <option value="APPROVED">Approved</option>
              <option value="SIGNED">Signed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </label>
        </div>
        <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
          Update Status
        </button>
      </form>
      <div className="mt-6">
        <StatePanel state={workflowState} title="Legal workflow" detail={workflowMessage} />
      </div>
      <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Recent Agreements</h2>
            <p className="mt-1 text-sm text-ink-muted">Live records from the legal agreement register.</p>
          </div>
          <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" type="button" onClick={() => void refreshAgreements()}>
            Refresh agreements
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-ink-muted">
              <tr>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Party</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Expires</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((agreement) => (
                <tr key={agreement.id} className="border-b border-line/70">
                  <td className="py-3 pr-3 font-semibold">{agreement.title}</td>
                  <td className="py-3 pr-3">{agreement.type.replaceAll("_", " ")}</td>
                  <td className="py-3 pr-3">{agreement.partyName || "Unassigned"}</td>
                  <td className="py-3 pr-3">{agreement.status.replaceAll("_", " ")}</td>
                  <td className="py-3 pr-3">{agreement.expiresAt ? new Date(agreement.expiresAt).toLocaleDateString() : "No expiry"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {agreements.length === 0 ? <p className="mt-4 text-sm text-ink-muted">No agreements have been saved yet.</p> : null}
        </div>
      </section>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Loading legal" detail="Shown while agreements load." />
        <StatePanel state="empty" title="No agreements" detail="Shown before legal documents exist." />
        <StatePanel state="error" title="Legal error" detail="Shown when legal APIs fail." />
        <StatePanel state="success" title="Legal ready" detail="Agreement workflows are available." />
      </div>
    </section>
  );
}
