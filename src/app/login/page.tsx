"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/account");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <Link
        href="/account"
        className="absolute top-5 left-4 flex items-center gap-1.5 text-sm text-[var(--subtext)] hover:text-[var(--text)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🕌</span>
          <h1 className="font-lora text-2xl font-bold text-[var(--text)] mt-3">Welcome back</h1>
          <p className="text-sm text-[var(--subtext)] mt-1">Sign in to your Bayut account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--subtext)] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#C9A84C] hover:underline font-medium">
            Create one
          </Link>
        </p>

        <p className="text-center text-xs text-[var(--subtext)] mt-8 border-t border-[var(--border)] pt-6">
          Centre Manager?{" "}
          <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-[#C9A84C] hover:underline">
            Contact us
          </a>{" "}
          to get your centre set up.
        </p>
      </div>
    </div>
  );
}
