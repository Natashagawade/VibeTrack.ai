"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/landing/auth-shell";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't create your account.");
        return;
      }

      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (signInResult?.error) {
        router.push("/sign-in");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start understanding your customers in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[var(--color-aurora-cyan)]">Sign in</Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google")}>Google</Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => signIn("github")}>GitHub</Button>
      </div>
      <div className="my-6 flex items-center gap-3 text-xs text-[var(--color-mist-400)]">
        <div className="h-px flex-1 bg-white/10" />
        or continue with email
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <form onSubmit={handleSubmit}>
        <Field label="Full name" type="text" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} required />
        <Field label="Email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-signal-negative)]">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
