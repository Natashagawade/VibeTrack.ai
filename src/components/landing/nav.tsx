"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Waves } from "lucide-react";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-semibold">
          <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
            <Waves className="h-4 w-4 text-black" />
          </div>
          <span>VibeTrack</span>
        </Link>
        <div className="hidden items-center gap-8 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] md:flex">
          <a href="#features" className="hover:text-[var(--color-text-primary)] transition-colors">Features</a>
          <a href="#modalities" className="hover:text-[var(--color-text-primary)] transition-colors">Modalities</a>
          <a href="#pricing" className="hover:text-[var(--color-text-primary)] transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-[var(--color-text-primary)] transition-colors">FAQ</a>
        </div>
        <Link href="/dashboard">
          <Button size="sm" variant="primary">Open dashboard</Button>
        </Link>
      </nav>
    </header>
  );
}
