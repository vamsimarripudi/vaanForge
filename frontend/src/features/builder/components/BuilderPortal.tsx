"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatePanel } from "@/components/StatePanel";
import { builderApi, type BuilderProjectPayload, type BuilderRequirementPayload } from "../services/builderApi";
import type { BuilderBlueprint, BuilderListResponse, BuilderOutput, BuilderProgress, BuilderProject } from "../types";

type Mode = "overview" | "projects" | "new" | "detail" | "requirements" | "blueprint" | "progress" | "outputs" | "changes";

const defaultProject: BuilderProjectPayload = {
  name: "Customer Operations App",
  description: "A secure customer operations application with dashboard, approvals, output review, and change request workflow.",
  priority: "HIGH",
  targetUsers: ["Customer", "Admin"],
  goals: ["Launch a production-ready app from customer requirements"],
  features: ["Customer dashboard", "Admin approval workflow", "Output review", "Change requests"],
  successMetrics: ["Blueprint approved", "Build validation passed", "Customer delivery accepted"]
};

const defaultRequirement: BuilderRequirementPayload = {
  problemStatement: "Customers need a secure portal to request and track an AI-built application from requirements through final delivery.",
  targetUsers: ["Customer", "Admin"],
  goals: ["Convert customer requirements into a validated app blueprint", "Track build progress transparently"],
  features: ["Requirement intake", "Blueprint approval", "Live progress", "Output preview", "Change requests"],
  successMetrics: ["Blueprint is approved before coding", "Every output has status and version", "Every customer action is audited"],
  constraints: ["VMNexus master synchronization policy"],
  integrations: ["VaanForge", "VFormix"],
  dataEntities: ["BuilderProject", "BuilderRequirement", "BuilderBlueprint", "BuilderOutput", "BuilderChangeRequest"]
};

export function BuilderPortal({ mode, projectId }: { mode: Mode; projectId?: string }) {
  const [list, setList] = useState<BuilderListResponse>({ projects: [], templates: [] });
  const [project, setProject] = useState<BuilderProject | null>(null);
  const [blueprint, setBlueprint] = useState<BuilderBlueprint | null>(null);
  const [progress, setProgress] = useState<BuilderProgress | null>(null);
  const [outputs, setOutputs] = useState<BuilderOutput[]>([]);
  const [projectPayload, setProjectPayload] = useState(defaultProject);
  const [requirementPayload, setRequirementPayload] = useState(defaultRequirement);
  const [changeSummary, setChangeSummary] = useState("Adjust dashboard workflow");
  const [changeDetails, setChangeDetails] = useState("Please add clearer approval states and expose delivery status on every generated output.");
  const [state, setState] = useState<"loading" | "success" | "empty" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const base = await builderApi.list();
        if (!mounted) return;
        setList(base);
        if (projectId) {
          const detail = await builderApi.project(projectId);
          if (!mounted) return;
          setProject(detail);
          if (["blueprint", "detail"].includes(mode)) setBlueprint(await builderApi.blueprint(projectId).catch(() => null));
          if (["progress", "detail"].includes(mode)) setProgress(await builderApi.progress(projectId).catch(() => null));
          if (["outputs", "detail"].includes(mode)) setOutputs(await builderApi.outputs(projectId).catch(() => []));
        }
        setState(base.projects.length || projectId || mode === "new" ? "success" : "empty");
      } catch (error) {
        if (mounted) {
          setMessage(error instanceof Error ? error.message : "Builder portal unavailable.");
          setState("error");
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [mode, projectId]);

  const activeBlueprint = blueprint || project?.blueprints?.[0];
  const activeOutputs = outputs.length ? outputs : project?.outputs || [];
  const activeProgress = progress || project?.progress;

  async function createProject() {
    if (!window.confirm("Create this builder project and generate a VaanForge blueprint?")) return;
    const created = await builderApi.create(projectPayload);
    setProject(created);
    setMessage(`Created ${created.projectId}`);
  }

  async function submitRequirements() {
    if (!projectId || !window.confirm("Submit these requirements and regenerate the blueprint?")) return;
    setProject(await builderApi.requirements(projectId, requirementPayload));
  }

  async function approveBlueprint() {
    if (!projectId || !window.confirm("Approve this blueprint and start coding execution?")) return;
    setProject(await builderApi.approveBlueprint(projectId));
  }

  async function rejectBlueprint() {
    if (!projectId) return;
    const reason = window.prompt("Reason for rejecting this blueprint") || "";
    if (!reason.trim()) return;
    if (!window.confirm("Reject this blueprint and require requirement changes?")) return;
    setProject(await builderApi.rejectBlueprint(projectId, reason));
  }

  async function createChangeRequest() {
    if (!projectId || !window.confirm("Create this change request as a new agent task/version?")) return;
    await builderApi.changeRequest(projectId, { summary: changeSummary, details: changeDetails });
    setProject(await builderApi.project(projectId));
  }

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">VaanForge Builder</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Customer Builder Portal</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">Submit app requirements, choose approved templates, review blueprints, monitor real agent progress, preview outputs, and request changes.</p>
        </div>
        <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold uppercase text-ink-muted">{state}</span>
      </div>
      <BuilderNav projectId={projectId || project?.projectId} />
      {message ? <div className="mt-4 rounded-md border border-line bg-primary-soft p-3 text-sm font-semibold">{message}</div> : null}
      {state === "error" ? <StatePanel state="error" title="Builder unavailable" detail={message || "Check login, tenant access, and builder APIs."} /> : null}
      {mode === "overview" ? <Overview list={list} /> : null}
      {mode === "projects" ? <ProjectList projects={list.projects} /> : null}
      {mode === "new" ? <ProjectForm payload={projectPayload} setPayload={setProjectPayload} templates={list.templates} onCreate={createProject} created={project} /> : null}
      {mode === "detail" && project ? <ProjectDetail project={project} blueprint={activeBlueprint} progress={activeProgress} outputs={activeOutputs} /> : null}
      {mode === "requirements" ? <RequirementForm payload={requirementPayload} setPayload={setRequirementPayload} onSubmit={submitRequirements} project={project} /> : null}
      {mode === "blueprint" ? <BlueprintPanel blueprint={activeBlueprint} onApprove={approveBlueprint} onReject={rejectBlueprint} /> : null}
      {mode === "progress" ? <ProgressPanel progress={activeProgress} /> : null}
      {mode === "outputs" ? <OutputsPanel outputs={activeOutputs} /> : null}
      {mode === "changes" ? <ChangePanel project={project} summary={changeSummary} details={changeDetails} setSummary={setChangeSummary} setDetails={setChangeDetails} onCreate={createChangeRequest} /> : null}
    </section>
  );
}

