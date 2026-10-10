import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";
import { Waves } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center">
            <Waves className="h-4 w-4 text-[var(--color-bg-base)]" />
          </div>
          <span className="text-gradient-accent">VibeTrack</span>
        </Link>
        <GlassCard variant="interactive" className="p-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </GlassCard>
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">{footer}</p>
      </div>
    </div>
  );
}