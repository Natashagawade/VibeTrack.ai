import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "focus-ring inline-flex items-center justify-center gap-2 rounded-none font-extrabold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-tight",
          variant === "primary" &&
            "bg-white text-black border-2 border-white hover:bg-black hover:text-white shadow-none",
          variant === "ghost" &&
            "bg-black text-[var(--color-mist-100)] hover:bg-neutral-900 border border-neutral-800",
          variant === "outline" &&
            "border-2 border-white text-white bg-black hover:bg-white hover:text-black",
          size === "sm" && "px-4 py-2 text-xs",
          size === "md" && "px-6 py-3 text-sm",
          size === "lg" && "px-8 py-4 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
