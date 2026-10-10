const MODALITIES = [
  { label: "Text", icon: "📝" },
  { label: "Images", icon: "🖼️" },
  { label: "Audio", icon: "🎙️" },
  { label: "PDF", icon: "📄" },
  { label: "DOCX", icon: "📃" },
  { label: "CSV/Excel", icon: "📊" },
  { label: "URLs", icon: "🔗" },
  { label: "Social", icon: "📱" },
  { label: "Reviews", icon: "⭐" },
  { label: "News", icon: "📰" },
];

export function Modalities() {
  return (
    <section id="modalities" className="border-y border-white/5 bg-[var(--color-bg-elevated)]/30 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-6 text-center text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
          Feed it anything
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {MODALITIES.map((m) => (
            <span
              key={m.label}
              className="glass-badge flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              <span>{m.icon}</span>
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}