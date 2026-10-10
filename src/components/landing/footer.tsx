import { Waves } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2 font-[family-name:var(--font-display)] text-sm font-semibold">
          <div className="h-5 w-5 rounded-md bg-white flex items-center justify-center">
            <Waves className="h-3 w-3 text-black" />
          </div>
          VibeTrack
        </div>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          © {new Date().getFullYear()} VibeTrack AI. Understand emotions. Discover insights.
        </p>
        <div className="flex gap-5 text-[11px] text-[var(--color-text-muted)]">
          <a href="#" className="hover:text-[var(--color-text-primary)] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[var(--color-text-primary)] transition-colors">Terms</a>
          <a href="#" className="hover:text-[var(--color-text-primary)] transition-colors">Status</a>
        </div>
      </div>
    </footer>
  );
}
