import { z } from "zod";
import { createId, store, type StoredAgentLiveEventType } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { agentAdminService } from "./agent-admin.service";

export const workspaceInstructionSchema = z.object({
  instructionType: z.enum(["extra", "constraint", "design", "backend", "security", "deadline_priority"]),
  content: z.string().min(4).max(2000)
});

export const workspaceControlSchema = z.object({
  stepId: z.string().optional(),
  reason: z.string().optional()
});

export class AgentWorkspaceService {
  async overview(organizationId: string) {
    const runs = await agentAdminService.runs(organizationId);
    return runs.filter((run) => !["completed", "failed"].includes(run.status)).concat(runs.filter((run) => ["completed", "failed"].includes(run.status))).slice(0, 20);
  }

  async workspace(organizationId: string, runId: string) {
    const [run, tasks, files, validations, errors, logs, evidence, instructions] = await Promise.all([
      agentAdminService.detail(organizationId, runId),
      agentAdminService.tasks(organizationId, runId),
      agentAdminService.files(organizationId, runId),
      agentAdminService.validations(organizationId, runId),
      agentAdminService.errors(organizationId, runId),
      agentAdminService.logs(organizationId, runId),
      this.evidence(organizationId, runId),
      this.instructions(organizationId, runId)
    ]);
    if (!run) return undefined;
    this.syncEvents(organizationId, runId, { run, tasks, validations, errors, logs });
    return {
      run,
      activeTask: tasks.find((task) => !["completed", "blocked", "failed"].includes(task.status)) || tasks[0],
      tasks,
      files,
      validations,
      errors,
      logs,
      evidence,
      instructions,
      approvals: store.agentStepApprovals.filter((approval) => approval.organizationId === organizationId && approval.runId === runId),
      liveEvents: store.agentLiveEvents.filter((event) => event.organizationId === organizationId && event.runId === runId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      nextAction: run.nextAction
    };
  }

  async evidence(organizationId: string, runId: string) {
    const [files, validations, errors] = await Promise.all([agentAdminService.files(organizationId, runId), agentAdminService.validations(organizationId, runId), agentAdminService.errors(organizationId, runId)]);
    this.upsertEvidence(organizationId, runId, "files", "Generated files", { files });
    this.upsertEvidence(organizationId, runId, "diff", "Diff summary", { files: files.map((file) => ({ path: file.path, diffSummary: file.diffSummary, status: file.status })) });
    this.upsertEvidence(organizationId, runId, "validation", "Validation evidence", { validations });
    this.upsertEvidence(organizationId, runId, "error", "Error evidence", { errors });
    this.upsertEvidence(organizationId, runId, "repair", "Repair evidence", { repairedErrors: errors.filter((error) => error.status === "repaired") });
    this.upsertEvidence(organizationId, runId, "build", "Build report", { validations: validations.filter((validation) => validation.checkName === "build") });
    this.upsertEvidence(organizationId, runId, "final", "Final report", { files: files.length, validations: validations.length, errors: errors.length });
    return store.agentWorkspaceEvidence.filter((item) => item.organizationId === organizationId && item.runId === runId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async instructions(organizationId: string, runId: string) {
    return store.agentWorkspaceInstructions.filter((item) => item.organizationId === organizationId && item.runId === runId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addInstruction(organizationId: string, actorId: string, runId: string, input: z.infer<typeof workspaceInstructionSchema>) {
    const parsed = workspaceInstructionSchema.parse(input);
    const safeContent = sanitizeInstruction(parsed.content);
    await this.control(organizationId, actorId, runId, "pause", "Pause safely before applying new instruction.");
    const instruction = {
      id: createId("awi"),
      instructionId: createId("instruction"),
      runId,
      organizationId,
      actorId,
      instructionType: parsed.instructionType,
      content: safeContent,
      applied: true,
      createdAt: new Date().toISOString()
    };
    store.agentWorkspaceInstructions.push(instruction);
    this.event(organizationId, runId, "agent.run.updated", { instructionId: instruction.instructionId, instructionType: instruction.instructionType, nextAction: "Resume run after reviewing applied instruction." });
    this.audit(organizationId, actorId, "WORKSPACE_INSTRUCTION_ADDED", runId, { instructionType: instruction.instructionType });
    return instruction;
  }

  async control(organizationId: string, actorId: string, runId: string, action: "pause" | "resume" | "stop" | "approve-step" | "reject-step" | "regenerate" | "manual-review", reason?: string, stepId?: string) {
    const now = new Date().toISOString();
    store.agentWorkspaceControls.push({ id: createId("awc"), controlId: createId("control"), runId, organizationId, actorId, action, reason, status: "accepted", createdAt: now });
    if (action === "approve-step" || action === "reject-step") {
      store.agentStepApprovals.push({ id: createId("asa"), approvalId: createId("approval"), runId, organizationId, stepId: stepId || "current", actorId, decision: action === "approve-step" ? "approved" : "rejected", reason, createdAt: now });
      this.event(organizationId, runId, action === "approve-step" ? "agent.run.updated" : "agent.approval.required", { stepId: stepId || "current", decision: action, reason });
    } else if (action === "pause" || action === "manual-review") {
      await agentAdminService.action({ organizationId, actorId, runId, action: "block", reason: reason || "Paused from live workspace." });
      this.event(organizationId, runId, "agent.run.blocked", { action, reason, nextAction: "Resume from live workspace when ready." });
    } else if (action === "resume") {
      await agentAdminService.action({ organizationId, actorId, runId, action: "resume", reason });
      this.event(organizationId, runId, "agent.run.updated", { action, reason, nextAction: "Run resumed." });
    } else if (action === "stop") {
      await agentAdminService.action({ organizationId, actorId, runId, action: "cancel", reason: reason || "Stopped from live workspace." });
      this.event(organizationId, runId, "agent.run.failed", { action, reason, nextAction: "Run stopped safely." });
    } else if (action === "regenerate") {
      this.upsertEvidence(organizationId, runId, "final", `Regeneration request ${now}`, { reason, createdAt: now, version: createId("regen") });
      this.event(organizationId, runId, "agent.run.updated", { action, reason, nextAction: "Regeneration request stored as a new evidence version." });
    }
    this.audit(organizationId, actorId, `WORKSPACE_${action.toUpperCase().replace(/-/g, "_")}`, runId, { reason, stepId });
    return this.workspace(organizationId, runId);
  }

  openSession(organizationId: string, actorId: string, runId: string) {
    const now = new Date().toISOString();
    const session = { id: createId("als"), sessionId: createId("session"), runId, organizationId, actorId, status: "open" as const, createdAt: now, updatedAt: now };
    store.agentLiveSessions.push(session);
    return session;
  }

  private syncEvents(organizationId: string, runId: string, snapshot: { run: Record<string, unknown>; tasks: Array<any>; validations: Array<any>; errors: Array<any>; logs: Array<any> }) {
    this.event(organizationId, runId, "agent.run.started", { runId, status: snapshot.run.status, nextAction: snapshot.run.nextAction }, true);
    this.event(organizationId, runId, eventForRun(String(snapshot.run.status)), { runId, status: snapshot.run.status, nextAction: snapshot.run.nextAction });
    for (const task of snapshot.tasks) this.event(organizationId, runId, eventForTask(String(task.status)), { taskId: task.taskId, title: task.title, status: task.status, nextAction: task.nextAction });
    for (const validation of snapshot.validations) this.event(organizationId, runId, String(validation.status) === "failed" ? "agent.validation.failed" : "agent.validation.completed", { validationId: validation.validationId, checkName: validation.checkName, status: validation.status });
    for (const error of snapshot.errors) this.event(organizationId, runId, String(error.status) === "repaired" ? "agent.repair.completed" : "agent.task.failed", { errorId: error.errorId, reason: error.reason, status: error.status, nextAction: error.finalStatus || "Review error evidence." });
    if (String(snapshot.run.nextAction || "").toLowerCase().includes("approval")) this.event(organizationId, runId, "agent.approval.required", { runId, nextAction: snapshot.run.nextAction });
  }

  private event(organizationId: string, runId: string, eventType: StoredAgentLiveEventType, payload: Record<string, unknown>, once = false) {
    const key = JSON.stringify({ eventType, payload });
    if (once && store.agentLiveEvents.some((event) => event.organizationId === organizationId && event.runId === runId && event.eventType === eventType)) return;
    if (store.agentLiveEvents.some((event) => event.organizationId === organizationId && event.runId === runId && JSON.stringify({ eventType: event.eventType, payload: event.payload }) === key)) return;
    store.agentLiveEvents.push({ id: createId("ale"), eventId: createId("event"), runId, organizationId, eventType, payload, createdAt: new Date().toISOString() });
  }

  private upsertEvidence(organizationId: string, runId: string, evidenceType: "files" | "diff" | "validation" | "error" | "repair" | "build" | "final", title: string, payload: Record<string, unknown>) {
    const existing = store.agentWorkspaceEvidence.find((item) => item.organizationId === organizationId && item.runId === runId && item.evidenceType === evidenceType && item.title === title);
    if (existing) {
      existing.payload = payload;
      return existing;
    }
    const item = { id: createId("awe"), evidenceId: createId("evidence"), runId, organizationId, evidenceType, title, payload, createdAt: new Date().toISOString() };
    store.agentWorkspaceEvidence.push(item);
    return item;
  }

  private audit(organizationId: string, actorId: string, action: string, runId: string, metadata?: Record<string, unknown>) {
    auditService.record({ actorId, organizationId, action: "VAANFORGE_AGENT_RUN", entityType: "AgentLiveWorkspace", entityId: runId, metadata: { workspaceAction: action, ...metadata } });
  }
}

function eventForRun(status: string): StoredAgentLiveEventType {
  if (status === "completed") return "agent.run.completed";
  if (status === "failed") return "agent.run.failed";
  if (status === "blocked") return "agent.run.blocked";
  return "agent.run.updated";
}

function eventForTask(status: string): StoredAgentLiveEventType {
  if (status === "completed") return "agent.task.completed";
  if (status === "failed" || status === "blocked") return "agent.task.failed";
  if (status === "pending" || status === "preparing") return "agent.task.started";
  return "agent.task.progress";
}

function sanitizeInstruction(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/ignore previous instructions/gi, "[removed]").replace(/system prompt/gi, "[removed]").replace(/developer message/gi, "[removed]").trim();
}

export const agentWorkspaceService = new AgentWorkspaceService();
