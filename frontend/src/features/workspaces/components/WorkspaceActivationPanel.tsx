"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient } from "@/services/apiClient";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { SuiteType } from "@vmnexus/shared/types";

const defaultPlanBySuite: Record<SuiteType, string> = {
  EDUCATION_SUITE: "education-growth",
  VMETRON_SUITE: "vmetron-growth"
};

export function WorkspaceActivationPanel() {
  const { preview, setPreview } = useWorkspaceStore();
  const [suiteType, setSuiteType] = useState<SuiteType>(preview?.suiteType || "EDUCATION_SUITE");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Activate a workspace after choosing suite and plan.");

  async function activate(formData: FormData) {
    setStatus("loading");
    const request = {
      organizationName: String(formData.get("organizationName")),
      workspaceName: String(formData.get("workspaceName")),
      suiteType,
      planId: String(formData.get("planId"))
    };
    setPreview(request);

    try {
      await apiClient("/workspaces", {
        method: "POST",
        body: JSON.stringify(request)
      });
      setStatus("success");
      setMessage("Workspace activated with plan entitlements.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Workspace activation failed.");
    }
  }

  return (
    <form action={activate} className="rounded-panel border border-line bg-surface p-6 shadow-panel">
      <h2 className="text-2xl font-bold">Workspace Activation</h2>
      <p className="mt-2 text-sm text-ink-muted">{message}</p>
      {preview?.recommendedModules?.length ? (
        <div className="mt-4 rounded-md border border-line bg-muted p-3">
          <p className="text-xs font-semibold uppercase text-accent">Recommended modules</p>
          <p className="mt-2 text-sm text-ink-muted">{preview.recommendedModules.join(", ")}</p>
        </div>
      ) : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">
          Organization name
          <input name="organizationName" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue={preview?.organizationName || "VM nexus Pvt Ltd"} />
        </label>
        <label className="text-sm font-semibold">
          Workspace name
          <input name="workspaceName" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue={preview?.workspaceName || "Founder Workspace"} />
        </label>
        <label className="text-sm font-semibold">
          Suite
          <select className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" value={suiteType} onChange={(event) => setSuiteType(event.target.value as SuiteType)}>
            <option value="EDUCATION_SUITE">Education Suite</option>
            <option value="VMETRON_SUITE">VMetron Suite</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Plan
          <input name="planId" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue={preview?.planId || defaultPlanBySuite[suiteType]} />
        </label>
      </div>
      <button className="mt-5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Activating..." : "Activate workspace"}
      </button>
      {status === "success" ? (
        <div className="mt-5 rounded-md border border-line bg-muted p-4">
          <p className="text-sm font-semibold text-brand">Success state: workspace is ready.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white" href="/founder/dashboard">
              Founder dashboard
            </Link>
            <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold" href={suiteType === "EDUCATION_SUITE" ? "/education/dashboard" : "/vmetron/dashboard"}>
              Suite dashboard
            </Link>
            <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold" href="/operations">
              Operations
            </Link>
            <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold" href="/settings">
              Settings
            </Link>
          </div>
        </div>
      ) : null}
      {status === "error" ? <p className="mt-3 text-sm font-semibold text-red-700">Error state: {message}</p> : null}
    </form>
  );
}
