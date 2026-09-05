import { ComingSoonModule } from "@/components/dashboard/coming-soon";
import { CreditCard } from "lucide-react";
export default function Page() {
  return (
    <ComingSoonModule
      title="Billing"
      icon={CreditCard}
      description="Manage your plan, usage-based invoices, and payment method."
      requires="a billing provider integration (e.g. Stripe)"
    />
  );
}
