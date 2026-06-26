import { auditService } from "../audit/audit.service";
import { jobService } from "../../infrastructure/jobs/job.service";
import type { ValidationCommand } from "./vaanforge-validation-runner";
import { vaanForgeCodeGenerator } from "./vaanforge-code-generator";
import { vaanForgeExecutionRepository, type VaanForgeExecutionRepository } from "./vaanforge-execution.repository";
import { vaanForgeFileWriter } from "./vaanforge-file-writer";
import { vaanForgeRepairLoop } from "./vaanforge-repair-loop";
import { vaanForgeTaskGraphEngine } from "./vaanforge-task-graph";
import { vaanForgeValidationRunner } from "./vaanforge-validation-runner";
import { vaanForgeService } from "./vaanforge.service";
import { createId } from "../../database/in-memory-store";

export type VaanForgeExecutionSubmitInput = {
  organizationId: string;
  requestedById: string;
  phaseOneRunId: string;
  allowReviewedOverwrite?: boolean;
  validationCommands?: ValidationCommand[];
};

export class VaanForgeExecutionService {
  constructor(private readonly repository: VaanForgeExecutionRepository = vaanForgeExecutionRepository) {}

  async submit(input: VaanForgeExecutionSubmitInput) {
    const phaseOne = await vaanForgeService.detail(input.organizationId, input.phaseOneRunId);
    if (!phaseOne) {
      throw new Error("Approved Phase 1 blueprint run not found.");
    }
    if (phaseOne.status !== "completed") {
      throw new Error(`Phase 1 run must be completed before execution. Current status: ${phaseOne.status}`);
    }

    const approvedBlueprint = this.buildApprovedBlueprint(input.phaseOneRunId, phaseOne.outputs);
    const graph = await vaanForgeTaskGraphEngine.build({
      phaseOneRunId: input.phaseOneRunId,
      blueprint: approvedBlueprint,
      ownerId: phaseOne.ownerId,
      priority: phaseOne.priority,
      dueDate: phaseOne.dueDate
    });

    const execution = await this.repository.createExecution({
      phaseOneRunId: input.phaseOneRunId,
      organizationId: input.organizationId,
      ownerId: phaseOne.ownerId,
      requestedById: input.requestedById,
      priority: phaseOne.priority,
      dueDate: phaseOne.dueDate,
      approvedBlueprint,
      taskGraph: graph as unknown as Record<string, unknown>,
      nextAction: "Prepare executable task graph."
    });

    await this.recordActivity(execution.executionId, input.organizationId, input.requestedById, "execution.created", "pending", "Phase 2 execution run created.");
    const job = await jobService.enqueue("VAANFORGE_EXECUTION_REQUESTED", { executionId: execution.executionId, phaseOneRunId: input.phaseOneRunId });
    await this.repository.updateExecution(execution.executionId, {
      activity: { status: "pending", message: `Queued execution job ${job.id}.` }
    });

    await this.processExecution(execution.executionId, input);
    return this.detail(input.organizationId, execution.executionId);
  }

