import { ComingSoonModule } from "@/components/dashboard/coming-soon";
import { Share2 } from "lucide-react";
export default function Page() {
  return (
    <ComingSoonModule
      title="Social media analysis"
      icon={Share2}
      description="Track mood, trending topics, and engagement across X, Reddit, YouTube comments, and LinkedIn posts."
      requires="platform API credentials"
    />
  );
}
