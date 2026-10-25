"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { inputClass, primaryButton } from "./ui";

type Mode = "login" | "signup";

const copy = {
  login: { heading: "Welcome back", submit: "Sign in", alt: "New here?", altLink: "Create an account", altHref: "/signup" },
  signup: { heading: "Create your account", submit: "Create account", alt: "Already have an account?", altLink: "Sign in", altHref: "/login" },
};

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const text = copy[mode];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await api(`/api/auth/${mode}`, { method: "POST", body: Object.fromEntries(new FormData(e.currentTarget)) });
      router.replace("/boards");
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="font-display text-center text-2xl font-bold tracking-tight text-secondary">Kanban</p>
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-xl shadow-secondary/10 ring-1 ring-secondary/10">
          <div className="h-1 bg-accent" />
          <form onSubmit={submit} className="space-y-4 p-7">
            <h1 className="font-display text-2xl font-bold text-navy">{text.heading}</h1>
            {mode === "signup" && (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-navy">Name</span>
                <input name="name" required autoComplete="name" className={inputClass} />
              </label>
            )}
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-navy">Email</span>
              <input name="email" type="email" required autoComplete="email" className={inputClass} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-navy">Password</span>
              <input
                name="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className={inputClass}
              />
            </label>
            {mode === "signup" && <p className="-mt-2.5 text-xs text-muted">At least 8 characters</p>}
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button type="submit" disabled={pending} className={`${primaryButton} w-full py-2.5`}>
              {text.submit}
            </button>
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          {text.alt}{" "}
          <Link href={text.altHref} className="font-semibold text-primary hover:underline">
            {text.altLink}
          </Link>
        </p>
      </div>
    </main>
  );
}
