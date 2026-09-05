import { InputHTMLAttributes, LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mb-4 block text-sm">
      <span className="mb-1.5 block text-[var(--color-mist-300)]">{label}</span>
      <input
        {...props}
        className={cn(
          "focus-ring w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-[var(--color-mist-100)] placeholder:text-[var(--color-mist-400)]/50"
        )}
      />
    </label>
  );
}

export function SectionLabel(props: LabelHTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}
