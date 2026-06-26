"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { enterpriseApi } from "../services/enterpriseApi";

type Mode = "onboarding" | "workspace" | "team" | "security" | "data" | "adminEnterprise" | "adminSecurity" | "adminReliability" | "adminCompliance" | "launch";

export function EnterpriseLaunchDashboard({ mode }: { mode: Mode }) {
  const [data, setData] = useState<Record<string, unknown> | unknown[] | null>(null);
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await ({
          onboarding: enterpriseApi.workspace,
          workspace: enterpriseApi.workspace,
          team: enterpriseApi.team,
          security: enterpriseApi.auditLogs,
          data: enterpriseApi.usageReports,
          adminEnterprise: enterpriseApi.launchReadiness,
          adminSecurity: enterpriseApi.securityReport,
          adminReliability: enterpriseApi.reliabilityReport,
          adminCompliance: enterpriseApi.complianceReport,
          launch: enterpriseApi.launchReadiness
        }[mode])();
        if (!mounted) return;
        setData(result);
        setState("success");
      } catch (error) {
        if (mounted) {
          setMessage(error instanceof Error ? error.message : "Enterprise launch data unavailable.");
          setState("error");
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [mode]);

  async function updateWorkspace() {
    if (!window.confirm("Update workspace hardening settings?")) return;
    setData(await enterpriseApi.updateWorkspace({ name: "VaanForge Builder Workspace", ssoReady: true, retentionDays: 365 }));
  }

  async function inviteMember() {
    const email = window.prompt("Invite email") || "";
    const roleId = firstRoleId(data);
    if (!email || !roleId) return;
    if (!window.confirm(`Invite ${email}?`)) return;
    await enterpriseApi.invite({ email, roleId });
    setData(await enterpriseApi.team());
  }

  async function exportData() {
    if (!window.confirm("Create a tracked data export request?")) return;
    setData(await enterpriseApi.exportData(["profile", "projects", "billing", "audit", "outputs"]));
  }

  async function deleteData() {
    const reason = window.prompt("Deletion request reason") || "";
    if (reason.length < 10) return;
    if (!window.confirm("Create a tracked data delete request?")) return;
    setData(await enterpriseApi.deleteRequest(reason));
  }

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Enterprise Launch</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{titleFor(mode)}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">Security, reliability, compliance, onboarding, workspace controls, and launch readiness backed by stored evidence.</p>
        </div>
        <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {[
          ["/builder/onboarding", "Onboarding"],
          ["/builder/settings/workspace", "Workspace"],
          ["/builder/settings/team", "Team"],
          ["/builder/settings/security", "Security"],
          ["/builder/settings/data", "Data"],
          ["/admin/agent/enterprise", "Enterprise"],
          ["/admin/agent/security", "Admin Security"],
          ["/admin/agent/reliability", "Reliability"],
          ["/admin/agent/compliance", "Compliance"],
          ["/admin/agent/launch-readiness", "Launch"]
        ].map(([href, label]) => <Link key={href} href={href} className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted">{label}</Link>)}
      </nav>
      {state === "error" ? <StatePanel state="error" title="Enterprise data unavailable" detail={message} /> : null}
      {mode === "workspace" ? <button className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={updateWorkspace}>Apply hardening defaults</button> : null}
      {mode === "team" ? <button className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={inviteMember}>Invite team member</button> : null}
      {mode === "data" ? <div className="mt-6 flex flex-wrap gap-2"><button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={exportData}>Request export</button><button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" onClick={deleteData}>Request deletion</button></div> : null}
      <Panel title="Evidence">
        <pre className="max-h-[620px] overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(data || {}, null, 2)}</pre>
      </Panel>
    </section>
  );
}

function titleFor(mode: Mode) {
  return ({ onboarding: "Builder Onboarding", workspace: "Workspace Management", team: "Team Roles", security: "Security Audit Logs", data: "Data and Usage Controls", adminEnterprise: "Enterprise Controls", adminSecurity: "Security Dashboard", adminReliability: "Reliability Dashboard", adminCompliance: "Compliance Dashboard", launch: "Launch Readiness" } as const)[mode];
}

function firstRoleId(data: unknown) {
  const roles = typeof data === "object" && data && "roles" in data ? (data as { roles?: Array<{ roleId: string }> }).roles : undefined;
  return roles?.[0]?.roleId;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid gap-3">{children}</div></section>;
}
