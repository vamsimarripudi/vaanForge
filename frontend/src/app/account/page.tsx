import { AppShell } from "@/layouts/AppShell";
import { AuthAccessPanel } from "@/features/auth/components/AuthAccessPanel";
import { RegisterPanel } from "@/features/auth/components/RegisterPanel";
import { SessionPanel } from "@/features/auth/components/SessionPanel";
import { WorkspaceActivationPanel } from "@/features/workspaces/components/WorkspaceActivationPanel";

export default function AccountPage() {
  return (
    <AppShell>
      <section className="grid gap-5 py-8 lg:grid-cols-2">
        <RegisterPanel />
        <AuthAccessPanel />
        <SessionPanel />
        <WorkspaceActivationPanel />
      </section>
    </AppShell>
  );
}
