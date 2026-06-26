import { AppShell } from "@/layouts/AppShell";
import { EnterpriseLaunchDashboard } from "@/features/builder/components/EnterpriseLaunchDashboard";

export default function AgentReliabilityPage() {
  return <AppShell><EnterpriseLaunchDashboard mode="adminReliability" /></AppShell>;
}
