"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dropzone({
  accept,
  onFile,
  label,
  hint,
}: {
  accept: string;
  onFile: (file: File) => void;
  label: string;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setFileName(file.name);
    onFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "focus-ring flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
        dragging
          ? "border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/5 bg-gradient-to-br from-[var(--color-accent-cyan)]/10 to-transparent"
          : "border-white/10 hover:border-white/20 hover:bg-white/5"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <UploadCloud className="h-8 w-8 text-[var(--color-accent-cyan)]" />
      <div className="text-sm font-medium text-[var(--color-text-primary)]">
        {fileName ?? label}
      </div>
      <div className="text-xs text-[var(--color-text-muted)]">{hint}</div>
    </div>
  );
}