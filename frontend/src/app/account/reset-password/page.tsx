import { AppShell } from "@/layouts/AppShell";
import { PasswordResetPanel } from "@/features/auth/components/PasswordResetPanel";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return (
    <AppShell>
      <section className="max-w-2xl py-8">
        <PasswordResetPanel token={params.token} />
      </section>
    </AppShell>
  );
}
