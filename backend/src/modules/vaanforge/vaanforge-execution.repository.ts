import { env } from "../../config/env";
import {
  createId,
  store,
  type StoredAgentActivityLog,
  type StoredAgentCommit,
  type StoredAgentError,
  type StoredAgentExecutionRun,
  type StoredAgentExecutionStatus,
  type StoredAgentFile,
  type StoredAgentRepairAttempt,
  type StoredAgentTask,
  type StoredAgentTaskStatus,
  type StoredAgentValidationRun
} from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export type AgentExecutionCreateInput = {
  phaseOneRunId: string;
  organizationId: string;
  ownerId: string;
  requestedById: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  approvedBlueprint: Record<string, unknown>;
  taskGraph: Record<string, unknown>;
  nextAction: string;
};

export type AgentTaskInput = Omit<StoredAgentTask, "id" | "createdAt" | "updatedAt" | "status" | "activityHistory" | "nextAction"> & {
  nextAction?: string;
};
export type AgentFileInput = Omit<StoredAgentFile, "id" | "createdAt" | "updatedAt">;
export type AgentValidationRunInput = Omit<StoredAgentValidationRun, "id">;
export type AgentErrorInput = Omit<StoredAgentError, "id" | "createdAt" | "updatedAt" | "status"> & { status?: StoredAgentError["status"] };
export type AgentRepairAttemptInput = Omit<StoredAgentRepairAttempt, "id" | "createdAt">;
export type AgentCommitInput = Omit<StoredAgentCommit, "id" | "createdAt">;
export type AgentActivityInput = Omit<StoredAgentActivityLog, "id" | "activityId" | "createdAt">;

export interface VaanForgeExecutionRepository {
  createExecution(input: AgentExecutionCreateInput): Promise<StoredAgentExecutionRun> | StoredAgentExecutionRun;
  updateExecution(executionId: string, input: Partial<Pick<StoredAgentExecutionRun, "status" | "validationSummary" | "executionReport" | "errorMessage" | "nextAction">> & { activity?: Record<string, unknown> }): Promise<StoredAgentExecutionRun | undefined> | StoredAgentExecutionRun | undefined;
  findExecution(organizationId: string, executionId: string): Promise<StoredAgentExecutionRun | undefined> | StoredAgentExecutionRun | undefined;
  listExecutions(organizationId: string): Promise<StoredAgentExecutionRun[]> | StoredAgentExecutionRun[];
  createTasks(tasks: AgentTaskInput[]): Promise<StoredAgentTask[]> | StoredAgentTask[];
  updateTask(taskId: string, status: StoredAgentTaskStatus, nextAction: string): Promise<StoredAgentTask | undefined> | StoredAgentTask | undefined;
  listTasks(organizationId: string, executionId: string): Promise<StoredAgentTask[]> | StoredAgentTask[];
  upsertFile(input: AgentFileInput): Promise<StoredAgentFile> | StoredAgentFile;
  listFiles(organizationId: string, executionId: string): Promise<StoredAgentFile[]> | StoredAgentFile[];
  createValidationRun(input: AgentValidationRunInput): Promise<StoredAgentValidationRun> | StoredAgentValidationRun;
  listValidationRuns(organizationId: string, executionId: string): Promise<StoredAgentValidationRun[]> | StoredAgentValidationRun[];
  createError(input: AgentErrorInput): Promise<StoredAgentError> | StoredAgentError;
  updateError(errorId: string, input: Partial<Pick<StoredAgentError, "status" | "fixAttempt">>): Promise<StoredAgentError | undefined> | StoredAgentError | undefined;
  listErrors(organizationId: string, executionId: string): Promise<StoredAgentError[]> | StoredAgentError[];
  createRepairAttempt(input: AgentRepairAttemptInput): Promise<StoredAgentRepairAttempt> | StoredAgentRepairAttempt;
  listRepairAttempts(organizationId: string, executionId: string): Promise<StoredAgentRepairAttempt[]> | StoredAgentRepairAttempt[];
  createCommit(input: AgentCommitInput): Promise<StoredAgentCommit> | StoredAgentCommit;
  listCommits(organizationId: string, executionId: string): Promise<StoredAgentCommit[]> | StoredAgentCommit[];
  createActivityLog(input: AgentActivityInput): Promise<StoredAgentActivityLog> | StoredAgentActivityLog;
  listActivityLogs(organizationId: string, executionId: string): Promise<StoredAgentActivityLog[]> | StoredAgentActivityLog[];
  health(): RepositoryHealth;
}

