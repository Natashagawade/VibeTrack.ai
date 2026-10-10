import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "glass";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-tight",
          {
            "glass-button-primary text-xs px-4 py-2": variant === "primary" && size === "sm",
            "glass-button-primary text-sm px-6 py-3": variant === "primary" && size === "md",
            "glass-button-primary text-base px-8 py-4": variant === "primary" && size === "lg",
            "glass-button-ghost text-xs px-4 py-2": variant === "ghost" && size === "sm",
            "glass-button-ghost text-sm px-6 py-3": variant === "ghost" && size === "md",
            "glass-button-ghost text-base px-8 py-4": variant === "ghost" && size === "lg",
            "glass-button-ghost text-xs px-4 py-2 bg-transparent border-white/10 hover:bg-white/5": variant === "outline" && size === "sm",
            "glass-button-ghost text-sm px-6 py-3 bg-transparent border-white/10 hover:bg-white/5": variant === "outline" && size === "md",
            "glass-button-ghost text-base px-8 py-4 bg-transparent border-white/10 hover:bg-white/5": variant === "outline" && size === "lg",
            "glass-button-ghost text-xs px-4 py-2 bg-white/5 border-white/10 hover:bg-white/10": variant === "glass" && size === "sm",
            "glass-button-ghost text-sm px-6 py-3 bg-white/5 border-white/10 hover:bg-white/10": variant === "glass" && size === "md",
            "glass-button-ghost text-base px-8 py-4 bg-white/5 border-white/10 hover:bg-white/10": variant === "glass" && size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";