function BuilderNav({ projectId }: { projectId?: string }) {
  const links = [
    ["/builder", "Overview"],
    ["/builder/projects", "Projects"],
    ["/builder/projects/new", "New"]
  ];
  const projectLinks = projectId
    ? [
        [`/builder/projects/${projectId}`, "Detail"],
        [`/builder/projects/${projectId}/requirements`, "Requirements"],
        [`/builder/projects/${projectId}/blueprint`, "Blueprint"],
        [`/builder/projects/${projectId}/progress`, "Progress"],
        [`/builder/projects/${projectId}/outputs`, "Outputs"],
        [`/builder/projects/${projectId}/change-requests`, "Changes"]
      ]
    : [];
  return (
    <nav className="mt-4 flex flex-wrap gap-2 text-sm">
      {[...links, ...projectLinks].map(([href, label]) => <Link key={href} href={href} className="rounded-md border border-line bg-surface px-3 py-2 hover:bg-muted">{label}</Link>)}
    </nav>
  );
}

function Overview({ list }: { list: BuilderListResponse }) {
  const counts = useMemo(() => ({
    projects: list.projects.length,
    active: list.projects.filter((project) => ["requirements_submitted", "blueprint_ready", "coding_started", "change_requested"].includes(project.status)).length,
    delivered: list.projects.filter((project) => project.status === "delivered").length,
    blocked: list.projects.filter((project) => ["blocked", "failed", "blueprint_rejected"].includes(project.status)).length
  }), [list.projects]);
  return (
    <section className="mt-6 grid gap-4 md:grid-cols-4">
      <Mini label="Projects" value={String(counts.projects)} />
      <Mini label="Active" value={String(counts.active)} />
      <Mini label="Delivered" value={String(counts.delivered)} />
      <Mini label="Needs action" value={String(counts.blocked)} />
      <Panel title="Template Selection">{list.templates.length ? list.templates.map((template) => <Mini key={template.templateId} label={template.category} value={`${template.name} · ${template.version}`} />) : <StatePanel state="empty" title="No templates" detail="An admin must publish templates before customers can select one." />}</Panel>
      <Panel title="Recent Projects"><ProjectList projects={list.projects.slice(0, 5)} compact /></Panel>
    </section>
  );
}

