import { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">{label}</span>
      <input
        {...props}
        className={cn(
          "glass-input focus-ring w-full rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-all duration-200",
          "hover:border-white/15"
        )}
      />
    </label>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className="block">
        {label && (
          <span className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">{label}</span>
        )}
        <textarea
          ref={ref}
          {...props}
          className={cn(
            "glass-input focus-ring w-full rounded-2xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-all duration-200 resize-none",
            "hover:border-white/15",
            className
          )}
        />
      </label>
    );
  }
);

Textarea.displayName = "Textarea";

export function SectionLabel({ children, className, ...props }: LabelHTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide", className)}>
      {children}
    </div>
  );
}