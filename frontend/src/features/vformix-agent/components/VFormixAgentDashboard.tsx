"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { agentTemplateApi } from "@/features/agent/services/agentTemplateApi";
import type { AgentTemplate } from "@/features/agent/types.templates";
import { vformixAgentApi } from "../services/vformixAgentApi";
import type { VFormixAgentConfig, VFormixAgentFieldMapping, VFormixAgentSubmissionStatus, VFormixAgentTrigger } from "../types";

type Mode = "config" | "mapping" | "triggers" | "submission" | "status";

const defaultMappings: VFormixAgentFieldMapping[] = [
  { mappingId: "draft-product-name", formFieldKey: "productName", agentFieldPath: "productName", required: true, normalizer: "text" },
  { mappingId: "draft-product-slug", formFieldKey: "productSlug", agentFieldPath: "productSlug", required: true, normalizer: "slug" },
  { mappingId: "draft-problem", formFieldKey: "problemStatement", agentFieldPath: "businessContext.problemStatement", required: true, normalizer: "text" },
  { mappingId: "draft-users", formFieldKey: "targetUsers", agentFieldPath: "businessContext.targetUsers", required: true, normalizer: "list" },
  { mappingId: "draft-goals", formFieldKey: "goals", agentFieldPath: "businessContext.goals", required: true, normalizer: "list" },
  { mappingId: "draft-feature", formFieldKey: "coreFeatures", agentFieldPath: "scope.coreFeatures", required: true, normalizer: "list" },
  { mappingId: "draft-owner", formFieldKey: "ownerId", agentFieldPath: "ownerId", required: true, normalizer: "text" },
  { mappingId: "draft-due", formFieldKey: "dueDate", agentFieldPath: "dueDate", required: true, normalizer: "date" },
  { mappingId: "draft-priority", formFieldKey: "priority", agentFieldPath: "priority", required: false, normalizer: "priority", fallbackValue: "HIGH" }
];

export function VFormixAgentDashboard({ mode, formId, submissionId }: { mode: Mode; formId?: string; submissionId?: string }) {
  const effectiveFormId = formId || "manual-form";
  const effectiveSubmissionId = submissionId || "manual-submission";
  const [config, setConfig] = useState<VFormixAgentConfig | null>(null);
  const [mappings, setMappings] = useState<VFormixAgentFieldMapping[]>([]);
  const [triggers, setTriggers] = useState<VFormixAgentTrigger[]>([]);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [status, setStatus] = useState<VFormixAgentSubmissionStatus | null>(null);
  const [rawSubmission, setRawSubmission] = useState(JSON.stringify(sampleSubmission(effectiveFormId), null, 2));
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [configData, mappingData, triggerData, templateData] = await Promise.all([
          vformixAgentApi.config(effectiveFormId),
          vformixAgentApi.mapping(effectiveFormId),
          vformixAgentApi.triggers(effectiveFormId),
          agentTemplateApi.marketplace()
        ]);
        if (!mounted) return;
        setConfig(configData);
        setMappings(mappingData.length ? mappingData : defaultMappings);
        setTriggers(triggerData);
        setTemplates(templateData);
        if (mode === "submission" || mode === "status") {
          try {
            setStatus(await vformixAgentApi.status(effectiveSubmissionId));
          } catch {
            setStatus(null);
          }
        }
        setState("success");
      } catch {
        if (mounted) setState("error");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [effectiveFormId, effectiveSubmissionId, mode]);

  const enabledTriggers = useMemo(() => triggers.filter((trigger) => trigger.enabled).length, [triggers]);

  async function saveConfig() {
    if (!config || !window.confirm("Save VFormix agent configuration?")) return;
    setConfig(await vformixAgentApi.updateConfig(effectiveFormId, config));
  }

  async function saveMapping() {
    if (!window.confirm("Save field mappings for this form?")) return;
    setMappings(await vformixAgentApi.updateMapping(effectiveFormId, mappings));
  }

  async function saveTriggers() {
    if (!window.confirm("Save trigger rules for this form?")) return;
    setTriggers(await vformixAgentApi.updateTriggers(effectiveFormId, triggers));
  }

  async function runSubmission() {
    if (!window.confirm(`Trigger VaanForge from submission ${effectiveSubmissionId}?`)) return;
    const parsed = JSON.parse(rawSubmission) as Record<string, unknown>;
    setStatus(await vformixAgentApi.runSubmission(effectiveSubmissionId, { formId: effectiveFormId, rawSubmission: parsed, allowDuplicate: true }));
  }

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">VFormix Agent Integration</h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">Connect VFormix submissions to VaanForge planning, template matching, approval, and Coding Agent workflows.</p>
        </div>
        <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/vformix/forms/${effectiveFormId}/agent`}>Config</Link>
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/vformix/forms/${effectiveFormId}/agent/mapping`}>Mapping</Link>
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/vformix/forms/${effectiveFormId}/agent/triggers`}>Triggers</Link>
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/vformix/submissions/${effectiveSubmissionId}/agent`}>Submission</Link>
        <Link className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted" href={`/admin/vformix/submissions/${effectiveSubmissionId}/agent/status`}>Status</Link>
      </nav>

      {state === "error" ? <StatePanel state="error" title="VFormix agent data unavailable" detail="Check admin permissions, session state, and backend route registration." /> : null}
      {mode === "config" && config ? <ConfigPanel config={config} setConfig={setConfig} templates={templates} enabledTriggers={enabledTriggers} onSave={saveConfig} /> : null}
      {mode === "mapping" ? <MappingPanel mappings={mappings} setMappings={setMappings} onSave={saveMapping} /> : null}
      {mode === "triggers" ? <TriggerPanel triggers={triggers} setTriggers={setTriggers} onSave={saveTriggers} /> : null}
      {mode === "submission" ? <SubmissionPanel rawSubmission={rawSubmission} setRawSubmission={setRawSubmission} onRun={runSubmission} status={status} /> : null}
      {mode === "status" ? <StatusPanel status={status} submissionId={effectiveSubmissionId} /> : null}
    </section>
  );
}

