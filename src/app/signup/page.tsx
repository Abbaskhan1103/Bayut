"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // If email confirmation is disabled in Supabase, user is logged in immediately
      // If enabled, show a confirmation message
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.confirmed_at || user?.email_confirmed_at) {
        router.push("/account");
        router.refresh();
      } else {
        setDone(true);
      }
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-6">
          <span className="text-5xl">📬</span>
          <div>
            <h1 className="font-lora text-2xl font-bold text-[var(--text)]">Check your email</h1>
            <p className="text-sm text-[var(--subtext)] mt-2">
              We sent a confirmation link to <span className="text-[var(--text)] font-medium">{email}</span>.
              Click it to activate your account.
            </p>
          </div>
          <Link href="/login">
            <Button variant="secondary">Back to Sign In</Button>
          </Link>
        </div>
      </div>
    );
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
          <h1 className="font-lora text-2xl font-bold text-[var(--text)] mt-3">Create Account</h1>
          <p className="text-sm text-[var(--subtext)] mt-1">Join the Bayut community</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ali Hassan"
            />
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--subtext)] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#C9A84C] hover:underline font-medium">
            Sign in
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
