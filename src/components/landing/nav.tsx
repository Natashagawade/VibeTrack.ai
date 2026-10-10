"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Waves } from "lucide-react";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--color-bg-elevated)]/60 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-xl font-bold">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center">
            <Waves className="h-4 w-4 text-[var(--color-bg-base)]" />
          </div>
          <span className="text-gradient-accent">VibeTrack</span>
        </Link>
        <div className="hidden items-center gap-8 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] md:flex">
          <a href="#features" className="hover:text-[var(--color-text-primary)] transition-colors">Features</a>
          <a href="#modalities" className="hover:text-[var(--color-text-primary)] transition-colors">Modalities</a>
          <a href="#pricing" className="hover:text-[var(--color-text-primary)] transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-[var(--color-text-primary)] transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/sign-in" className="hidden text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors sm:block">
            Sign in
          </Link>
          <Link href="/dashboard">
            <Button size="sm" variant="primary">Open dashboard</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}