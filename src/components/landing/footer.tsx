import { Waves } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t-2 border-white bg-black px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-black uppercase tracking-tighter">
          <Waves className="h-5 w-5 text-white" />
          VibeTrack AI
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          © {new Date().getFullYear()} VibeTrack AI. Understand emotions. Discover insights.
        </p>
        <div className="flex gap-5 text-[10px] font-black uppercase tracking-wider text-neutral-400">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Status</a>
        </div>
      </div>
    </footer>
  );
}