export class MemoryVaanForgeExecutionRepository implements VaanForgeExecutionRepository {
  createExecution(input: AgentExecutionCreateInput) {
    const now = new Date().toISOString();
    const run: StoredAgentExecutionRun = {
      id: createId("aer"),
      executionId: createId("exec"),
      ...input,
      status: "pending",
      activityHistory: [{ at: now, status: "pending", message: "Execution run created from approved Phase 1 blueprint." }],
      createdAt: now,
      updatedAt: now
    };
    store.agentExecutionRuns.push(run);
    return run;
  }

  updateExecution(executionId: string, input: Partial<Pick<StoredAgentExecutionRun, "status" | "validationSummary" | "executionReport" | "errorMessage" | "nextAction">> & { activity?: Record<string, unknown> }) {
    const run = store.agentExecutionRuns.find((item) => item.executionId === executionId);
    if (!run) {
      return undefined;
    }
    const activityHistory = input.activity ? [...run.activityHistory, { at: new Date().toISOString(), ...input.activity }] : run.activityHistory;
    Object.assign(run, { ...input, activityHistory, updatedAt: new Date().toISOString() });
    delete (run as { activity?: unknown }).activity;
    return run;
  }

  findExecution(organizationId: string, executionId: string) {
    return store.agentExecutionRuns.find((run) => run.organizationId === organizationId && run.executionId === executionId);
  }

  listExecutions(organizationId: string) {
    return store.agentExecutionRuns.filter((run) => run.organizationId === organizationId).sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }

  createTasks(tasks: AgentTaskInput[]) {
    const now = new Date().toISOString();
    const stored = tasks.map((task) => ({
      id: createId("agt"),
      ...task,
      status: "pending" as const,
      nextAction: task.nextAction || "Generate files for this task.",
      activityHistory: [{ at: now, status: "pending", message: "Task added to execution graph." }],
      createdAt: now,
      updatedAt: now
    }));
    store.agentTasks.push(...stored);
    return stored;
  }

  updateTask(taskId: string, status: StoredAgentTaskStatus, nextAction: string) {
    const task = store.agentTasks.find((item) => item.taskId === taskId);
    if (!task) {
      return undefined;
    }
    Object.assign(task, {
      status,
      nextAction,
      activityHistory: [...task.activityHistory, { at: new Date().toISOString(), status, message: nextAction }],
      updatedAt: new Date().toISOString()
    });
    return task;
  }

  listTasks(organizationId: string, executionId: string) {
    return store.agentTasks.filter((task) => task.organizationId === organizationId && task.executionId === executionId);
  }

  upsertFile(input: AgentFileInput) {
    const existing = store.agentFiles.find((file) => file.executionId === input.executionId && file.path === input.path);
    const now = new Date().toISOString();
    if (existing) {
      Object.assign(existing, { ...input, updatedAt: now });
      return existing;
    }
    const file = { id: createId("agf"), ...input, createdAt: now, updatedAt: now };
    store.agentFiles.push(file);
    return file;
  }

  listFiles(organizationId: string, executionId: string) {
    return store.agentFiles.filter((file) => file.organizationId === organizationId && file.executionId === executionId);
  }

  createValidationRun(input: AgentValidationRunInput) {
    const run = { id: createId("agv"), ...input };
    store.agentValidationRuns.push(run);
    return run;
  }

  listValidationRuns(organizationId: string, executionId: string) {
    return store.agentValidationRuns.filter((run) => run.organizationId === organizationId && run.executionId === executionId);
  }

  createError(input: AgentErrorInput) {
    const now = new Date().toISOString();
    const error = { id: createId("age"), status: "open" as const, ...input, createdAt: now, updatedAt: now };
    store.agentErrors.push(error);
    return error;
  }

  updateError(errorId: string, input: Partial<Pick<StoredAgentError, "status" | "fixAttempt">>) {
    const error = store.agentErrors.find((item) => item.errorId === errorId);
    if (!error) {
      return undefined;
    }
    Object.assign(error, { ...input, updatedAt: new Date().toISOString() });
    return error;
  }

