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
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold">
          <Waves className="h-5 w-5 text-[var(--color-aurora-cyan)]" />
          VibeTrack <span className="text-gradient-aurora">AI</span>
        </Link>
        <GlassCard className="p-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-[var(--color-mist-400)]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </GlassCard>
        <p className="mt-6 text-center text-sm text-[var(--color-mist-400)]">{footer}</p>
      </div>
    </div>
  );
}
