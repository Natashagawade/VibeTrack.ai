"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Waves } from "lucide-react";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-white bg-black">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-xl font-black uppercase tracking-tighter">
          <Waves className="h-6 w-6 text-white" />
          VibeTrack <span className="text-gradient-aurora">AI</span>
        </Link>
        <div className="hidden items-center gap-8 text-xs font-black uppercase tracking-wider text-neutral-400 md:flex">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#modalities" className="hover:text-white transition-colors">Modalities</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/sign-in" className="hidden text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-white transition-colors sm:block">
            Sign in
          </Link>
          <Link href="/dashboard">
            <Button size="sm">Open dashboard</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
