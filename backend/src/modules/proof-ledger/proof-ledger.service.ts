import { createHash } from "node:crypto";
import { z } from "zod";
import { createId, store, type StoredProofRecord } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";

export type ProofActor = { organizationId: string; userId: string; role: string; workspaceId?: string; requestId?: string; ipAddress?: string; userAgent?: string };

export const proofRecordSchema = z.object({
  eventType: z.enum(["blueprint.approved", "agent_output.finalized", "generated_file.approved", "deployment.released", "invoice.issued", "marketplace_app.published", "legal_policy.accepted", "release_notes.published"]),
  entityType: z.string().min(2).max(120),
  entityId: z.string().min(2).max(160),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  content: z.string().max(50000).optional(),
  workspaceId: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});

export type CreateProofInput = z.infer<typeof proofRecordSchema>;

export interface ProofProvider {
  readonly providerName: "local" | "future_blockchain";
  anchor(record: Omit<StoredProofRecord, "provider" | "providerTransactionId" | "verificationStatus">): Promise<{ provider: "local" | "future_blockchain"; providerTransactionId?: string; verificationStatus: "pending" | "verified" }>;
  verify(record: StoredProofRecord): Promise<{ verified: boolean; evidence: Record<string, unknown> }>;
}

export interface FutureBlockchainProvider extends ProofProvider {
  readonly providerName: "future_blockchain";
}

export class HashingService {
  sha256(value: unknown) {
    return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
  }
}

export class LocalProofProvider implements ProofProvider {
  readonly providerName = "local" as const;

  async anchor() {
    return { provider: this.providerName, verificationStatus: "verified" as const };
  }

  async verify(record: StoredProofRecord) {
    return {
      verified: /^[a-f0-9]{64}$/i.test(record.contentHash),
      evidence: {
        provider: this.providerName,
        localLedger: true,
        onChainTransaction: false
      }
    };
  }
}

export class ProofLedgerService {
  constructor(private readonly hashing = new HashingService(), private readonly provider: ProofProvider = new LocalProofProvider()) {}

  async create(actor: ProofActor, input: CreateProofInput) {
    const contentHash = input.contentHash || this.hashing.sha256(input.content || { eventType: input.eventType, entityType: input.entityType, entityId: input.entityId, metadata: input.metadata });
    const now = new Date().toISOString();
    const baseRecord = {
      id: createId("proof"),
      proofId: createId("proof_record"),
      organizationId: actor.organizationId,
      workspaceId: input.workspaceId || actor.workspaceId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      contentHash,
      metadata: maskMetadata(input.metadata),
      createdBy: actor.userId,
      createdAt: now,
      updatedAt: now
    };
    const anchored = await this.provider.anchor(baseRecord);
    const record: StoredProofRecord = {
      ...baseRecord,
      provider: anchored.provider,
      providerTransactionId: anchored.providerTransactionId,
      verificationStatus: anchored.verificationStatus
    };
    store.proofRecords.push(record);
    this.audit(actor, "PROOF_RECORD_CREATED", record);
    return record;
  }

  list(actor: ProofActor) {
    return store.proofRecords.filter((record) => record.organizationId === actor.organizationId);
  }

  detail(actor: ProofActor, proofId: string) {
    const record = this.list(actor).find((item) => item.proofId === proofId || item.id === proofId);
    if (!record) throw new Error("Proof record was not found.");
    return record;
  }

  async verify(actor: ProofActor, proofId: string) {
    const record = this.detail(actor, proofId);
    const result = await this.provider.verify(record);
    record.verificationStatus = result.verified ? "verified" : "failed";
    record.updatedAt = new Date().toISOString();
    this.audit(actor, "PROOF_RECORD_VERIFIED", record, { result });
    return { ...record, verificationEvidence: result.evidence };
  }

  private audit(actor: ProofActor, action: string, record: StoredProofRecord, metadata: Record<string, unknown> = {}) {
    auditService.record({
      actorId: actor.userId,
      organizationId: actor.organizationId,
      workspaceId: record.workspaceId,
      action: "SECURITY_ACTION",
      entityType: "proof_record",
      entityId: record.proofId,
      result: "success",
      requestId: actor.requestId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      metadata: { proofAction: action, eventType: record.eventType, provider: record.provider, ...metadata }
    });
  }
}

export const proofLedgerService = new ProofLedgerService();

function maskMetadata(value: Record<string, unknown>) {
  const serialized = JSON.stringify(value).replace(/"(secret|token|password|api[_ -]?key|private[_ -]?key)"\s*:\s*"[^"]*"/gi, "\"$1\":\"[masked]\"");
  return JSON.parse(serialized) as Record<string, unknown>;
}
