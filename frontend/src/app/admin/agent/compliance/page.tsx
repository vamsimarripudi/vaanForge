import { AppShell } from "@/layouts/AppShell";
import { EnterpriseLaunchDashboard } from "@/features/builder/components/EnterpriseLaunchDashboard";

export default function AgentCompliancePage() {
  return <AppShell><EnterpriseLaunchDashboard mode="adminCompliance" /></AppShell>;
}
