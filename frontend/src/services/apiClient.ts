export type ApiClientOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  retry?: boolean;
  idempotencyKey?: string;
  onUploadProgress?: (progress: { loaded: number; total?: number; percent?: number }) => void;
};

export type ApiError = Error & {
  status: number;
  code: string;
  fieldErrors: Record<string, string>;
  recoverable: boolean;
  nextAction?: string;
  requestId?: string;
  retryAfter?: number;
};

const processEnv = typeof process !== "undefined" ? process.env.VITE_API_BASE_URL : undefined;
const viteEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (viteEnv || processEnv || "/api/v1").replace(/\/$/, "");

export async function apiClient<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  return requestWithRetry<T>(path, options, 0);
}

export function normalizeApiError(status: number, payload: Record<string, any> | undefined, response?: Response): ApiError {
  const envelope = payload?.success === false ? payload.error : payload;
  const message = envelope?.message || payload?.message || payload?.error || friendlyMessage(status);
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = envelope?.code || payload?.code || codeForStatus(status);
  error.fieldErrors = envelope?.fieldErrors || payload?.fieldErrors || fieldErrorsFromIssues(payload?.issues);
  error.recoverable = envelope?.recoverable ?? payload?.recoverable ?? status < 500;
  error.nextAction = envelope?.nextAction || payload?.nextAction || nextActionForStatus(status);
  error.requestId = payload?.requestId || response?.headers.get("x-request-id") || undefined;
  error.retryAfter = Number(response?.headers.get("retry-after") || "") || undefined;
  return error;
}

export function isApiError(error: unknown): error is ApiError {
  return Boolean(error && typeof error === "object" && "status" in error && "code" in error);
}

async function requestWithRetry<T>(path: string, options: ApiClientOptions, attempt: number): Promise<T> {
  const method = options.method || "GET";
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 30000;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const externalAbort = () => controller.abort();
  options.signal?.addEventListener("abort", externalAbort, { once: true });

  try {
    const response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
      method,
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(options.idempotencyKey ? { "idempotency-key": options.idempotencyKey } : {}),
        ...options.headers
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal
    });

    const payload = await parseJson(response);
    if (!response.ok) {
      const error = normalizeApiError(response.status, payload, response);
      if (shouldRetry(method, options, attempt, error)) {
        await delay(error.retryAfter ? error.retryAfter * 1000 : 400 * (attempt + 1));
        return requestWithRetry<T>(path, options, attempt + 1);
      }
      throw error;
    }

    return (payload?.data ?? payload) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw normalizeApiError(408, { error: { code: "PROVIDER_UNAVAILABLE", message: "The request timed out.", recoverable: true, nextAction: "retry" } });
    }
    if (error instanceof TypeError && typeof navigator !== "undefined" && !navigator.onLine) {
      throw normalizeApiError(0, { error: { code: "PROVIDER_UNAVAILABLE", message: "You appear to be offline.", recoverable: true, nextAction: "check_connection" } });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", externalAbort);
  }
}

async function parseJson(response: Response): Promise<Record<string, any> | undefined> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return { data: text };
  }
}

function shouldRetry(method: string, options: ApiClientOptions, attempt: number, error: ApiError) {
  if (attempt >= 1) return false;
  if (options.retry === false) return false;
  const safeMethod = method === "GET";
  const idempotentMutation = Boolean(options.idempotencyKey);
  return (safeMethod || idempotentMutation) && ["RATE_LIMITED", "PROVIDER_UNAVAILABLE", "INTERNAL_ERROR"].includes(error.code);
}

function friendlyMessage(status: number) {
  if (status === 401) return "Sign in to continue.";
  if (status === 403) return "You do not have permission for this action.";
  if (status === 404) return "The requested record was not found.";
  if (status === 409) return "This action conflicts with the current state.";
  if (status === 422 || status === 400) return "Please correct the highlighted fields.";
  if (status === 429) return "Too many requests. Please retry shortly.";
  if (status === 0) return "You appear to be offline.";
  return "The request could not be completed.";
}

function codeForStatus(status: number) {
  if (status === 401) return "AUTH_REQUIRED";
  if (status === 403) return "PERMISSION_DENIED";
  if (status === 402) return "PLAN_LIMIT_REACHED";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422 || status === 400) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  return status >= 500 ? "INTERNAL_ERROR" : `HTTP_${status}`;
}

function nextActionForStatus(status: number) {
  if (status === 401) return "sign_in";
  if (status === 403) return "request_access";
  if (status === 402) return "upgrade_plan";
  if (status === 404) return "check_identifier";
  if (status === 409) return "resolve_conflict";
  if (status === 422 || status === 400) return "fix_fields";
  if (status === 429) return "retry_later";
  return "contact_support";
}

function fieldErrorsFromIssues(issues: unknown) {
  if (!Array.isArray(issues)) return {};
  return Object.fromEntries(issues.flatMap((issue) => {
    if (!issue || typeof issue !== "object") return [];
    const item = issue as { path?: unknown; message?: unknown };
    const path = Array.isArray(item.path) && item.path.length ? item.path.join(".") : "form";
    return [[path, typeof item.message === "string" ? item.message : "Invalid value."] as const];
  }));
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
