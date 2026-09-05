import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

export function ComingSoonModule({
  title,
  icon: Icon,
  description,
  requires,
}: {
  title: string;
  icon: LucideIcon;
  description: string;
  requires: string;
}) {
  return (
    <>
      <Topbar title={title} />
      <div className="p-6">
        <GlassCard className="flex flex-col items-center gap-4 p-16 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Icon className="h-8 w-8 text-[var(--color-aurora-cyan)]" />
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">{title}</h2>
          <p className="max-w-md text-sm text-[var(--color-mist-400)]">{description}</p>
          <Badge tone="aurora">Wires up in Phase 8 · needs {requires}</Badge>
        </GlassCard>
      </div>
    </>
  );
}
