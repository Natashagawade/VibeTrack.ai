import { Waves } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[var(--color-bg-elevated)]/60 backdrop-blur-xl px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-bold">
          <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center">
            <Waves className="h-3 w-3 text-[var(--color-bg-base)]" />
          </div>
          <span className="text-gradient-accent">VibeTrack</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          © {new Date().getFullYear()} VibeTrack AI. Understand emotions. Discover insights.
        </p>
        <div className="flex gap-5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          <a href="#" className="hover:text-[var(--color-accent-cyan)] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[var(--color-accent-cyan)] transition-colors">Terms</a>
          <a href="#" className="hover:text-[var(--color-accent-cyan)] transition-colors">Status</a>
        </div>
      </div>
    </footer>
  );
}