  listErrors(organizationId: string, executionId: string) {
    return store.agentErrors.filter((error) => error.organizationId === organizationId && error.executionId === executionId);
  }

  createRepairAttempt(input: AgentRepairAttemptInput) {
    const attempt = { id: createId("agr"), ...input, createdAt: new Date().toISOString() };
    store.agentRepairAttempts.push(attempt);
    return attempt;
  }

  listRepairAttempts(organizationId: string, executionId: string) {
    return store.agentRepairAttempts.filter((attempt) => attempt.organizationId === organizationId && attempt.executionId === executionId);
  }

  createCommit(input: AgentCommitInput) {
    const commit = { id: createId("agc"), ...input, createdAt: new Date().toISOString() };
    store.agentCommits.push(commit);
    return commit;
  }

  listCommits(organizationId: string, executionId: string) {
    return store.agentCommits.filter((commit) => commit.organizationId === organizationId && commit.executionId === executionId);
  }

  createActivityLog(input: AgentActivityInput) {
    const log = { id: createId("aga"), activityId: createId("activity"), ...input, createdAt: new Date().toISOString() };
    store.agentActivityLogs.push(log);
    return log;
  }

  listActivityLogs(organizationId: string, executionId: string) {
    return store.agentActivityLogs.filter((log) => log.organizationId === organizationId && log.executionId === executionId).sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  }

  health(): RepositoryHealth {
    return { name: "vaanforge-execution", mode: "memory", writable: true, durable: false };
  }
}

export class PrismaVaanForgeExecutionRepository implements VaanForgeExecutionRepository {
  async createExecution(input: AgentExecutionCreateInput) {
    const executionId = createId("exec");
    const created = await prismaAny().agentExecutionRun.create({
      data: {
        executionId,
        phaseOneRunId: input.phaseOneRunId,
        organizationId: input.organizationId,
        ownerId: input.ownerId,
        requestedById: input.requestedById,
        priority: input.priority,
        dueDate: new Date(input.dueDate),
        approvedBlueprint: input.approvedBlueprint,
        taskGraph: input.taskGraph,
        nextAction: input.nextAction,
        activityHistory: [{ at: new Date().toISOString(), status: "pending", message: "Execution run created from approved Phase 1 blueprint." }]
      }
    });
    return toExecution(created);
  }

  async updateExecution(executionId: string, input: Partial<Pick<StoredAgentExecutionRun, "status" | "validationSummary" | "executionReport" | "errorMessage" | "nextAction">> & { activity?: Record<string, unknown> }) {
    const existing = await prismaAny().agentExecutionRun.findUnique({ where: { executionId } });
    if (!existing) {
      return undefined;
    }
    const activityHistory = Array.isArray(existing.activityHistory) ? existing.activityHistory : [];
    const updated = await prismaAny().agentExecutionRun.update({
      where: { executionId },
      data: {
        status: input.status,
        validationSummary: input.validationSummary,
        executionReport: input.executionReport,
        errorMessage: input.errorMessage,
        nextAction: input.nextAction,
        activityHistory: input.activity ? [...activityHistory, { at: new Date().toISOString(), ...input.activity }] : activityHistory
      }
    });
    return toExecution(updated);
  }

  async findExecution(organizationId: string, executionId: string) {
    const run = await prismaAny().agentExecutionRun.findFirst({ where: { organizationId, executionId } });
    return run ? toExecution(run) : undefined;
  }

  async listExecutions(organizationId: string) {
    const runs = await prismaAny().agentExecutionRun.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return runs.map(toExecution);
  }

  async createTasks(tasks: AgentTaskInput[]) {
    const created = [];
    for (const task of tasks) {
      created.push(
        await prismaAny().agentTask.create({
          data: {
            taskId: task.taskId,
            executionId: task.executionId,
            organizationId: task.organizationId,
            module: task.module,
            title: task.title,
            description: task.description,
            priority: task.priority,
            ownerId: task.ownerId,
            dueDate: new Date(task.dueDate),
            dependencies: task.dependencies,
            outputPaths: task.outputPaths,
            nextAction: task.nextAction || "Generate files for this task.",
            activityHistory: [{ at: new Date().toISOString(), status: "pending", message: "Task added to execution graph." }]
          }
        })
      );
    }
    return created.map(toTask);
  }

