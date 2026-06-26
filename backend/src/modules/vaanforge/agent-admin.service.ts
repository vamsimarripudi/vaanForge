import { z } from "zod";
import { vaanForgeExecutionService } from "./vaanforge-execution.service";
import { vaanForgeService } from "./vaanforge.service";

export const agentActionSchema = z.object({
  reason: z.string().min(2).optional()
});

export class AgentAdminService {
  async summary(organizationId: string) {
    const [blueprintRuns, executions] = await Promise.all([vaanForgeService.list(organizationId), vaanForgeExecutionService.list(organizationId)]);
    const executionDetails = await Promise.all(executions.map((run) => vaanForgeExecutionService.detail(organizationId, run.executionId)));
    const validationRuns = executionDetails.flatMap((detail) => detail?.validationRuns || []);
    const passedValidations = validationRuns.filter((run) => run.status === "passed").length;
    const totalValidations = validationRuns.length;
    const allRuns = [
      ...blueprintRuns.map((run) => ({ id: run.runId, kind: "blueprint", status: run.status, createdAt: run.createdAt })),
      ...executions.map((run) => ({ id: run.executionId, kind: "execution", status: run.status, createdAt: run.createdAt }))
    ];

    return {
      totalRuns: allRuns.length,
      activeRuns: allRuns.filter((run) => ["pending", "analyzing", "planned", "preparing", "generating", "validating", "repairing"].includes(run.status)).length,
      completedRuns: allRuns.filter((run) => run.status === "completed").length,
      failedOrBlockedRuns: allRuns.filter((run) => ["failed", "blocked"].includes(run.status)).length,
      averageValidationSuccessRate: totalValidations ? Math.round((passedValidations / totalValidations) * 100) : 0,
      recentActivity: executionDetails
        .flatMap((detail) => detail?.activityLogs || [])
        .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
        .slice(0, 10),
      notifications: this.notifications(executionDetails)
    };
  }

  async runs(organizationId: string) {
    const [blueprintRuns, executions] = await Promise.all([vaanForgeService.list(organizationId), vaanForgeExecutionService.list(organizationId)]);
    return [
      ...blueprintRuns.map((run) => ({
        runId: run.runId,
        kind: "blueprint",
        product: getProductName(run.inputRequirements),
        ownerId: run.ownerId,
        status: run.status,
        priority: run.priority,
        dueDate: run.dueDate,
        nextAction: run.nextAction,
        createdAt: run.createdAt,
        failedValidations: 0
      })),
      ...executions.map((run) => ({
        runId: run.executionId,
        kind: "execution",
        product: getProductName(run.approvedBlueprint),
        ownerId: run.ownerId,
        status: run.status,
        priority: run.priority,
        dueDate: run.dueDate,
        nextAction: run.nextAction,
        createdAt: run.createdAt,
        failedValidations: getFailedValidationCount(run.validationSummary)
      }))
    ].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }

  async detail(organizationId: string, runId: string) {
    const execution = await vaanForgeExecutionService.detail(organizationId, runId);
    if (execution) {
      return { kind: "execution", ...execution };
    }
    const blueprint = await vaanForgeService.detail(organizationId, runId);
    return blueprint ? { kind: "blueprint", ...blueprint } : undefined;
  }

  async tasks(organizationId: string, runId: string) {
    const detail = await vaanForgeExecutionService.detail(organizationId, runId);
    return detail?.tasks || [];
  }

  async files(organizationId: string, runId: string) {
    const detail = await vaanForgeExecutionService.detail(organizationId, runId);
    return detail?.files || [];
  }

  async validations(organizationId: string, runId: string) {
    const detail = await vaanForgeExecutionService.detail(organizationId, runId);
    return detail?.validationRuns || [];
  }

  async errors(organizationId: string, runId: string) {
    const detail = await vaanForgeExecutionService.detail(organizationId, runId);
    return detail?.errors || [];
  }

  async logs(organizationId: string, runId: string) {
    const execution = await vaanForgeExecutionService.detail(organizationId, runId);
    if (execution) {
      return execution.activityLogs;
    }
    const blueprint = await vaanForgeService.detail(organizationId, runId);
    return blueprint?.auditLogs || [];
  }

