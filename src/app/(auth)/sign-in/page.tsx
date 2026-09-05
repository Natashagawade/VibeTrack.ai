"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/landing/auth-shell";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push(searchParams.get("callbackUrl") ?? "/dashboard");
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your VibeTrack AI workspace."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-[var(--color-aurora-cyan)]">Sign up</Link>
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
        <Field label="Email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="mb-6 text-right text-xs">
          <Link href="/forgot-password" className="text-[var(--color-mist-400)] hover:text-[var(--color-aurora-cyan)]">
            Forgot password?
          </Link>
        </div>
        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-signal-negative)]">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
