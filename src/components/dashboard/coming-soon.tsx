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
        <GlassCard variant="interactive" className="flex flex-col items-center gap-4 p-12 text-center max-w-2xl mx-auto animate-fade-in-up">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent-cyan)]/20 to-[var(--color-accent-violet)]/20 border border-[var(--color-accent-cyan)]/30 flex items-center justify-center">
            <Icon className="h-7 w-7 text-[var(--color-accent-cyan)]" />
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">{title}</h2>
          <p className="max-w-md text-sm text-[var(--color-text-secondary)]">{description}</p>
          <Badge tone="cyan" className="mt-2">Wires up in Phase 8 · needs {requires}</Badge>
        </GlassCard>
      </div>
    </>
  );
}