  async updateTask(taskId: string, status: StoredAgentTaskStatus, nextAction: string) {
    const existing = await prismaAny().agentTask.findUnique({ where: { taskId } });
    if (!existing) {
      return undefined;
    }
    const activityHistory = Array.isArray(existing.activityHistory) ? existing.activityHistory : [];
    const updated = await prismaAny().agentTask.update({
      where: { taskId },
      data: {
        status,
        nextAction,
        activityHistory: [...activityHistory, { at: new Date().toISOString(), status, message: nextAction }]
      }
    });
    return toTask(updated);
  }

  async listTasks(organizationId: string, executionId: string) {
    const tasks = await prismaAny().agentTask.findMany({ where: { organizationId, executionId } });
    return tasks.map(toTask);
  }

  async upsertFile(input: AgentFileInput) {
    const file = await prismaAny().agentFile.upsert({
      where: { executionId_path: { executionId: input.executionId, path: input.path } },
      create: input,
      update: input
    });
    return toFile(file);
  }

  async listFiles(organizationId: string, executionId: string) {
    const files = await prismaAny().agentFile.findMany({ where: { organizationId, executionId } });
    return files.map(toFile);
  }

  async createValidationRun(input: AgentValidationRunInput) {
    const run = await prismaAny().agentValidationRun.create({
      data: {
        ...input,
        startedAt: new Date(input.startedAt),
        completedAt: new Date(input.completedAt)
      }
    });
    return toValidationRun(run);
  }

  async listValidationRuns(organizationId: string, executionId: string) {
    const runs = await prismaAny().agentValidationRun.findMany({ where: { organizationId, executionId } });
    return runs.map(toValidationRun);
  }

  async createError(input: AgentErrorInput) {
    const error = await prismaAny().agentError.create({ data: input });
    return toError(error);
  }

  async updateError(errorId: string, input: Partial<Pick<StoredAgentError, "status" | "fixAttempt">>) {
    const existing = await prismaAny().agentError.findUnique({ where: { errorId } });
    if (!existing) {
      return undefined;
    }
    const error = await prismaAny().agentError.update({ where: { errorId }, data: input });
    return toError(error);
  }

  async listErrors(organizationId: string, executionId: string) {
    const errors = await prismaAny().agentError.findMany({ where: { organizationId, executionId } });
    return errors.map(toError);
  }

  async createRepairAttempt(input: AgentRepairAttemptInput) {
    const attempt = await prismaAny().agentRepairAttempt.create({ data: input });
    return toRepairAttempt(attempt);
  }

  async listRepairAttempts(organizationId: string, executionId: string) {
    const attempts = await prismaAny().agentRepairAttempt.findMany({ where: { organizationId, executionId } });
    return attempts.map(toRepairAttempt);
  }

  async createCommit(input: AgentCommitInput) {
    const commit = await prismaAny().agentCommit.create({ data: input });
    return toCommit(commit);
  }

  async listCommits(organizationId: string, executionId: string) {
    const commits = await prismaAny().agentCommit.findMany({ where: { organizationId, executionId } });
    return commits.map(toCommit);
  }

  async createActivityLog(input: AgentActivityInput) {
    const log = await prismaAny().agentActivityLog.create({ data: { activityId: createId("activity"), ...input } });
    return toActivityLog(log);
  }

  async listActivityLogs(organizationId: string, executionId: string) {
    const logs = await prismaAny().agentActivityLog.findMany({ where: { organizationId, executionId }, orderBy: { createdAt: "asc" } });
    return logs.map(toActivityLog);
  }

  health(): RepositoryHealth {
    return { name: "vaanforge-execution", mode: "postgres", writable: true, durable: true };
  }
}

function prismaAny(): any {
  return prisma() as any;
}

function toExecution(run: any): StoredAgentExecutionRun {
  return {
    id: run.id,
    executionId: run.executionId,
    phaseOneRunId: run.phaseOneRunId,
    organizationId: run.organizationId,
    ownerId: run.ownerId,
    requestedById: run.requestedById,
    status: run.status,
    priority: run.priority,
    dueDate: toIso(run.dueDate),
    approvedBlueprint: isRecord(run.approvedBlueprint) ? run.approvedBlueprint : {},
    taskGraph: isRecord(run.taskGraph) ? run.taskGraph : {},
    validationSummary: isRecord(run.validationSummary) ? run.validationSummary : undefined,
    executionReport: isRecord(run.executionReport) ? run.executionReport : undefined,
    errorMessage: run.errorMessage || undefined,
    nextAction: run.nextAction,
    activityHistory: Array.isArray(run.activityHistory) ? run.activityHistory.filter(isRecord) : [],
    createdAt: toIso(run.createdAt),
    updatedAt: toIso(run.updatedAt)
  };
}

