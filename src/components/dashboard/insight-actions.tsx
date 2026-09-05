"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { InsightStatus } from "@prisma/client";

export function InsightActions({ id, status }: { id: string; status: InsightStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: InsightStatus) {
    setBusy(true);
    try {
      const res = await fetch(`/api/insights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (status === "ACKNOWLEDGED") {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setStatus("RESOLVED")} disabled={busy}>
          Resolve
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setStatus("DISMISSED")} disabled={busy}>
          Dismiss
        </Button>
      </div>
    );
  }

  if (status === "RESOLVED" || status === "DISMISSED") {
    return <span className="text-xs text-[var(--color-mist-400)]">{status.toLowerCase()}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => setStatus("ACKNOWLEDGED")} disabled={busy}>
        Acknowledge
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setStatus("DISMISSED")} disabled={busy}>
        Dismiss
      </Button>
    </div>
  );
}