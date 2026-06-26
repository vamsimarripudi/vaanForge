import { env } from "../../config/env";
import { createId, store, type StoredIntelligenceSnapshot } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export type IntelligenceSnapshotInput = Omit<StoredIntelligenceSnapshot, "id" | "createdAt">;

export interface IntelligenceRepository {
  createSnapshot(input: IntelligenceSnapshotInput): Promise<StoredIntelligenceSnapshot> | StoredIntelligenceSnapshot;
  latestSnapshot(organizationId: string): Promise<StoredIntelligenceSnapshot | undefined> | StoredIntelligenceSnapshot | undefined;
  health(): RepositoryHealth;
}

export class MemoryIntelligenceRepository implements IntelligenceRepository {
  createSnapshot(input: IntelligenceSnapshotInput) {
    const snapshot = { id: createId("ins"), ...input, createdAt: new Date().toISOString() };
    store.intelligenceSnapshots.push(snapshot);
    return snapshot;
  }

  latestSnapshot(organizationId: string) {
    return store.intelligenceSnapshots
      .filter((snapshot) => snapshot.organizationId === organizationId)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))[0];
  }

  health(): RepositoryHealth {
    return { name: "intelligence", mode: "memory", writable: true, durable: false };
  }
}

export class PrismaIntelligenceRepository implements IntelligenceRepository {
  async createSnapshot(input: IntelligenceSnapshotInput) {
    const snapshot = await prisma().intelligenceSnapshot.create({
      data: {
        organizationId: input.organizationId,
        reportExplanation: input.reportExplanation,
        riskSignals: input.riskSignals,
        nextTasks: input.nextTasks,
        disclaimer: input.disclaimer,
        placeholders: input.placeholders
      }
    });
    return this.toSnapshot(snapshot);
  }

  async latestSnapshot(organizationId: string) {
    const snapshot = await prisma().intelligenceSnapshot.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return snapshot ? this.toSnapshot(snapshot) : undefined;
  }

  health(): RepositoryHealth {
    return { name: "intelligence", mode: "postgres", writable: true, durable: true };
  }

  private toSnapshot(snapshot: PrismaIntelligenceSnapshot): StoredIntelligenceSnapshot {
    return {
      id: snapshot.id,
      organizationId: snapshot.organizationId,
      reportExplanation: snapshot.reportExplanation,
      riskSignals: Array.isArray(snapshot.riskSignals) ? snapshot.riskSignals.map(String) : [],
      nextTasks: Array.isArray(snapshot.nextTasks) ? snapshot.nextTasks.map(String) : [],
      disclaimer: snapshot.disclaimer,
      placeholders: snapshot.placeholders,
      createdAt: snapshot.createdAt.toISOString()
    };
  }
}

type PrismaIntelligenceSnapshot = {
  id: string;
  organizationId: string;
  reportExplanation: string;
  riskSignals: unknown;
  nextTasks: unknown;
  disclaimer: string;
  placeholders: number;
  createdAt: Date;
};

export const intelligenceRepository: IntelligenceRepository =
  env.persistenceMode === "postgres" ? new PrismaIntelligenceRepository() : new MemoryIntelligenceRepository();
