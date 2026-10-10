import { Info } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export function DemoModeBanner() {
  return (
    <GlassCard variant="subtle" className="m-4 border border-[var(--color-accent-violet)]/30 bg-[var(--color-accent-violet)]/5">
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--color-text-secondary)]">
        <Info className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent-cyan)]" />
        Demo mode — no <code className="rounded glass-input px-1.5 py-0.5 text-[var(--color-text-primary)] font-mono">DATABASE_URL</code> configured, so sign-in is
        skipped and nothing you do here is saved. Set it in <code className="rounded glass-input px-1.5 py-0.5 text-[var(--color-text-primary)] font-mono">.env.local</code> to enable accounts and persistence.
      </div>
    </GlassCard>
  );
}