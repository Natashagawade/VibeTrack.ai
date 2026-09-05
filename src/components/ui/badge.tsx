import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "positive" | "negative" | "aurora" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none px-3 py-1.5 text-[10px] font-black border uppercase tracking-wider",
        tone === "neutral" && "bg-black border-neutral-700 text-neutral-400",
        tone === "positive" && "bg-white border-white text-black",
        tone === "negative" && "bg-black border-neutral-600 text-neutral-300",
        tone === "aurora" && "bg-black border-white text-white",
        className
      )}
      {...props}
    />
  );
}
