import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "positive" | "negative" | "aurora" | "cyan" | "violet" | "amber" }) {
  return (
    <span
      className={cn(
        "glass-badge inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all duration-200",
        {
          "border-white/10 text-[var(--color-text-secondary)]": tone === "neutral",
          "bg-[var(--color-signal-positive)]/20 border-[var(--color-signal-positive)]/30 text-[var(--color-signal-positive)]": tone === "positive",
          "bg-[var(--color-signal-negative)]/20 border-[var(--color-signal-negative)]/30 text-[var(--color-signal-negative)]": tone === "negative",
          "bg-gradient-to-r from-[var(--color-accent-cyan)]/20 to-[var(--color-accent-violet)]/20 border-[var(--color-accent-cyan)]/30 text-[var(--color-accent-cyan)]": tone === "aurora",
          "bg-[var(--color-accent-cyan)]/20 border-[var(--color-accent-cyan)]/30 text-[var(--color-accent-cyan)]": tone === "cyan",
          "bg-[var(--color-accent-violet)]/20 border-[var(--color-accent-violet)]/30 text-[var(--color-accent-violet)]": tone === "violet",
          "bg-[var(--color-accent-amber)]/20 border-[var(--color-accent-amber)]/30 text-[var(--color-accent-amber)]": tone === "amber",
        },
        className
      )}
      {...props}
    />
  );
}