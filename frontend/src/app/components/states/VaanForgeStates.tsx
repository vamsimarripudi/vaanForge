import { AlertTriangle, Ban, CheckCircle2, CloudOff, FileQuestion, Loader2, Lock, SearchX, ShieldAlert, Wrench } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

export type PageStateKind = "loading" | "empty" | "error" | "permission-denied" | "plan-limit" | "not-found" | "maintenance" | "offline" | "session-expired" | "success";

const stateIcon = {
  loading: Loader2,
  empty: FileQuestion,
  error: AlertTriangle,
  "permission-denied": ShieldAlert,
  "plan-limit": Lock,
  "not-found": SearchX,
  maintenance: Wrench,
  offline: CloudOff,
  "session-expired": Ban,
  success: CheckCircle2
};

export function PageState({
  kind,
  title,
  description,
  primaryAction,
  secondaryAction,
  onPrimaryAction,
  onSecondaryAction,
  className
}: {
  kind: PageStateKind;
  title: string;
  description: string;
  primaryAction: string;
  secondaryAction?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  className?: string;
}) {
  const Icon = stateIcon[kind];
  const spinning = kind === "loading";
  return (
    <section className={cn("grid min-h-56 place-items-center rounded-lg border border-border bg-card p-6 text-center", className)} aria-live={kind === "loading" ? "polite" : "assertive"}>
      <div className="mx-auto max-w-md">
        <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className={cn("size-5", spinning && "animate-spin")} />
        </span>
        <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={onPrimaryAction}>{primaryAction}</Button>
          {secondaryAction ? <Button type="button" variant="outline" onClick={onSecondaryAction}>{secondaryAction}</Button> : null}
        </div>
      </div>
    </section>
  );
}

export const LoadingState = (props: Omit<Parameters<typeof PageState>[0], "kind">) => <PageState kind="loading" {...props} />;
export const EmptyState = (props: Omit<Parameters<typeof PageState>[0], "kind">) => <PageState kind="empty" {...props} />;
export const ErrorState = (props: Omit<Parameters<typeof PageState>[0], "kind">) => <PageState kind="error" {...props} />;
export const PermissionDeniedState = (props: Omit<Parameters<typeof PageState>[0], "kind">) => <PageState kind="permission-denied" {...props} />;
export const PlanLimitState = (props: Omit<Parameters<typeof PageState>[0], "kind">) => <PageState kind="plan-limit" {...props} />;
export const SuccessState = (props: Omit<Parameters<typeof PageState>[0], "kind">) => <PageState kind="success" {...props} />;
