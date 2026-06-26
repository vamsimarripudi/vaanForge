import { AppShell } from "@/layouts/AppShell";
import { DeveloperPlatform } from "@/features/developers/components/DeveloperPlatform";

export default function DeveloperWebhooksPage() {
  return <AppShell><DeveloperPlatform mode="webhooks" /></AppShell>;
}