  async processExecution(executionId: string, input: VaanForgeExecutionSubmitInput) {
    try {
      const execution = await this.repository.findExecution(input.organizationId, executionId);
      if (!execution) {
        throw new Error("Execution run not found.");
      }
      const graph = execution.taskGraph as { tasks?: Array<Record<string, unknown>>; validationOrder?: string[]; synchronizationChecks?: string[] };
      const tasks = (graph.tasks || []).map((task) => ({
        taskId: String(task.taskId),
        executionId,
        organizationId: input.organizationId,
        module: String(task.module),
        title: String(task.title),
        description: String(task.description),
        priority: execution.priority,
        ownerId: execution.ownerId,
        dueDate: execution.dueDate,
        dependencies: Array.isArray(task.dependencies) ? task.dependencies.map(String) : [],
        outputPaths: Array.isArray(task.outputPaths) ? task.outputPaths.map(String) : [],
        nextAction: "Generate module files."
      }));
      await this.repository.updateExecution(executionId, {
        status: "preparing",
        nextAction: "Convert approved blueprint into executable task graph.",
        activity: { status: "preparing", message: "Preparing execution task graph." }
      });
      await this.recordActivity(executionId, input.organizationId, input.requestedById, "task_graph.prepared", "preparing", "Executable task graph prepared.", {
        tasks: tasks.length
      });
      await this.repository.createTasks(tasks);

      await this.repository.updateExecution(executionId, {
        status: "generating",
        nextAction: "Generate and write code files by module.",
        activity: { status: "generating", message: "File generation started." }
      });
      for (const task of graph.tasks || []) {
        const generatedFiles = vaanForgeCodeGenerator.generate(
          {
            taskId: String(task.taskId),
            module: String(task.module) as never,
            title: String(task.title),
            description: String(task.description),
            dependencies: Array.isArray(task.dependencies) ? task.dependencies.map(String) : [],
            outputPaths: Array.isArray(task.outputPaths) ? task.outputPaths.map(String) : [],
            priority: execution.priority
          },
          execution.approvedBlueprint
        );
        for (const generatedFile of generatedFiles) {
          const writeResult = vaanForgeFileWriter.write(generatedFile, Boolean(input.allowReviewedOverwrite));
          await this.repository.upsertFile({
            fileId: createId("file"),
            executionId,
            taskId: generatedFile.taskId,
            organizationId: input.organizationId,
            module: generatedFile.module,
            path: generatedFile.path,
            operation: writeResult.operation,
            status: writeResult.status,
            contentHash: writeResult.contentHash,
            previousHash: writeResult.previousHash,
            diffSummary: writeResult.diffSummary || writeResult.reason,
            humanReviewRequired: writeResult.humanReviewRequired
          });
          if (writeResult.status === "blocked") {
            await this.repository.createError({
              errorId: createId("err"),
              executionId,
              organizationId: input.organizationId,
              source: "file-writer",
              filePath: generatedFile.path,
              reason: writeResult.reason || "File write blocked.",
              fixAttempt: "Human diff review required before overwrite.",
              status: "blocked"
            });
          }
        }
        await this.repository.updateTask(String(task.taskId), "completed", "Module files generated or blocked with review record.");
      }

      const blockedFiles = (await this.repository.listFiles(input.organizationId, executionId)).filter((file) => file.status === "blocked");
      if (blockedFiles.length) {
        await this.repository.updateExecution(executionId, {
          status: "blocked",
          errorMessage: "One or more files require human diff review before overwrite.",
          nextAction: "Review blocked file diffs, then rerun with approved overwrite.",
          activity: { status: "blocked", message: "Execution blocked by diff review policy." }
        });
        await this.recordActivity(executionId, input.organizationId, input.requestedById, "diff_review.blocked", "blocked", "Human diff review is required.", {
          files: blockedFiles.map((file) => file.path)
        });
        return;
      }

      await this.repository.updateExecution(executionId, {
        status: "validating",
        nextAction: "Run lint, type-check, tests, and build.",
        activity: { status: "validating", message: "Validation gates started." }
      });
      await this.runValidationCycles(executionId, input);
    } catch (error) {
      await this.repository.updateExecution(executionId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown execution error",
        nextAction: "Inspect execution report and retry after fixing the failure.",
        activity: { status: "failed", message: error instanceof Error ? error.message : "Unknown execution error" }
      });
    }
  }

  async detail(organizationId: string, executionId: string) {
    const execution = await this.repository.findExecution(organizationId, executionId);
    if (!execution) {
      return undefined;
    }
    const [tasks, files, validationRuns, errors, repairAttempts, commits, activityLogs] = await Promise.all([
      this.repository.listTasks(organizationId, executionId),
      this.repository.listFiles(organizationId, executionId),
      this.repository.listValidationRuns(organizationId, executionId),
      this.repository.listErrors(organizationId, executionId),
      this.repository.listRepairAttempts(organizationId, executionId),
      this.repository.listCommits(organizationId, executionId),
      this.repository.listActivityLogs(organizationId, executionId)
    ]);
    return { ...execution, tasks, files, validationRuns, errors, repairAttempts, commits, activityLogs };
  }

  list(organizationId: string) {
    return this.repository.listExecutions(organizationId);
  }

  async transitionExecution(input: {
    organizationId: string;
    actorId: string;
    executionId: string;
    status: "pending" | "preparing" | "generating" | "validating" | "repairing" | "completed" | "blocked" | "failed";
    step: string;
    message: string;
    nextAction: string;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }) {
    const execution = await this.repository.findExecution(input.organizationId, input.executionId);
    if (!execution) {
      return undefined;
    }
    const updated = await this.repository.updateExecution(input.executionId, {
      status: input.status,
      errorMessage: input.errorMessage,
      nextAction: input.nextAction,
      activity: { status: input.status, message: input.message, ...input.metadata }
    });
    await this.recordActivity(input.executionId, input.organizationId, input.actorId, input.step, input.status, input.message, input.metadata);
    return updated;
  }

  private async runValidationCycles(executionId: string, input: VaanForgeExecutionSubmitInput) {
    const results = await vaanForgeValidationRunner.runAll(input.validationCommands);
    for (const result of results) {
      const validationId = createId("val");
      await this.repository.createValidationRun({
        validationId,
        executionId,
        organizationId: input.organizationId,
        checkName: result.checkName,
        command: result.command,
        status: result.status,
        exitCode: result.exitCode,
        output: result.output,
        startedAt: result.startedAt,
        completedAt: result.completedAt
      });
      if (result.status === "failed") {
        for (const parsed of vaanForgeRepairLoop.parseErrors(result)) {
          const error = await this.repository.createError({
            errorId: createId("err"),
            executionId,
            organizationId: input.organizationId,
            validationId,
            source: parsed.source,
            filePath: parsed.filePath,
            line: parsed.line,
            reason: parsed.reason
          });
          const repair = vaanForgeRepairLoop.planRepair(error);
          await this.repository.createRepairAttempt({
            repairId: createId("repair"),
            executionId,
            organizationId: input.organizationId,
            errorId: error.errorId,
            cycle: 1,
            strategy: repair.strategy,
            status: "attempted",
            notes: repair.notes
          });
        }
      }
    }

    const failed = results.filter((result) => result.status === "failed");
    if (failed.length) {
      await this.repository.updateExecution(executionId, {
        status: "blocked",
        validationSummary: { passed: results.length - failed.length, failed: failed.length },
        executionReport: { status: "blocked", results },
        errorMessage: "Validation failed. Repair attempts were logged for review.",
        nextAction: "Apply repair attempts and rerun validation.",
        activity: { status: "blocked", message: "Validation failures blocked completion." }
      });
      await this.recordActivity(executionId, input.organizationId, input.requestedById, "validation.blocked", "blocked", "Validation failures blocked completion.");
      return;
    }

    await this.repository.createCommit({
      commitId: createId("commit"),
      executionId,
      organizationId: input.organizationId,
      sha: undefined,
      message: `VaanForge execution ${executionId} generated files and passed validation`,
      files: (await this.repository.listFiles(input.organizationId, executionId)).map((file) => file.path),
      status: "skipped"
    });
    await this.repository.updateExecution(executionId, {
      status: "completed",
      validationSummary: { passed: results.length, failed: 0 },
      executionReport: { status: "completed", results },
      nextAction: "Review generated files and create a human-approved git commit if required.",
      activity: { status: "completed", message: "All validation gates passed." }
    });
    await this.recordActivity(executionId, input.organizationId, input.requestedById, "execution.completed", "completed", "lint, type-check, tests, and build passed.");
  }

  private buildApprovedBlueprint(phaseOneRunId: string, outputs: Array<{ outputType: string; content: string; format: string }>) {
    const blueprint: Record<string, unknown> = { phaseOneRunId };
    for (const output of outputs) {
      const key = outputTypeToKey(output.outputType);
      blueprint[key] = output.format === "json" ? safeJson(output.content) : output.content;
    }
    return blueprint;
  }

  private async recordActivity(
    executionId: string,
    organizationId: string,
    actorId: string,
    step: string,
    status: "pending" | "preparing" | "generating" | "validating" | "repairing" | "completed" | "blocked" | "failed",
    message: string,
    metadata?: Record<string, unknown>
  ) {
    await this.repository.createActivityLog({ executionId, organizationId, actorId, step, status, message, metadata });
    auditService.record({
      actorId,
      organizationId,
      action: "VAANFORGE_AGENT_RUN",
      entityType: "AgentExecutionRun",
      entityId: executionId,
      metadata: { step, status, message, ...metadata }
    });
  }
}

function outputTypeToKey(outputType: string) {
  return outputType.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function safeJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

export const vaanForgeExecutionService = new VaanForgeExecutionService();
