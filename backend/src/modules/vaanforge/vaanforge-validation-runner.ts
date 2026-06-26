import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type ValidationCheckName = "lint" | "type-check" | "tests" | "build";

export type ValidationCommand = {
  checkName: ValidationCheckName;
  command: string;
  args: string[];
};

export type ValidationResult = {
  checkName: ValidationCheckName;
  command: string;
  status: "passed" | "failed";
  exitCode?: number;
  output: string;
  startedAt: string;
  completedAt: string;
};

const defaultCommands: ValidationCommand[] = [
  { checkName: "lint", command: "npm.cmd", args: ["run", "lint"] },
  { checkName: "type-check", command: "npm.cmd", args: ["run", "typecheck"] },
  { checkName: "tests", command: "npm.cmd", args: ["run", "test"] },
  { checkName: "build", command: "npm.cmd", args: ["run", "build"] }
];

export class VaanForgeValidationRunner {
  constructor(private readonly workspaceRoot = resolve(__dirname, "../../../..")) {}

  async runAll(commands: ValidationCommand[] = defaultCommands): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    for (const command of commands) {
      results.push(await this.run(command));
    }
    return results;
  }

  async run(command: ValidationCommand): Promise<ValidationResult> {
    const startedAt = new Date().toISOString();
    try {
      const result = await execFileAsync(command.command, command.args, {
        cwd: this.workspaceRoot,
        timeout: 120_000,
        maxBuffer: 1024 * 1024 * 4
      });
      return {
        checkName: command.checkName,
        command: [command.command, ...command.args].join(" "),
        status: "passed",
        exitCode: 0,
        output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
        startedAt,
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      const failure = error as { code?: number; stdout?: string; stderr?: string; message?: string };
      return {
        checkName: command.checkName,
        command: [command.command, ...command.args].join(" "),
        status: "failed",
        exitCode: typeof failure.code === "number" ? failure.code : 1,
        output: `${failure.stdout || ""}${failure.stderr || ""}${failure.message ? `\n${failure.message}` : ""}`.trim(),
        startedAt,
        completedAt: new Date().toISOString()
      };
    }
  }
}

export const vaanForgeValidationRunner = new VaanForgeValidationRunner();
