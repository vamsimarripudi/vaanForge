import { env } from "../../config/env";
import {
  createId,
  store,
  type StoredVaanForgeAgentRun,
  type StoredVaanForgeAuditLog,
  type StoredVaanForgeOutput,
  type StoredVaanForgeRunStatus
} from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";
import type { VaanForgeOutputDraft } from "./vaanforge.output-storage";

export type VaanForgeRunCreateInput = {
  organizationId: string;
  ownerId: string;
  requestedById: string;
  source: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  inputRequirements: Record<string, unknown>;
  nextAction: string;
};

export type VaanForgeRunUpdateInput = {
  status?: StoredVaanForgeRunStatus;
  errorMessage?: string;
  nextAction?: string;
  jobId?: string;
  provider?: string;
  activity?: Record<string, unknown>;
};

export type VaanForgeAuditLogInput = {
  runId: string;
  organizationId: string;
  actorId: string;
  step: string;
  status: StoredVaanForgeRunStatus;
  message: string;
  metadata?: Record<string, unknown>;
};

export interface VaanForgeRepository {
  createRun(input: VaanForgeRunCreateInput): Promise<StoredVaanForgeAgentRun> | StoredVaanForgeAgentRun;
  updateRun(runId: string, input: VaanForgeRunUpdateInput): Promise<StoredVaanForgeAgentRun | undefined> | StoredVaanForgeAgentRun | undefined;
  findRun(organizationId: string, runId: string): Promise<StoredVaanForgeAgentRun | undefined> | StoredVaanForgeAgentRun | undefined;
  listRuns(organizationId: string): Promise<StoredVaanForgeAgentRun[]> | StoredVaanForgeAgentRun[];
  saveOutputs(runId: string, organizationId: string, outputs: VaanForgeOutputDraft[]): Promise<StoredVaanForgeOutput[]> | StoredVaanForgeOutput[];
  listOutputs(organizationId: string, runId: string): Promise<StoredVaanForgeOutput[]> | StoredVaanForgeOutput[];
  createAuditLog(input: VaanForgeAuditLogInput): Promise<StoredVaanForgeAuditLog> | StoredVaanForgeAuditLog;
  listAuditLogs(organizationId: string, runId: string): Promise<StoredVaanForgeAuditLog[]> | StoredVaanForgeAuditLog[];
  health(): RepositoryHealth;
}

export class MemoryVaanForgeRepository implements VaanForgeRepository {
  createRun(input: VaanForgeRunCreateInput) {
    const now = new Date().toISOString();
    const run: StoredVaanForgeAgentRun = {
      id: createId("vfr"),
      runId: createId("vaanforge"),
      ...input,
      status: "pending",
      errorMessage: undefined,
      activityHistory: [{ at: now, status: "pending", message: "Run created from validated VFormix requirements." }],
      createdAt: now,
      updatedAt: now
    };
    store.vaanForgeRuns.push(run);
    return run;
  }

  updateRun(runId: string, input: VaanForgeRunUpdateInput) {
    const run = store.vaanForgeRuns.find((item) => item.runId === runId);
    if (!run) {
      return undefined;
    }
    const activityHistory = input.activity ? [...run.activityHistory, { at: new Date().toISOString(), ...input.activity }] : run.activityHistory;
    Object.assign(run, {
      ...input,
      activityHistory,
      updatedAt: new Date().toISOString()
    });
    delete (run as VaanForgeRunUpdateInput).activity;
    return run;
  }

  findRun(organizationId: string, runId: string) {
    return store.vaanForgeRuns.find((run) => run.organizationId === organizationId && run.runId === runId);
  }

  listRuns(organizationId: string) {
    return store.vaanForgeRuns.filter((run) => run.organizationId === organizationId).sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }

  saveOutputs(runId: string, organizationId: string, outputs: VaanForgeOutputDraft[]) {
    const now = new Date().toISOString();
    const stored = outputs.map((output) => ({
      id: createId("vfo"),
      runId,
      organizationId,
      ...output,
      createdAt: now,
      updatedAt: now
    }));
    store.vaanForgeOutputs = store.vaanForgeOutputs.filter((output) => output.runId !== runId);
    store.vaanForgeOutputs.push(...stored);
    return stored;
  }

  listOutputs(organizationId: string, runId: string) {
    return store.vaanForgeOutputs.filter((output) => output.organizationId === organizationId && output.runId === runId);
  }

  createAuditLog(input: VaanForgeAuditLogInput) {
    const entry = {
      id: createId("vfa"),
      ...input,
      createdAt: new Date().toISOString()
    };
    store.vaanForgeAuditLogs.push(entry);
    return entry;
  }

  listAuditLogs(organizationId: string, runId: string) {
    return store.vaanForgeAuditLogs
      .filter((entry) => entry.organizationId === organizationId && entry.runId === runId)
      .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  }

  health(): RepositoryHealth {
    return { name: "vaanforge", mode: "memory", writable: true, durable: false };
  }
}

