import { ComingSoonModule } from "@/components/dashboard/coming-soon";
import { KeyRound } from "lucide-react";
export default function Page() {
  return (
    <ComingSoonModule
      title="API keys"
      icon={KeyRound}
      description="Generate scoped API keys with rate limits to call VibeTrack's REST API from your own product."
      requires="the backend auth + rate-limiting middleware (Phase 4/5)"
    />
  );
}
