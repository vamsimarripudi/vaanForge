type Metric = {
  label: string;
  value: string;
  detail: string;
};

export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-panel border border-line bg-muted p-4">
          <p className="text-sm text-ink-muted">{metric.label}</p>
          <p className="mt-2 text-3xl font-bold">{metric.value}</p>
          <p className="mt-1 text-xs font-medium text-ink-muted">{metric.detail}</p>
        </div>
      ))}
    </div>
  );
}
