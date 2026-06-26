import { PublicInfoPage } from "@/features/public/components/PublicInfoPage";

export default function RefundPage() {
  return (
    <PublicInfoPage
      title="Refund Policy"
      description="Refund-policy placeholder for subscription, invoice, trial, renewal, and payment-status workflows."
      sections={[
        { title: "Billing state", detail: "Plans, trials, subscriptions, renewal dates, price-pending states, and payment credentials are tracked separately." },
        { title: "Review process", detail: "Refund decisions should be handled through support and billing records once production payments are connected." },
        { title: "Launch note", detail: "Razorpay credentials and final commercial pricing must be configured before this becomes production policy." }
      ]}
    />
  );
}
