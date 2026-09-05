import { Badge } from "@/components/ui/badge";
import { Sparkles, Cpu } from "lucide-react";

export function EngineBadge({ engine }: { engine: string | null }) {
  if (!engine) return null;
  const isAi = engine.startsWith("openai");
  return (
    <Badge tone={isAi ? "aurora" : "neutral"} className="gap-1">
      {isAi ? <Sparkles className="h-3 w-3" /> : <Cpu className="h-3 w-3" />}
      {isAi ? "GPT-4o-mini" : "Local engine"}
    </Badge>
  );
}