function ProjectList({ projects, compact = false }: { projects: BuilderProject[]; compact?: boolean }) {
  if (!projects.length) return <StatePanel state="empty" title="No builder projects" detail="Create a project to generate a blueprint and begin the approval workflow." />;
  return (
    <div className={compact ? "grid gap-3 md:col-span-3" : "mt-6 grid gap-3"}>
      {projects.map((project) => (
        <Link key={project.projectId} href={`/builder/projects/${project.projectId}`} className="grid gap-2 rounded-md border border-line bg-surface p-4 hover:bg-muted md:grid-cols-[1fr_0.5fr_1fr]">
          <strong>{project.name}<span className="block text-xs text-ink-muted">{project.projectId}</span></strong>
          <span className="text-sm font-semibold">{project.status}</span>
          <span className="text-sm text-ink-muted">{project.nextAction}</span>
        </Link>
      ))}
    </div>
  );
}

function ProjectForm(props: { payload: BuilderProjectPayload; setPayload: (payload: BuilderProjectPayload) => void; templates: BuilderListResponse["templates"]; onCreate: () => void; created: BuilderProject | null }) {
  const { payload, setPayload } = props;
  return (
    <Panel title="Create Project">
      <div className="grid gap-3 md:grid-cols-2">
        <input className="rounded-md border border-line bg-canvas px-3 py-2" value={payload.name} onChange={(event) => setPayload({ ...payload, name: event.target.value })} />
        <select className="rounded-md border border-line bg-canvas px-3 py-2" value={payload.templateId || ""} onChange={(event) => setPayload({ ...payload, templateId: event.target.value || undefined })}>
          <option value="">No template</option>
          {props.templates.map((template) => <option key={template.templateId} value={template.templateId}>{template.name}</option>)}
        </select>
        <textarea className="min-h-28 rounded-md border border-line bg-canvas px-3 py-2 md:col-span-2" value={payload.description} onChange={(event) => setPayload({ ...payload, description: event.target.value })} />
        <ListInput label="Target users" value={payload.targetUsers} onChange={(targetUsers) => setPayload({ ...payload, targetUsers })} />
        <ListInput label="Features" value={payload.features} onChange={(features) => setPayload({ ...payload, features })} />
      </div>
      <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={props.onCreate}>Create and generate blueprint</button>
      {props.created ? <Link className="text-sm font-semibold text-accent" href={`/builder/projects/${props.created.projectId}`}>Open {props.created.projectId}</Link> : null}
    </Panel>
  );
}

function RequirementForm(props: { payload: BuilderRequirementPayload; setPayload: (payload: BuilderRequirementPayload) => void; onSubmit: () => void; project: BuilderProject | null }) {
  const { payload, setPayload } = props;
  return (
    <Panel title="Requirement Intake">
      {props.project ? <Mini label="Project" value={`${props.project.name} · ${props.project.status}`} /> : null}
      <textarea className="min-h-28 rounded-md border border-line bg-canvas px-3 py-2" value={payload.problemStatement} onChange={(event) => setPayload({ ...payload, problemStatement: event.target.value })} />
      <div className="grid gap-3 md:grid-cols-2">
        <ListInput label="Target users" value={payload.targetUsers} onChange={(targetUsers) => setPayload({ ...payload, targetUsers })} />
        <ListInput label="Goals" value={payload.goals} onChange={(goals) => setPayload({ ...payload, goals })} />
        <ListInput label="Features" value={payload.features} onChange={(features) => setPayload({ ...payload, features })} />
        <ListInput label="Data entities" value={payload.dataEntities} onChange={(dataEntities) => setPayload({ ...payload, dataEntities })} />
      </div>
      <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={props.onSubmit}>Submit requirements</button>
    </Panel>
  );
}