function toTask(task: any): StoredAgentTask {
  return {
    id: task.id,
    taskId: task.taskId,
    executionId: task.executionId,
    organizationId: task.organizationId,
    module: task.module,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    ownerId: task.ownerId,
    dueDate: toIso(task.dueDate),
    dependencies: Array.isArray(task.dependencies) ? task.dependencies.map(String) : [],
    outputPaths: Array.isArray(task.outputPaths) ? task.outputPaths.map(String) : [],
    nextAction: task.nextAction,
    activityHistory: Array.isArray(task.activityHistory) ? task.activityHistory.filter(isRecord) : [],
    createdAt: toIso(task.createdAt),
    updatedAt: toIso(task.updatedAt)
  };
}

function toFile(file: any): StoredAgentFile {
  return {
    id: file.id,
    fileId: file.fileId,
    executionId: file.executionId,
    taskId: file.taskId || undefined,
    organizationId: file.organizationId,
    module: file.module,
    path: file.path,
    operation: file.operation,
    status: file.status,
    contentHash: file.contentHash || undefined,
    previousHash: file.previousHash || undefined,
    diffSummary: file.diffSummary || undefined,
    humanReviewRequired: Boolean(file.humanReviewRequired),
    createdAt: toIso(file.createdAt),
    updatedAt: toIso(file.updatedAt)
  };
}

function toValidationRun(run: any): StoredAgentValidationRun {
  return {
    id: run.id,
    validationId: run.validationId,
    executionId: run.executionId,
    organizationId: run.organizationId,
    checkName: run.checkName,
    command: run.command,
    status: run.status,
    exitCode: run.exitCode ?? undefined,
    output: run.output,
    startedAt: toIso(run.startedAt),
    completedAt: toIso(run.completedAt)
  };
}

function toError(error: any): StoredAgentError {
  return {
    id: error.id,
    errorId: error.errorId,
    executionId: error.executionId,
    organizationId: error.organizationId,
    validationId: error.validationId || undefined,
    source: error.source,
    filePath: error.filePath || undefined,
    line: error.line ?? undefined,
    reason: error.reason,
    fixAttempt: error.fixAttempt || undefined,
    status: error.status,
    createdAt: toIso(error.createdAt),
    updatedAt: toIso(error.updatedAt)
  };
}

function toRepairAttempt(attempt: any): StoredAgentRepairAttempt {
  return {
    id: attempt.id,
    repairId: attempt.repairId,
    executionId: attempt.executionId,
    organizationId: attempt.organizationId,
    errorId: attempt.errorId || undefined,
    cycle: attempt.cycle,
    strategy: attempt.strategy,
    status: attempt.status,
    notes: attempt.notes,
    createdAt: toIso(attempt.createdAt)
  };
}

function toCommit(commit: any): StoredAgentCommit {
  return {
    id: commit.id,
    commitId: commit.commitId,
    executionId: commit.executionId,
    organizationId: commit.organizationId,
    sha: commit.sha || undefined,
    message: commit.message,
    files: Array.isArray(commit.files) ? commit.files.map(String) : [],
    status: commit.status,
    createdAt: toIso(commit.createdAt)
  };
}

function toActivityLog(log: any): StoredAgentActivityLog {
  return {
    id: log.id,
    activityId: log.activityId,
    executionId: log.executionId,
    organizationId: log.organizationId,
    actorId: log.actorId,
    step: log.step,
    status: log.status,
    message: log.message,
    metadata: isRecord(log.metadata) ? log.metadata : undefined,
    createdAt: toIso(log.createdAt)
  };
}

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const vaanForgeExecutionRepository: VaanForgeExecutionRepository =
  env.persistenceMode === "postgres" ? new PrismaVaanForgeExecutionRepository() : new MemoryVaanForgeExecutionRepository();
