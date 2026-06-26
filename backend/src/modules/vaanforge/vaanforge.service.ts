import { aiService } from "../../infrastructure/ai/ai.service";
import type { VaanForgeRequirement } from "../../infrastructure/ai/ai.interface";
import { jobService } from "../../infrastructure/jobs/job.service";
import { auditService } from "../audit/audit.service";
import { createVaanForgeOutputDrafts, validateVaanForgeOutputs } from "./vaanforge.output-storage";
import { parseVaanForgeRequirement } from "./vaanforge.parser";
import { vaanForgeRepository, type VaanForgeRepository } from "./vaanforge.repository";

export type VaanForgeSubmitInput = {
  organizationId: string;
  requestedById: string;
  requirement: unknown;
};

export class VaanForgeService {
  constructor(private readonly repository: VaanForgeRepository = vaanForgeRepository) {}

  async submit(input: VaanForgeSubmitInput) {
    const requirement = parseVaanForgeRequirement(input.requirement);
    const run = await this.repository.createRun({
      organizationId: input.organizationId,
      ownerId: requirement.ownerId,
      requestedById: input.requestedById,
      source: requirement.source,
      priority: requirement.priority,
      dueDate: requirement.dueDate,
      inputRequirements: requirement as unknown as Record<string, unknown>,
      nextAction: "Analyze requirements and generate production blueprint."
    });

    await this.recordStep(run.runId, input.organizationId, input.requestedById, "requirements.validated", "pending", "VFormix requirements passed schema validation.", {
      productName: requirement.productName,
      source: requirement.source
    });

    const job = await jobService.enqueue("VAANFORGE_BLUEPRINT_REQUESTED", { runId: run.runId, organizationId: input.organizationId });
    await this.repository.updateRun(run.runId, {
      jobId: job.id,
      activity: { status: "pending", message: `Queued blueprint generation job ${job.id}.` }
    });

    await this.processRun(run.runId, requirement, input.organizationId, input.requestedById);
    return this.detail(input.organizationId, run.runId);
  }

  async processRun(runId: string, requirement: VaanForgeRequirement, organizationId: string, actorId: string) {
    try {
      await this.repository.updateRun(runId, {
        status: "analyzing",
        nextAction: "Generate PRD, architecture, data, API, UI, sprint, and Codex prompt outputs.",
        activity: { status: "analyzing", message: "Requirement analysis started." }
      });
      await this.recordStep(runId, organizationId, actorId, "analysis.started", "analyzing", "Requirement analysis started.");

      this.validatePhase("analysis", requirement);
      const blueprint = await aiService.generateProjectBlueprint(requirement);
      const outputs = createVaanForgeOutputDrafts(blueprint);
      validateVaanForgeOutputs(outputs);

      await this.repository.updateRun(runId, {
        status: "planned",
        provider: blueprint.provider,
        nextAction: "Persist generated outputs after validation.",
        activity: { status: "planned", message: "Blueprint generated and output validation passed." }
      });
      await this.recordStep(runId, organizationId, actorId, "outputs.validated", "planned", "All required blueprint outputs are present and non-empty.", {
        validationChecks: blueprint.validationChecks
      });

      await this.repository.saveOutputs(runId, organizationId, outputs);
      await this.repository.updateRun(runId, {
        status: "completed",
        nextAction: blueprint.nextActions[0] || "Review generated blueprint.",
        activity: { status: "completed", message: "Blueprint outputs persisted successfully." }
      });
      await this.recordStep(runId, organizationId, actorId, "run.completed", "completed", "VaanForge blueprint generation completed.", {
        nextActions: blueprint.nextActions
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown VaanForge error";
      await this.repository.updateRun(runId, {
        status: "failed",
        errorMessage: message,
        nextAction: "Fix validation or provider error, then resubmit requirements.",
        activity: { status: "failed", message }
      });
      await this.recordStep(runId, organizationId, actorId, "run.failed", "failed", message);
    }
  }

  async list(organizationId: string) {
    return this.repository.listRuns(organizationId);
  }

  async detail(organizationId: string, runId: string) {
    const run = await this.repository.findRun(organizationId, runId);
    if (!run) {
      return undefined;
    }
    const [outputs, auditLogs] = await Promise.all([this.repository.listOutputs(organizationId, runId), this.repository.listAuditLogs(organizationId, runId)]);
    return { ...run, outputs, auditLogs };
  }

  async requirements(organizationId: string, runId: string) {
    const run = await this.repository.findRun(organizationId, runId);
    return run?.inputRequirements;
  }

  async plans(organizationId: string, runId: string) {
    return this.repository.listOutputs(organizationId, runId);
  }

  async auditLogs(organizationId: string, runId: string) {
    return this.repository.listAuditLogs(organizationId, runId);
  }

  async transitionRun(input: {
    organizationId: string;
    actorId: string;
    runId: string;
    status: "pending" | "analyzing" | "planned" | "failed" | "completed";
    step: string;
    message: string;
    nextAction: string;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }) {
    const run = await this.repository.findRun(input.organizationId, input.runId);
    if (!run) {
      return undefined;
    }
    const updated = await this.repository.updateRun(input.runId, {
      status: input.status,
      errorMessage: input.errorMessage,
      nextAction: input.nextAction,
      activity: { status: input.status, message: input.message }
    });
    await this.recordStep(input.runId, input.organizationId, input.actorId, input.step, input.status, input.message, input.metadata);
    return updated;
  }

  health() {
    return this.repository.health();
  }

  private validatePhase(phase: string, requirement: VaanForgeRequirement) {
    const missingWorkflowFields = [
      requirement.ownerId ? undefined : "ownerId",
      requirement.priority ? undefined : "priority",
      requirement.dueDate ? undefined : "dueDate",
      requirement.constraints.permissions.length ? undefined : "permissions",
      requirement.constraints.routing.length ? undefined : "routing"
    ].filter(Boolean);

    if (missingWorkflowFields.length) {
      throw new Error(`${phase} validation failed: missing ${missingWorkflowFields.join(", ")}`);
    }
  }

  private async recordStep(
    runId: string,
    organizationId: string,
    actorId: string,
    step: string,
    status: "pending" | "analyzing" | "planned" | "failed" | "completed",
    message: string,
    metadata?: Record<string, unknown>
  ) {
    const entry = await this.repository.createAuditLog({ runId, organizationId, actorId, step, status, message, metadata });
    auditService.record({
      actorId,
      organizationId,
      action: "VAANFORGE_AGENT_RUN",
      entityType: "VaanForgeAgentRun",
      entityId: runId,
      metadata: { step, status, message, localAuditId: entry.id, ...metadata }
    });
    return entry;
  }
}

export const vaanForgeService = new VaanForgeService();
