import Link from "next/link";
import { ThemeModeToggle } from "@/components/ThemeModeToggle";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/pricing", label: "Pricing" },
  { href: "/billing", label: "Billing" },
  { href: "/account", label: "Account" },
  { href: "/builder", label: "Builder" },
  { href: "/admin", label: "Admin" },
  { href: "/admin/agent", label: "Agent" },
  { href: "/admin/operations", label: "Ops Center" },
  { href: "/founder/dashboard", label: "Founder" },
  { href: "/finance", label: "Finance" },
  { href: "/planning", label: "Planning" },
  { href: "/operations", label: "Work" },
  { href: "/crm", label: "CRM" },
  { href: "/client", label: "Client" },
  { href: "/customer", label: "Customer" },
  { href: "/support", label: "Support" },
  { href: "/hr", label: "HR" },
  { href: "/hiring", label: "Hiring" },
  { href: "/interviews", label: "Interviews" },
  { href: "/legal", label: "Legal" },
  { href: "/compliance", label: "Compliance" },
  { href: "/registrations", label: "Gov" },
  { href: "/creator", label: "Creator" },
  { href: "/marketing", label: "Marketing" },
  { href: "/partners", label: "Partners" },
  { href: "/communication", label: "Comms" },
  { href: "/automation", label: "Automation" },
  { href: "/intelligence", label: "Intel" },
  { href: "/settings", label: "Settings" },
  { href: "/education/dashboard", label: "Education" },
  { href: "/education/students", label: "Students" },
  { href: "/vmetron/dashboard", label: "VMetron" }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="text-base font-bold">VM Nexus OS</Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            {navItems.map((item) => (
              <Link key={item.href} className="rounded-md px-3 py-2 hover:bg-muted hover:text-ink" href={item.href}>
                {item.label}
              </Link>
            ))}
            <ThemeModeToggle />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </main>
  );
}
