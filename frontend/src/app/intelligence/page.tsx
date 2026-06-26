import { AppShell } from "@/layouts/AppShell";
import { IntelligenceOsPanel } from "@/features/intelligence/components/IntelligenceOsPanel";
import { IntelligenceSnapshotPanel } from "@/features/growth/components/IntelligenceSnapshotPanel";
import { ModuleSummaryDashboard } from "@/features/growth/components/ModuleSummaryDashboard";

export default function IntelligencePage() {
  return (
    <AppShell>
      <ModuleSummaryDashboard
        title="Intelligence Assistant"
        description="Placeholder assistant for explaining reports, suggesting next tasks, detecting risks, drafting communication, and summarizing tickets or interviews."
        endpoint="/intelligence/summary"
        metricLabels={[
          { key: "placeholders", label: "Placeholders", detail: "Assistant surfaces" },
          { key: "state", label: "State", detail: "AI adapter status" },
          { key: "risks", label: "Risks", detail: "Risk signal placeholders" },
          { key: "nextTasks", label: "Next tasks", detail: "Task suggestions" },
          { key: "reportExplanation", label: "Reports", detail: "Report explanation" },
          { key: "disclaimer", label: "Disclaimer", detail: "Safety note" }
        ]}
        note="This route intentionally uses deterministic placeholders until a reviewed AI provider and prompt safety policy are connected."
      />
      <IntelligenceSnapshotPanel />
      <IntelligenceOsPanel />
    </AppShell>
  );
}
