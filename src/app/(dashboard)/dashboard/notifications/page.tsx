import { ComingSoonModule } from "@/components/dashboard/coming-soon";
import { Bell } from "lucide-react";
export default function Page() {
  return (
    <ComingSoonModule
      title="Notifications"
      icon={Bell}
      description="Get alerted the moment negative sentiment spikes, toxicity rises, or brand reputation drops."
      requires="a background job queue (BullMQ + Redis)"
    />
  );
}