function ConfigPanel(props: { config: VFormixAgentConfig; setConfig: (value: VFormixAgentConfig) => void; templates: AgentTemplate[]; enabledTriggers: number; onSave: () => void }) {
  const { config, setConfig } = props;
  return (
    <Panel title="Agent-Enabled Form">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="rounded-md border border-line bg-muted p-3 text-sm"><input className="mr-2" type="checkbox" checked={config.enabled} onChange={(event) => setConfig({ ...config, enabled: event.target.checked })} />Agent enabled</label>
        <input className="rounded-md border border-line bg-canvas px-3 py-2" value={config.ownerId} onChange={(event) => setConfig({ ...config, ownerId: event.target.value })} placeholder="Owner ID" />
        <input className="rounded-md border border-line bg-canvas px-3 py-2" value={config.dueDate || ""} onChange={(event) => setConfig({ ...config, dueDate: event.target.value })} placeholder="Due date" />
        <select className="rounded-md border border-line bg-canvas px-3 py-2" value={config.priority} onChange={(event) => setConfig({ ...config, priority: event.target.value as VFormixAgentConfig["priority"] })}>
          {["LOW", "MEDIUM", "HIGH", "URGENT"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="rounded-md border border-line bg-canvas px-3 py-2" value={config.status} onChange={(event) => setConfig({ ...config, status: event.target.value as VFormixAgentConfig["status"] })}>
          {["draft", "active", "paused"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="rounded-md border border-line bg-canvas px-3 py-2" value={config.defaultTemplateId || ""} onChange={(event) => setConfig({ ...config, defaultTemplateId: event.target.value || undefined })}>
          <option value="">Auto-match template</option>
          {props.templates.map((template) => <option key={template.templateId} value={template.templateId}>{template.name}</option>)}
        </select>
      </div>
      <Mini label="Enabled triggers" value={String(props.enabledTriggers)} />
      <Mini label="Next action" value={config.nextAction} />
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={props.onSave}>Save configuration</button>
    </Panel>
  );
}

function MappingPanel(props: { mappings: VFormixAgentFieldMapping[]; setMappings: (value: VFormixAgentFieldMapping[]) => void; onSave: () => void }) {
  const update = (index: number, patch: Partial<VFormixAgentFieldMapping>) => props.setMappings(props.mappings.map((mapping, itemIndex) => (itemIndex === index ? { ...mapping, ...patch } : mapping)));
  return (
    <Panel title="Field Mapping">
      {props.mappings.map((mapping, index) => (
        <div key={mapping.mappingId || index} className="grid gap-2 rounded-md border border-line bg-muted p-3 md:grid-cols-[1fr_1fr_0.8fr_0.5fr]">
          <input className="rounded-md border border-line bg-canvas px-3 py-2" value={mapping.formFieldKey} onChange={(event) => update(index, { formFieldKey: event.target.value })} />
          <input className="rounded-md border border-line bg-canvas px-3 py-2" value={mapping.agentFieldPath} onChange={(event) => update(index, { agentFieldPath: event.target.value })} />
          <select className="rounded-md border border-line bg-canvas px-3 py-2" value={mapping.normalizer} onChange={(event) => update(index, { normalizer: event.target.value as VFormixAgentFieldMapping["normalizer"] })}>
            {["text", "slug", "list", "date", "priority"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mapping.required} onChange={(event) => update(index, { required: event.target.checked })} />Required</label>
        </div>
      ))}
      <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={() => props.setMappings([...props.mappings, { mappingId: `draft-${Date.now()}`, formFieldKey: "", agentFieldPath: "", required: false, normalizer: "text" }])}>Add mapping</button>
      <button className="ml-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={props.onSave}>Save mapping</button>
    </Panel>
  );
}

function TriggerPanel(props: { triggers: VFormixAgentTrigger[]; setTriggers: (value: VFormixAgentTrigger[]) => void; onSave: () => void }) {
  const update = (index: number, patch: Partial<VFormixAgentTrigger>) => props.setTriggers(props.triggers.map((trigger, itemIndex) => (itemIndex === index ? { ...trigger, ...patch } : trigger)));
  return (
    <Panel title="Trigger Rules">
      {props.triggers.map((trigger, index) => (
        <div key={trigger.triggerId} className="grid gap-3 rounded-md border border-line bg-muted p-3 md:grid-cols-3">
          <Mini label="Trigger" value={trigger.triggerType} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={trigger.enabled} onChange={(event) => update(index, { enabled: event.target.checked })} />Enabled</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={trigger.requiresApproval} onChange={(event) => update(index, { requiresApproval: event.target.checked })} />Requires approval</label>
        </div>
      ))}
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={props.onSave}>Save triggers</button>
    </Panel>
  );
}

function SubmissionPanel(props: { rawSubmission: string; setRawSubmission: (value: string) => void; onRun: () => void; status: VFormixAgentSubmissionStatus | null }) {
  return (
    <Panel title="Submission-to-Agent Run">
      <textarea className="min-h-72 rounded-md border border-line bg-canvas p-3 font-mono text-xs" value={props.rawSubmission} onChange={(event) => props.setRawSubmission(event.target.value)} />
      <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={props.onRun}>Trigger agent manually</button>
      {props.status ? <StatusPanel status={props.status} submissionId={props.status.submissionId} /> : <StatePanel state="empty" title="No linked agent run" detail="Trigger the agent manually or wait for an enabled VFormix trigger." />}
    </Panel>
  );
}

function StatusPanel({ status, submissionId }: { status: VFormixAgentSubmissionStatus | null; submissionId: string }) {
  if (!status) return <StatePanel state="empty" title="No agent status found" detail={`Submission ${submissionId} has not created an agent link yet.`} />;
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1fr]">
      <Panel title="Agent Status">
        <Mini label="Status" value={status.status} />
        <Mini label="Run ID" value={status.runId || "Not created"} />
        <Mini label="Execution ID" value={status.executionId || "Not started"} />
        <Mini label="Template" value={status.templateId || "Auto-match pending"} />
        <Mini label="Next action" value={status.nextAction} />
        {status.errorMessage ? <Mini label="Failure reason" value={status.errorMessage} /> : null}
      </Panel>
      <Panel title="Mapping Details">
        <Mini label="Missing fields" value={status.missingFields.length ? status.missingFields.join(", ") : "None"} />
        {(status.mappingErrors || []).map((error) => <Mini key={error.errorId} label={`${error.fieldKey} error`} value={`${error.reason}. ${error.nextAction}`} />)}
        <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(status.cleanedAgentInput || status.rawSubmission, null, 2)}</pre>
      </Panel>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid gap-3">{children}</div></section>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line bg-muted p-3"><p className="text-xs font-semibold uppercase text-accent">{label}</p><p className="mt-1 break-words text-sm text-ink">{value}</p></div>;
}

function sampleSubmission(formId: string) {
  return {
    formId,
    productName: "VFormix Generated Portal",
    productSlug: "vformix-generated-portal",
    problemStatement: "Admins need to convert validated form submissions into production-ready project plans.",
    targetUsers: "Admin, Operations",
    goals: "Generate blueprint, Require approval, Track coding status",
    coreFeatures: [{ name: "Agent intake", description: "Map VFormix submission fields into VaanForge requirements.", priority: "HIGH", acceptanceCriteria: ["Missing fields block the run"] }],
    ownerId: "admin",
    priority: "HIGH",
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString()
  };
}
