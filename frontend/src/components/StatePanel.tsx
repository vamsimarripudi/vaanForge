type StatePanelProps = {
  state: "loading" | "empty" | "error" | "success";
  title: string;
  detail: string;
};

export function StatePanel({ state, title, detail }: StatePanelProps) {
  const label = {
    loading: "Loading",
    empty: "Empty",
    error: "Error",
    success: "Success"
  }[state];

  return (
    <div className="rounded-panel border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-ink-muted">{detail}</p>
    </div>
  );
}
