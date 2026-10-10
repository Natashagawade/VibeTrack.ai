import { Info } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export function DemoModeBanner() {
  return (
    <GlassCard variant="subtle" className="m-4 border border-white/20">
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--color-text-secondary)]">
        <Info className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-primary)]" />
        No <code className="rounded bg-white/10 px-1.5 py-0.5 text-[var(--color-text-primary)] font-mono">DATABASE_URL</code> configured, so
        runs are not saved. Set it in <code className="rounded bg-white/10 px-1.5 py-0.5 text-[var(--color-text-primary)] font-mono">.env.local</code> to
        persist signals and intelligence.
      </div>
    </GlassCard>
  );
}
