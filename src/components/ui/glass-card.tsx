import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-panel rounded-none shadow-none",
        className
      )}
      {...props}
    />
  );
}
