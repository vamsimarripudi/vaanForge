import { AppShell } from "@/layouts/AppShell";
import { EnterpriseLaunchDashboard } from "@/features/builder/components/EnterpriseLaunchDashboard";

export default function AgentEnterprisePage() {
  return <AppShell><EnterpriseLaunchDashboard mode="adminEnterprise" /></AppShell>;
}
