import { Bell, Search } from "lucide-react";

export function Topbar({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between border-b border-white/5 bg-[var(--color-void-950)]/40 px-6 py-4 backdrop-blur-xl">
      <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[var(--color-mist-400)] sm:flex">
          <Search className="h-4 w-4" />
          <span>Search signals…</span>
        </div>
        <button className="focus-ring relative rounded-xl border border-white/10 bg-white/5 p-2">
          <Bell className="h-4 w-4 text-[var(--color-mist-300)]" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--color-aurora-pink)]" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-aurora-violet)] to-[var(--color-aurora-cyan)]" />
      </div>
    </header>
  );
}
