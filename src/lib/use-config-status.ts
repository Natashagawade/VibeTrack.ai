"use client";

import { useEffect, useState } from "react";

export interface ConfigStatus {
  openai: boolean;
  gemini: boolean;
  huggingface: boolean;
  cloudinary: boolean;
  database: boolean;
  redis: boolean;
  googleOAuth: boolean;
  githubOAuth: boolean;
  smtp: boolean;
  newsApi: boolean;
  youtubeApi: boolean;
  reddit: boolean;
  twitter: boolean;
}

export function useConfigStatus() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, loading };
}
