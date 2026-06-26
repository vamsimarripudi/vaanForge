import { AppShell } from "@/layouts/AppShell";
import { EnterpriseLaunchDashboard } from "@/features/builder/components/EnterpriseLaunchDashboard";

export default function AgentLaunchReadinessPage() {
  return <AppShell><EnterpriseLaunchDashboard mode="launch" /></AppShell>;
}
