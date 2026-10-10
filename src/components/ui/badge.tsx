import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export type BadgeTone = "neutral" | "positive" | "negative";

/**
 * Monochrome badge. Positive reads as solid white (present, resolved), negative
 * as outline-only, neutral as muted text — the distinction is value and fill
 * rather than hue.
 */
export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "glass-badge inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors duration-200",
        {
          "border-white/10 text-[var(--color-text-muted)]": tone === "neutral",
          "border-white/60 bg-white text-black": tone === "positive",
          "border-white/40 text-[var(--color-text-secondary)]": tone === "negative",
        },
        className
      )}
      {...props}
    />
  );
}
