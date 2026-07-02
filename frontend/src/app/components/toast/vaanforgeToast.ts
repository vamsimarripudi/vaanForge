import { toast } from "sonner";
import type { ApiError } from "../../../services/apiClient";

export type VaanForgeToastVariant = "success" | "error" | "warning" | "info" | "loading" | "progress" | "undo" | "plan-limit" | "payment" | "deployment" | "AI-run";

const label: Record<VaanForgeToastVariant, string> = {
  success: "Done",
  error: "Action failed",
  warning: "Needs attention",
  info: "Information",
  loading: "Working",
  progress: "In progress",
  undo: "Action completed",
  "plan-limit": "Plan limit reached",
  payment: "Payment status",
  deployment: "Deployment status",
  "AI-run": "AI run status"
};

export function showToast(variant: VaanForgeToastVariant, message: string, options: { description?: string; action?: { label: string; onClick: () => void }; duration?: number } = {}) {
  const title = `${label[variant]}${message ? `: ${message}` : ""}`;
  if (variant === "error" || variant === "plan-limit" || variant === "payment") return toast.error(title, { description: options.description, action: options.action, duration: options.duration ?? 8000 });
  if (variant === "loading" || variant === "progress" || variant === "AI-run" || variant === "deployment") return toast.loading(title, { description: options.description, duration: options.duration });
  if (variant === "success") return toast.success(title, { description: options.description, action: options.action, duration: options.duration });
  if (variant === "warning") return toast.warning(title, { description: options.description, action: options.action, duration: options.duration ?? 6000 });
  return toast.info(title, { description: options.description, action: options.action, duration: options.duration });
}

export function showApiError(error: ApiError, retry?: () => void) {
  const variant: VaanForgeToastVariant = error.code === "PLAN_LIMIT_REACHED" ? "plan-limit" : error.code === "PAYMENT_FAILED" ? "payment" : "error";
  return showToast(variant, error.message, {
    description: [error.requestId ? `Request ${error.requestId}` : "", error.nextAction ? `Next: ${error.nextAction}` : ""].filter(Boolean).join(" · "),
    action: retry && error.recoverable ? { label: "Retry", onClick: retry } : undefined
  });
}
