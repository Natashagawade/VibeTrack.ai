import { ComingSoonModule } from "@/components/dashboard/coming-soon";
import { Video } from "lucide-react";
export default function Page() {
  return (
    <ComingSoonModule
      title="Video analysis"
      icon={Video}
      description="Frame extraction with a synced face-and-speech emotion timeline across the full video."
      requires="Whisper API + DeepFace + frame sampling pipeline"
    />
  );
}