export class PrismaVaanForgeRepository implements VaanForgeRepository {
  async createRun(input: VaanForgeRunCreateInput) {
    const runId = createId("vaanforge");
    const created = await prismaAny().vaanForgeAgentRun.create({
      data: {
        runId,
        organizationId: input.organizationId,
        ownerId: input.ownerId,
        requestedById: input.requestedById,
        source: input.source,
        priority: input.priority,
        dueDate: new Date(input.dueDate),
        inputRequirements: input.inputRequirements,
        nextAction: input.nextAction,
        activityHistory: [{ at: new Date().toISOString(), status: "pending", message: "Run created from validated VFormix requirements." }]
      }
    });
    return toRun(created);
  }

  async updateRun(runId: string, input: VaanForgeRunUpdateInput) {
    const existing = await prismaAny().vaanForgeAgentRun.findUnique({ where: { runId } });
    if (!existing) {
      return undefined;
    }
    const activityHistory = Array.isArray(existing.activityHistory) ? existing.activityHistory : [];
    const updated = await prismaAny().vaanForgeAgentRun.update({
      where: { runId },
      data: {
        status: input.status,
        errorMessage: input.errorMessage,
        nextAction: input.nextAction,
        jobId: input.jobId,
        provider: input.provider,
        activityHistory: input.activity ? [...activityHistory, { at: new Date().toISOString(), ...input.activity }] : activityHistory
      }
    });
    return toRun(updated);
  }

  async findRun(organizationId: string, runId: string) {
    const run = await prismaAny().vaanForgeAgentRun.findFirst({ where: { organizationId, runId } });
    return run ? toRun(run) : undefined;
  }

  async listRuns(organizationId: string) {
    const runs = await prismaAny().vaanForgeAgentRun.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return runs.map(toRun);
  }

  async saveOutputs(runId: string, organizationId: string, outputs: VaanForgeOutputDraft[]) {
    await prismaAny().vaanForgeOutput.deleteMany({ where: { runId } });
    const created = [];
    for (const output of outputs) {
      created.push(
        await prismaAny().vaanForgeOutput.create({
          data: {
            runId,
            organizationId,
            outputType: output.outputType,
            title: output.title,
            format: output.format,
            content: output.content,
            metadata: output.metadata
          }
        })
      );
    }
    return created.map(toOutput);
  }

  async listOutputs(organizationId: string, runId: string) {
    const outputs = await prismaAny().vaanForgeOutput.findMany({
      where: { organizationId, runId },
      orderBy: { createdAt: "asc" }
    });
    return outputs.map(toOutput);
  }

  async createAuditLog(input: VaanForgeAuditLogInput) {
    const created = await prismaAny().vaanForgeAuditLog.create({ data: input });
    return toAuditLog(created);
  }

  async listAuditLogs(organizationId: string, runId: string) {
    const logs = await prismaAny().vaanForgeAuditLog.findMany({
      where: { organizationId, runId },
      orderBy: { createdAt: "asc" }
    });
    return logs.map(toAuditLog);
  }

  health(): RepositoryHealth {
    return { name: "vaanforge", mode: "postgres", writable: true, durable: true };
  }
}

function prismaAny(): any {
  return prisma() as any;
}

function toRun(run: any): StoredVaanForgeAgentRun {
  return {
    id: run.id,
    runId: run.runId,
    organizationId: run.organizationId,
    ownerId: run.ownerId,
    requestedById: run.requestedById,
    source: run.source,
    status: run.status,
    priority: run.priority,
    dueDate: run.dueDate instanceof Date ? run.dueDate.toISOString() : String(run.dueDate),
    inputRequirements: isRecord(run.inputRequirements) ? run.inputRequirements : {},
    errorMessage: run.errorMessage || undefined,
    nextAction: run.nextAction,
    activityHistory: Array.isArray(run.activityHistory) ? run.activityHistory.filter(isRecord) : [],
    jobId: run.jobId || undefined,
    provider: run.provider || undefined,
    createdAt: run.createdAt instanceof Date ? run.createdAt.toISOString() : String(run.createdAt),
    updatedAt: run.updatedAt instanceof Date ? run.updatedAt.toISOString() : String(run.updatedAt)
  };
}

function toOutput(output: any): StoredVaanForgeOutput {
  return {
    id: output.id,
    runId: output.runId,
    organizationId: output.organizationId,
    outputType: output.outputType,
    title: output.title,
    format: output.format,
    content: output.content,
    metadata: isRecord(output.metadata) ? output.metadata : undefined,
    createdAt: output.createdAt instanceof Date ? output.createdAt.toISOString() : String(output.createdAt),
    updatedAt: output.updatedAt instanceof Date ? output.updatedAt.toISOString() : String(output.updatedAt)
  };
}

function toAuditLog(entry: any): StoredVaanForgeAuditLog {
  return {
    id: entry.id,
    runId: entry.runId,
    organizationId: entry.organizationId,
    actorId: entry.actorId,
    step: entry.step,
    status: entry.status,
    message: entry.message,
    metadata: isRecord(entry.metadata) ? entry.metadata : undefined,
    createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : String(entry.createdAt)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const vaanForgeRepository: VaanForgeRepository =
  env.persistenceMode === "postgres" ? new PrismaVaanForgeRepository() : new MemoryVaanForgeRepository();
