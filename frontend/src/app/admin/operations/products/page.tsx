import { AppShell } from "@/layouts/AppShell";
import { OperationsCommandCenter } from "@/features/operations/components/OperationsCommandCenter";

export default function AdminOperationsProductsPage() {
  return <AppShell><OperationsCommandCenter mode="products" /></AppShell>;
}
