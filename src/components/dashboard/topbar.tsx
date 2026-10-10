"use client";

import { Bell, Search, Command } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export function Topbar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[var(--color-bg-elevated)]/60 backdrop-blur-xl px-6 py-4">
      <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold text-gradient-accent">{title}</h1>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 glass-input px-3 py-2 text-sm sm:flex">
            <Command className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
            <span className="text-[var(--color-text-muted)]">Search signals…</span>
            <kbd className="hidden px-1.5 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded lg:inline-flex">⌘K</kbd>
          </div>
          <button className="focus-ring relative glass-button-ghost p-2 hover:bg-white/10 transition-all duration-200" aria-label="Notifications">
            <Bell className="h-5 w-5 text-[var(--color-text-secondary)]" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--color-accent-pink)] border-2 border-[var(--color-bg-base)]" />
          </button>
          <div className="h-8 w-8 rounded-full border border-white/20 bg-white/10" />
        </div>
      </div>
    </header>
  );
}