  async action(input: { organizationId: string; actorId: string; runId: string; action: "approve" | "reject" | "block" | "resume" | "cancel"; reason?: string }) {
    const execution = await vaanForgeExecutionService.detail(input.organizationId, input.runId);
    if (execution) {
      return vaanForgeExecutionService.transitionExecution({
        organizationId: input.organizationId,
        actorId: input.actorId,
        executionId: input.runId,
        ...executionTransition(input.action, input.reason)
      });
    }

    const blueprint = await vaanForgeService.detail(input.organizationId, input.runId);
    if (!blueprint) {
      return undefined;
    }
    return vaanForgeService.transitionRun({
      organizationId: input.organizationId,
      actorId: input.actorId,
      runId: input.runId,
      ...blueprintTransition(input.action, input.reason)
    });
  }

  private notifications(details: Array<Awaited<ReturnType<typeof vaanForgeExecutionService.detail>>>) {
    return details
      .filter(Boolean)
      .flatMap((detail) => {
        if (!detail) {
          return [];
        }
        const notices = [];
        if (detail.status === "completed") {
          notices.push({ type: "run_completed", message: `${detail.executionId} completed`, runId: detail.executionId });
        }
        if (detail.status === "failed") {
          notices.push({ type: "run_failed", message: detail.errorMessage || "Run failed", runId: detail.executionId });
        }
        if (detail.status === "blocked") {
          notices.push({ type: "approval_required", message: detail.nextAction, runId: detail.executionId });
        }
        if (detail.validationRuns.some((run) => run.status === "failed")) {
          notices.push({ type: "validation_failed", message: "Validation failed", runId: detail.executionId });
        }
        if (detail.files.some((file) => file.humanReviewRequired)) {
          notices.push({ type: "human_review_needed", message: "Diff review needed", runId: detail.executionId });
        }
        return notices;
      });
  }
}

function executionTransition(action: "approve" | "reject" | "block" | "resume" | "cancel", reason?: string) {
  const message = reason ? `${action} requested: ${reason}` : `${action} requested`;
  if (action === "approve") {
    return { status: "generating" as const, step: "approval.execution_approved", message, nextAction: "Continue file generation and validation." };
  }
  if (action === "resume") {
    return { status: "preparing" as const, step: "approval.execution_resumed", message, nextAction: "Resume execution workflow from the next pending step." };
  }
  if (action === "reject") {
    return { status: "blocked" as const, step: "approval.execution_rejected", message, errorMessage: reason, nextAction: "Revise execution plan before continuing." };
  }
  if (action === "cancel") {
    return { status: "failed" as const, step: "approval.execution_cancelled", message, errorMessage: reason || "Execution cancelled", nextAction: "Create a new execution run if work should continue." };
  }
  return { status: "blocked" as const, step: "approval.execution_blocked", message, errorMessage: reason, nextAction: "Resolve blocker or approve resume." };
}

function blueprintTransition(action: "approve" | "reject" | "block" | "resume" | "cancel", reason?: string) {
  const message = reason ? `${action} requested: ${reason}` : `${action} requested`;
  if (action === "approve") {
    return { status: "completed" as const, step: "approval.blueprint_approved", message, nextAction: "Start Phase 2 execution from this approved blueprint." };
  }
  if (action === "resume") {
    return { status: "planned" as const, step: "approval.blueprint_resumed", message, nextAction: "Review generated outputs and approve execution." };
  }
  if (action === "reject") {
    return { status: "failed" as const, step: "approval.blueprint_rejected", message, errorMessage: reason, nextAction: "Revise requirements and regenerate blueprint." };
  }
  if (action === "cancel") {
    return { status: "failed" as const, step: "approval.blueprint_cancelled", message, errorMessage: reason || "Blueprint run cancelled", nextAction: "Create a new blueprint run if needed." };
  }
  return { status: "failed" as const, step: "approval.blueprint_blocked", message, errorMessage: reason, nextAction: "Resolve blocker and resume blueprint review." };
}

function getProductName(value: Record<string, unknown>) {
  if (typeof value.productName === "string") {
    return value.productName;
  }
  if (typeof value.productRequirementDocument === "string") {
    const match = value.productRequirementDocument.match(/^#\s+(.+?)\s+Product Requirement Document/m);
    return match?.[1] || "VaanForge project";
  }
  return "VaanForge project";
}

function getFailedValidationCount(summary: Record<string, unknown> | undefined) {
  return typeof summary?.failed === "number" ? summary.failed : 0;
}

export const agentAdminService = new AgentAdminService();
