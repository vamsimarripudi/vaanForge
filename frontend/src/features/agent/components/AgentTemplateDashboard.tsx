"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { agentTemplateApi, type TemplatePayload } from "../services/agentTemplateApi";
import type { AgentTemplate } from "../types.templates";

type Mode = "templates" | "new" | "detail" | "edit" | "versions" | "preview" | "marketplace" | "marketplaceDetail";

const blankPayload: TemplatePayload = {
  name: "",
  slug: "",
  category: "",
  description: "",
  previewImage: "",
  stack: [],
  requiredInputs: [],
  optionalInputs: [],
  includedScreens: [],
  includedApis: [],
  databaseModels: [],
  designTokens: ["colors", "spacing", "radius", "typography"],
  securityRules: ["Authenticated admin APIs", "Role-based permissions", "Input validation"],
  validationRules: ["Architecture validation", "Design system validation", "Required fields validation", "Security validation", "Build/lint/type-check validation"],
  priority: "HIGH",
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  changelog: "Initial template draft."
};

export function AgentTemplateDashboard({ mode, templateId }: { mode: Mode; templateId?: string }) {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [detail, setDetail] = useState<AgentTemplate | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");
  const [payload, setPayload] = useState<TemplatePayload>(blankPayload);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const list = mode === "marketplace" || mode === "marketplaceDetail" ? await agentTemplateApi.marketplace() : await agentTemplateApi.templates();
        if (!mounted) return;
        setTemplates(list);
        if (templateId) {
          const item = mode === "marketplaceDetail" ? await agentTemplateApi.marketplaceTemplate(templateId) : await agentTemplateApi.template(templateId);
          if (!mounted) return;
          setDetail(item);
          setPayload(toPayload(item));
        }
        setState(list.length || templateId || mode === "new" ? "success" : "empty");
      } catch {
        if (mounted) setState("error");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [mode, templateId]);

  const filtered = useMemo(() => {
    return templates.filter((template) => {
      const q = query.toLowerCase();
      return [template.name, template.slug, template.category].some((item) => item.toLowerCase().includes(q)) && (category === "all" || template.category === category);
    });
  }, [category, query, templates]);

  async function submitTemplate() {
    if (!window.confirm(templateId ? "Save a new version of this template?" : "Create this template as a draft?")) return;
    const saved = templateId ? await agentTemplateApi.update(templateId, payload) : await agentTemplateApi.create(payload);
    setDetail(saved);
    window.alert(`Template saved: ${saved.name}`);
  }

  async function templateAction(action: "archive" | "clone" | "publish" | "unpublish" | "rollback") {
    if (!templateId || !window.confirm(`Confirm ${action} for this template?`)) return;
    const result = await agentTemplateApi.action(templateId, action);
    setDetail(result);
  }

  async function useTemplate() {
    if (!detail) return;
    const values: Record<string, unknown> = {};
    for (const input of detail.requiredInputs) {
      const value = window.prompt(input.label || input.key);
      if (!value) return;
      values[input.key] = input.key === "targetUsers" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value;
    }
    if (!window.confirm(`Create a VaanForge run from ${detail.name}?`)) return;
    const run = await agentTemplateApi.use(detail.templateId, values);
    window.alert(`Agent run created: ${run.runId || run.executionId}`);
  }

  const title = mode === "marketplace" || mode === "marketplaceDetail" ? "Agent Marketplace" : mode === "new" ? "New Template" : "Agent Templates";

  return (
    <section className="py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">Reusable VaanForge patterns with version history, quality gates, approval workflow, and VFormix-ready required inputs.</p>
        </div>
        <span className="rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {[
          ["/admin/agent", "Overview"],
          ["/admin/agent/templates", "Templates"],
          ["/admin/agent/templates/new", "New"],
          ["/admin/agent/marketplace", "Marketplace"],
          ["/admin/agent/runs", "Runs"]
        ].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted">{label}</Link>
        ))}
      </nav>

      {state === "error" ? <StatePanel state="error" title="Templates unavailable" detail="Check admin permissions and template API health." /> : null}
      {mode === "templates" || mode === "marketplace" ? (
        <>
          <section className="mt-6 grid gap-3 rounded-panel border border-line bg-surface p-4 shadow-panel md:grid-cols-3">
            <input className="rounded-md border border-line bg-canvas px-3 py-2" placeholder="Search templates" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="rounded-md border border-line bg-canvas px-3 py-2" value={category} onChange={(event) => setCategory(event.target.value)}>
              {["all", ...new Set(templates.map((template) => template.category))].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Link className="rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-white" href="/admin/agent/templates/new">Create template</Link>
          </section>
          <TemplateGrid templates={filtered} marketplace={mode === "marketplace"} />
        </>
      ) : null}

      {mode === "new" || mode === "edit" ? <TemplateForm payload={payload} setPayload={setPayload} onSubmit={submitTemplate} /> : null}
      {(mode === "detail" || mode === "preview" || mode === "marketplaceDetail") && detail ? (
        <TemplateDetail template={detail} marketplace={mode === "marketplaceDetail"} onAction={templateAction} onUse={useTemplate} />
      ) : null}
      {mode === "versions" && detail ? <Versions template={detail} onRollback={() => templateAction("rollback")} /> : null}
    </section>
  );
}

