import { AppShell } from "@/layouts/AppShell";
import { DeveloperPlatform } from "@/features/developers/components/DeveloperPlatform";

export default function DeveloperDocsPage() {
  return <AppShell><DeveloperPlatform mode="docs" /></AppShell>;
}
