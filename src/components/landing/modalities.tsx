const MODALITIES = [
  "Text", "Images", "Audio", "Video", "PDF", "DOCX", "CSV", "Excel",
  "URLs", "Social posts", "Reviews", "News articles",
];

export function Modalities() {
  return (
    <section id="modalities" className="border-y border-white/5 bg-white/[0.02] py-14">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-6 text-center text-xs uppercase tracking-widest text-[var(--color-mist-400)]">
          Feed it anything
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {MODALITIES.map((m) => (
            <span
              key={m}
              className="rounded-none border-2 border-white bg-black px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