function TemplateGrid({ templates, marketplace }: { templates: AgentTemplate[]; marketplace: boolean }) {
  if (!templates.length) return <StatePanel state="empty" title="No templates" detail="Create and publish a template to make it available in the marketplace." />;
  return (
    <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <Link key={template.templateId} href={marketplace ? `/admin/agent/marketplace/${template.templateId}` : `/admin/agent/templates/${template.templateId}`} className="rounded-panel border border-line bg-surface p-5 shadow-panel hover:border-primary">
          <p className="text-xs font-semibold uppercase text-accent">{template.category} · {template.status}</p>
          <h2 className="mt-2 text-xl font-bold">{template.name}</h2>
          <p className="mt-2 text-sm text-ink-muted">{template.description}</p>
          <div className="mt-4 grid gap-2 text-xs text-ink-muted">
            <span>Version {template.version}</span>
            <span>{template.includedScreens.length} screens · {template.includedApis.length} APIs · {template.databaseModels.length} models</span>
          </div>
        </Link>
      ))}
    </section>
  );
}

function TemplateDetail({ template, marketplace, onAction, onUse }: { template: AgentTemplate; marketplace: boolean; onAction: (action: "archive" | "clone" | "publish" | "unpublish" | "rollback") => void; onUse: () => void }) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
      <div className="space-y-4">
        <Panel title={template.name}>
          <p className="text-sm text-ink-muted">{template.description}</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <Mini label="Category" value={template.category} />
            <Mini label="Status" value={template.status} />
            <Mini label="Version" value={template.version} />
            <Mini label="Next action" value={template.nextAction} />
          </div>
        </Panel>
        <Panel title="Template Detail">
          <List label="Features" items={template.includedScreens} />
          <List label="Required inputs" items={template.requiredInputs.map((input) => `${input.key} (${input.inputType || "text"})`)} />
          <List label="Tech stack" items={template.stack} />
          <List label="Included APIs" items={template.includedApis} />
          <List label="Database models" items={template.databaseModels} />
        </Panel>
      </div>
      <aside className="space-y-4">
        <Panel title="Quality Gates">
          {(template.qualityChecks || []).map((check) => <Mini key={check.checkId} label={`${check.checkName} · ${check.status}`} value={check.message} />)}
        </Panel>
        <Panel title="Actions">
          <button className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={onUse}>Use template</button>
          {!marketplace ? (
            <div className="grid gap-2">
              {(["publish", "unpublish", "archive", "clone", "rollback"] as const).map((action) => (
                <button key={action} className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={() => onAction(action)}>{action}</button>
              ))}
            </div>
          ) : null}
        </Panel>
      </aside>
    </section>
  );
}

function TemplateForm({ payload, setPayload, onSubmit }: { payload: TemplatePayload; setPayload: (payload: TemplatePayload) => void; onSubmit: () => void }) {
  function update(key: keyof TemplatePayload, value: string) {
    const listFields = ["stack", "includedScreens", "includedApis", "databaseModels", "designTokens", "securityRules", "validationRules"];
    setPayload({ ...payload, [key]: listFields.includes(String(key)) ? toList(value) : value });
  }
  return (
    <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <div className="grid gap-3 md:grid-cols-2">
        {(["name", "slug", "category", "description"] as const).map((key) => <input key={key} className="rounded-md border border-line bg-canvas px-3 py-2" placeholder={key} value={String(payload[key] || "")} onChange={(event) => update(key, event.target.value)} />)}
        <textarea className="rounded-md border border-line bg-canvas px-3 py-2 md:col-span-2" placeholder="Required inputs as comma-separated keys" value={payload.requiredInputs.map((input) => input.key).join(", ")} onChange={(event) => setPayload({ ...payload, requiredInputs: toList(event.target.value).map((key) => ({ key, label: key, inputType: key === "dueDate" ? "date" : "text", required: true })) })} />
        {(["stack", "includedScreens", "includedApis", "databaseModels", "designTokens", "securityRules", "validationRules"] as const).map((key) => <textarea key={key} className="rounded-md border border-line bg-canvas px-3 py-2" placeholder={key} value={(payload[key] as string[]).join(", ")} onChange={(event) => update(key, event.target.value)} />)}
      </div>
      <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={onSubmit}>Save template</button>
    </section>
  );
}

function Versions({ template, onRollback }: { template: AgentTemplate; onRollback: () => void }) {
  return <Panel title="Versions">{template.versions?.length ? template.versions.map((version) => <Mini key={version.versionId} label={`${version.version} · ${version.releaseStatus}`} value={`${version.changelog} · ${version.createdBy}`} />) : <p className="text-sm text-ink-muted">No versions recorded.</p>}<button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={onRollback}>Rollback to approved version</button></Panel>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-panel border border-line bg-surface p-5 shadow-panel"><h3 className="text-lg font-bold">{title}</h3><div className="mt-4 space-y-3">{children}</div></section>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line bg-muted p-3"><p className="text-xs font-semibold uppercase text-accent">{label}</p><p className="mt-1 break-words text-sm">{value}</p></div>;
}

function List({ label, items }: { label: string; items: string[] }) {
  return <div><p className="text-xs font-semibold uppercase text-accent">{label}</p><div className="mt-2 flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-md border border-line bg-muted px-2 py-1 text-xs">{item}</span>)}</div></div>;
}

function toList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function toPayload(template: AgentTemplate): TemplatePayload {
  return {
    name: template.name,
    slug: template.slug,
    category: template.category,
    description: template.description,
    previewImage: template.previewImage,
    stack: template.stack,
    requiredInputs: template.requiredInputs,
    optionalInputs: template.optionalInputs,
    includedScreens: template.includedScreens,
    includedApis: template.includedApis,
    databaseModels: template.databaseModels,
    designTokens: template.designTokens,
    securityRules: template.securityRules,
    validationRules: template.validationRules,
    priority: template.priority,
    dueDate: template.dueDate,
    changelog: "Template edited from dashboard."
  };
}
