import type { VaanForgeExecutionTask } from "../../infrastructure/ai/ai.interface";

export type GeneratedCodeFile = {
  taskId: string;
  module: string;
  path: string;
  content: string;
};

export class VaanForgeCodeGenerator {
  generate(task: VaanForgeExecutionTask, blueprint: Record<string, unknown>): GeneratedCodeFile[] {
    return task.outputPaths.map((path) => ({
      taskId: task.taskId,
      module: task.module,
      path,
      content: this.contentFor(task, blueprint, path)
    }));
  }

  private contentFor(task: VaanForgeExecutionTask, blueprint: Record<string, unknown>, path: string) {
    if (!path.endsWith(".md")) {
      return this.implementationStub(task, blueprint, path);
    }

    return [
      `# ${task.title}`,
      "",
      task.description,
      "",
      "## Source Blueprint",
      `Phase 1: ${String(blueprint.phaseOneRunId || "approved-blueprint")}`,
      "",
      "## Workflow Controls",
      `- Module: ${task.module}`,
      `- Priority: ${task.priority}`,
      "- Required fields: owner, status, priority, due date, audit logs, activity history, next action",
      "",
      "## Output Paths",
      ...task.outputPaths.map((outputPath) => `- ${outputPath}`)
    ].join("\n");
  }

  private implementationStub(task: VaanForgeExecutionTask, blueprint: Record<string, unknown>, path: string) {
    const serializedBlueprint = JSON.stringify(
      {
        module: task.module,
        title: task.title,
        description: task.description,
        synchronization: blueprint.synchronizationChecks || blueprint.validationChecks || []
      },
      null,
      2
    );

    if (path.endsWith(".ts") || path.endsWith(".tsx")) {
      return [
        "export const generatedVaanForgeModulePlan = " + serializedBlueprint + " as const;",
        "",
        "export function getGeneratedVaanForgeModulePlan() {",
        "  return generatedVaanForgeModulePlan;",
        "}",
        ""
      ].join("\n");
    }

    if (path.endsWith(".json")) {
      return serializedBlueprint + "\n";
    }

    return `${serializedBlueprint}\n`;
  }
}

export const vaanForgeCodeGenerator = new VaanForgeCodeGenerator();
