import { ComingSoonModule } from "@/components/dashboard/coming-soon";
import { Radar } from "lucide-react";
export default function Page() {
  return (
    <ComingSoonModule
      title="Brand monitoring"
      icon={Radar}
      description="Point VibeTrack at any company and get reputation score, complaint themes, and emotion trend over time."
      requires="a scheduled crawler + the Social and URL modules"
    />
  );
}