function ProjectDetail({ project, blueprint, progress, outputs }: { project: BuilderProject; blueprint?: BuilderBlueprint | null; progress?: BuilderProgress; outputs: BuilderOutput[] }) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Panel title={project.name}>
        <Mini label="Status" value={project.status} />
        <Mini label="Agent run" value={project.agentRunId} />
        <Mini label="Execution" value={project.executionId || "Not started"} />
        <Mini label="Next action" value={project.nextAction} />
      </Panel>
      <Panel title="Current Evidence">
        <Mini label="Blueprint" value={blueprint ? `${blueprint.status} · v${blueprint.version}` : "Not generated"} />
        <Mini label="Progress" value={progress?.executionStatus || progress?.blueprintStatus || project.status} />
        <Mini label="Outputs" value={String(outputs.length)} />
      </Panel>
    </section>
  );
}

function BlueprintPanel({ blueprint, onApprove, onReject }: { blueprint?: BuilderBlueprint | null; onApprove: () => void; onReject: () => void }) {
  if (!blueprint) return <StatePanel state="empty" title="No blueprint" detail="Submit requirements or wait for the VaanForge blueprint run to complete." />;
  return (
    <Panel title={`Blueprint v${blueprint.version}`}>
      <div className="flex flex-wrap gap-2">
        <Mini label="Status" value={blueprint.status} />
        <Mini label="Agent run" value={blueprint.agentRunId} />
      </div>
      <pre className="max-h-[520px] overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(blueprint.content, null, 2)}</pre>
      <div className="flex flex-wrap gap-2">
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={onApprove}>Approve blueprint</button>
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" onClick={onReject}>Reject blueprint</button>
      </div>
    </Panel>
  );
}

function ProgressPanel({ progress }: { progress?: BuilderProgress | null }) {
  if (!progress) return <StatePanel state="empty" title="No progress yet" detail="Approve a blueprint to start coding execution and populate live progress." />;
  return (
    <Panel title="Live Build Progress">
      <div className="grid gap-3 md:grid-cols-4">
        <Mini label="Project" value={progress.projectStatus} />
        <Mini label="Blueprint" value={progress.blueprintStatus || "pending"} />
        <Mini label="Execution" value={progress.executionStatus || "not started"} />
        <Mini label="Next action" value={progress.nextAction} />
      </div>
      {progress.currentTask ? <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(progress.currentTask, null, 2)}</pre> : <p className="text-sm text-ink-muted">No active task is currently reported.</p>}
      <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify({ validationRuns: progress.validationRuns, errors: progress.errors, activity: progress.activity }, null, 2)}</pre>
    </Panel>
  );
}

function OutputsPanel({ outputs }: { outputs: BuilderOutput[] }) {
  if (!outputs.length) return <StatePanel state="empty" title="No outputs" detail="Blueprint and execution outputs will appear here with status, version, and delivery date." />;
  return <Panel title="File and Output Preview">{outputs.map((output) => <details key={output.outputId} className="rounded-md border border-line bg-muted p-3"><summary className="cursor-pointer text-sm font-semibold">{output.title} · {output.status} · v{output.version} · {new Date(output.deliveryDate).toLocaleDateString()}</summary><pre className="mt-3 max-h-80 overflow-auto text-xs">{output.content}</pre></details>)}</Panel>;
}

function ChangePanel(props: { project: BuilderProject | null; summary: string; details: string; setSummary: (value: string) => void; setDetails: (value: string) => void; onCreate: () => void }) {
  return (
    <Panel title="Change Requests">
      <input className="rounded-md border border-line bg-canvas px-3 py-2" value={props.summary} onChange={(event) => props.setSummary(event.target.value)} />
      <textarea className="min-h-32 rounded-md border border-line bg-canvas px-3 py-2" value={props.details} onChange={(event) => props.setDetails(event.target.value)} />
      <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={props.onCreate}>Request change</button>
      {props.project?.changeRequests?.length ? props.project.changeRequests.map((request) => <Mini key={request.changeRequestId} label={`${request.status} · v${request.targetVersion}`} value={`${request.summary} · ${request.nextAction}`} />) : <p className="text-sm text-ink-muted">No change requests for this project.</p>}
    </Panel>
  );
}

function ListInput({ label, value, onChange }: { label: string; value: string[]; onChange: (value: string[]) => void }) {
  return <label className="grid gap-1 text-sm font-semibold">{label}<textarea className="min-h-24 rounded-md border border-line bg-canvas px-3 py-2 font-normal" value={value.join("\n")} onChange={(event) => onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} /></label>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid gap-3">{children}</div></section>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line bg-muted p-3"><p className="text-xs font-semibold uppercase text-accent">{label}</p><p className="mt-1 break-words text-sm text-ink">{value}</p></div>;
}
