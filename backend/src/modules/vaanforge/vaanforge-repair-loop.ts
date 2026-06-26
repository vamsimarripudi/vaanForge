import type { StoredAgentError } from "../../database/in-memory-store";
import type { ValidationResult } from "./vaanforge-validation-runner";

export type ParsedValidationError = {
  source: string;
  filePath?: string;
  line?: number;
  reason: string;
};

export class VaanForgeRepairLoop {
  parseErrors(result: ValidationResult): ParsedValidationError[] {
    const lines = result.output.split(/\r?\n/).filter(Boolean);
    const parsed: ParsedValidationError[] = [];
    for (const line of lines) {
        const match = line.match(/(?<file>[\w./\\-]+\.(?:ts|tsx|js|jsx|json|css|md))(?::(?<line>\d+))?/);
        if (!match?.groups?.file) {
          continue;
        }
        parsed.push({
          source: result.checkName,
          filePath: match.groups.file.replace(/\\/g, "/"),
          line: match.groups.line ? Number(match.groups.line) : undefined,
          reason: line.slice(0, 500)
        });
      }

    return parsed.length
      ? parsed
      : [
          {
            source: result.checkName,
            reason: result.output.slice(0, 500) || `${result.checkName} failed without diagnostic output.`
          }
        ];
  }

  planRepair(error: StoredAgentError) {
    return {
      strategy: `Review ${error.source} failure${error.filePath ? ` in ${error.filePath}` : ""} and apply a targeted code fix.`,
      notes: error.line ? `Diagnostic line ${error.line}: ${error.reason}` : error.reason
    };
  }
}

export const vaanForgeRepairLoop = new VaanForgeRepairLoop();
