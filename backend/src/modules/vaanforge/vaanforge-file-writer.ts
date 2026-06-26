import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import type { GeneratedCodeFile } from "./vaanforge-code-generator";

export type FileWriteResult = {
  path: string;
  operation: "create" | "update" | "skip";
  status: "written" | "skipped" | "blocked";
  contentHash?: string;
  previousHash?: string;
  diffSummary?: string;
  humanReviewRequired: boolean;
  reason?: string;
};

export class VaanForgeFileWriter {
  constructor(private readonly workspaceRoot = resolve(__dirname, "../../../..")) {}

  write(file: GeneratedCodeFile, allowReviewedOverwrite = false): FileWriteResult {
    const absolutePath = resolve(this.workspaceRoot, file.path);
    const relativePath = relative(this.workspaceRoot, absolutePath);
    if (relativePath.startsWith("..") || absolutePath === this.workspaceRoot) {
      return {
        path: file.path,
        operation: "skip",
        status: "blocked",
        humanReviewRequired: true,
        reason: "Refusing to write outside the workspace."
      };
    }

    const contentHash = hash(file.content);
    const exists = existsSync(absolutePath);
    const previousContent = exists ? readFileSync(absolutePath, "utf8") : undefined;
    const previousHash = previousContent ? hash(previousContent) : undefined;
    if (exists) {
      if (previousHash === contentHash) {
        return {
          path: file.path,
          operation: "skip",
          status: "skipped",
          contentHash,
          previousHash,
          diffSummary: "Existing file already matches generated content.",
          humanReviewRequired: false
        };
      }

      if (!allowReviewedOverwrite) {
        return {
          path: file.path,
          operation: "update",
          status: "blocked",
          contentHash,
          previousHash,
          diffSummary: buildDiffSummary(previousContent || "", file.content),
          humanReviewRequired: true,
          reason: "Existing file differs. Human diff review is required before overwrite."
        };
      }
    }

    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, file.content, "utf8");
    return {
      path: file.path,
      operation: exists ? "update" : "create",
      status: "written",
      contentHash,
      previousHash,
      diffSummary: exists ? "Reviewed overwrite applied." : "New file created.",
      humanReviewRequired: false
    };
  }
}

function hash(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function buildDiffSummary(previous: string, next: string) {
  const previousLines = previous.split(/\r?\n/);
  const nextLines = next.split(/\r?\n/);
  return `Diff review required: ${previousLines.length} existing lines, ${nextLines.length} generated lines, ${Math.abs(previous.length - next.length)} byte delta.`;
}

export const vaanForgeFileWriter = new VaanForgeFileWriter();
