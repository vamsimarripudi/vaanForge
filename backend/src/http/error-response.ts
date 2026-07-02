import type { Request, Response } from "express";
import { ZodError } from "zod";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_REQUIRED"
  | "PERMISSION_DENIED"
  | "PLAN_LIMIT_REACHED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_FAILED"
  | "WEBHOOK_INVALID"
  | "PROVIDER_UNAVAILABLE"
  | "DEPLOYMENT_FAILED"
  | "FILE_UPLOAD_FAILED"
  | "INTERNAL_ERROR";

export type SafeErrorResponse = {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    fieldErrors?: Record<string, string>;
    recoverable: boolean;
    nextAction?: string;
  };
  requestId: string;
};

type SafeErrorInput = {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
  recoverable?: boolean;
  nextAction?: string;
};

const defaultNextAction: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "fix_fields",
  AUTH_REQUIRED: "sign_in",
  PERMISSION_DENIED: "request_access",
  PLAN_LIMIT_REACHED: "upgrade_plan",
  NOT_FOUND: "check_identifier",
  CONFLICT: "resolve_conflict",
  RATE_LIMITED: "retry_later",
  PAYMENT_FAILED: "retry_payment",
  WEBHOOK_INVALID: "verify_signature",
  PROVIDER_UNAVAILABLE: "retry_later",
  DEPLOYMENT_FAILED: "review_deployment_evidence",
  FILE_UPLOAD_FAILED: "check_file_and_retry",
  INTERNAL_ERROR: "contact_support"
};

export function buildErrorResponse(request: Request, input: SafeErrorInput): SafeErrorResponse {
  return {
    success: false,
    error: {
      code: input.code,
      message: sanitize(input.message),
      fieldErrors: input.fieldErrors,
      recoverable: input.recoverable ?? input.code !== "INTERNAL_ERROR",
      nextAction: input.nextAction ?? defaultNextAction[input.code]
    },
    requestId: request.requestId || request.header("x-request-id") || "req_unknown"
  };
}

export function sendError(response: Response, request: Request, status: number, input: SafeErrorInput) {
  return response.status(status).json(buildErrorResponse(request, input));
}

export function zodFieldErrors(error: ZodError): Record<string, string> {
  return Object.fromEntries(
    error.issues.map((issue) => {
      const key = issue.path.length ? issue.path.join(".") : "form";
      return [key, issue.message];
    })
  );
}

export function validationError(request: Request, error: ZodError, message = "Please correct the highlighted fields.") {
  return buildErrorResponse(request, {
    code: "VALIDATION_ERROR",
    message,
    fieldErrors: zodFieldErrors(error),
    recoverable: true,
    nextAction: "fix_fields"
  });
}

export function legacyToSafeError(request: Request, status: number, payload: Record<string, unknown>): SafeErrorResponse {
  const code = mapStatusToCode(status, payload.code);
  const message = typeof payload.message === "string" ? payload.message : typeof payload.error === "string" ? payload.error : "Request failed.";
  const issues = Array.isArray(payload.issues) ? payload.issues : undefined;
  return buildErrorResponse(request, {
    code,
    message: code === "VALIDATION_ERROR" ? "Please correct the highlighted fields." : message,
    fieldErrors: issues ? issuesToFieldErrors(issues) : undefined,
    recoverable: payload.recoverable !== false,
    nextAction: typeof payload.nextAction === "string" ? payload.nextAction : undefined
  });
}

function mapStatusToCode(status: number, code: unknown): ErrorCode {
  if (code === "RATE_LIMIT_EXCEEDED") return "RATE_LIMITED";
  if (isErrorCode(code)) return code;
  if (status === 400 || status === 422) return "VALIDATION_ERROR";
  if (status === 401) return "AUTH_REQUIRED";
  if (status === 403) return "PERMISSION_DENIED";
  if (status === 402) return "PLAN_LIMIT_REACHED";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  return "INTERNAL_ERROR";
}

function issuesToFieldErrors(issues: unknown[]) {
  const entries = issues.flatMap((issue) => {
    if (!issue || typeof issue !== "object") return [];
    const item = issue as { path?: unknown; message?: unknown };
    const path = Array.isArray(item.path) && item.path.length ? item.path.join(".") : "form";
    return [[path, typeof item.message === "string" ? item.message : "Invalid value."] as const];
  });
  return Object.fromEntries(entries);
}

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && [
    "VALIDATION_ERROR",
    "AUTH_REQUIRED",
    "PERMISSION_DENIED",
    "PLAN_LIMIT_REACHED",
    "NOT_FOUND",
    "CONFLICT",
    "RATE_LIMITED",
    "PAYMENT_FAILED",
    "WEBHOOK_INVALID",
    "PROVIDER_UNAVAILABLE",
    "DEPLOYMENT_FAILED",
    "FILE_UPLOAD_FAILED",
    "INTERNAL_ERROR"
  ].includes(value);
}

function sanitize(value: string) {
  return value.replace(/[A-Z]:\\[^\s]+/gi, "[path]").replace(/\/[^\s]+\/[^\s]+/g, "[path]").replace(/secret|token|provider api key|private key/gi, "[removed]");
}
