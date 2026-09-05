import { Info } from "lucide-react";

export function DemoModeBanner() {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--color-aurora-violet)]/20 bg-[var(--color-aurora-violet)]/10 px-6 py-2 text-xs text-[var(--color-mist-300)]">
      <Info className="h-3.5 w-3.5 shrink-0 text-[var(--color-aurora-cyan)]" />
      Demo mode — no <code className="rounded bg-black/20 px-1 py-0.5">DATABASE_URL</code> configured, so sign-in is
      skipped and nothing you do here is saved. Set it in <code className="rounded bg-black/20 px-1 py-0.5">.env.local</code> to enable accounts and persistence.
    </div>
  );
}
