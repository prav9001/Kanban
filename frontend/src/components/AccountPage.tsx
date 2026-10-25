"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { api } from "@/lib/api";
import type { User } from "@/lib/user";
import AppHeader from "./AppHeader";
import { inputClass, primaryButton } from "./ui";

type Message = { ok: boolean; text: string } | null;

// Runs a form submission against the API and reports success or the server's error message.
function useSubmit(action: (form: FormData) => Promise<string>) {
  const [message, setMessage] = useState<Message>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setMessage(null);
    try {
      setMessage({ ok: true, text: await action(new FormData(form)) });
      form.reset();
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    }
    setPending(false);
  }

  return { onSubmit, message, pending };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-secondary/5 ring-1 ring-secondary/10">
      <div className="h-1 bg-accent" />
      <div className="p-6">
        <h2 id={id} className="font-display text-lg font-semibold text-navy">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-navy">{label}</span>
      <input required className={inputClass} {...props} />
    </label>
  );
}

function Feedback({ message }: { message: Message }) {
  if (!message?.text) return null;
  return (
    <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>
      {message.text}
    </p>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: user } = useSWR<User>("/api/auth/me", api);

  const profile = useSubmit(async (form) => {
    await mutate("/api/auth/me", api<User>("/api/auth/me", { method: "PATCH", body: { name: form.get("name") } }), {
      revalidate: false,
    });
    return "Name updated";
  });

  const password = useSubmit(async (form) => {
    await api("/api/auth/password", { method: "POST", body: Object.fromEntries(form) });
    return "Password changed. Other devices have been signed out.";
  });

  const remove = useSubmit(async (form) => {
    if (!confirm("Delete your account and all of your boards? This cannot be undone.")) return "";
    await api("/api/auth/me", { method: "DELETE", body: { password: form.get("password") } });
    await mutate(() => true, undefined, { revalidate: false });
    router.replace("/signup");
    return "";
  });

  return (
    <main className="min-h-dvh">
      <AppHeader back>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Account</h1>
        <p className="mt-1 text-sm text-white/75">{user?.email ?? "Loading"}</p>
      </AppHeader>

      <div className="mx-auto max-w-xl space-y-6 px-6 py-8 sm:px-8">
        <Section title="Profile">
          {user && (
            <form onSubmit={profile.onSubmit} className="mt-4 space-y-4">
              <Field key={user.name} label="Name" name="name" defaultValue={user.name} autoComplete="name" />
              <Feedback message={profile.message} />
              <button type="submit" disabled={profile.pending} className={primaryButton}>
                Save name
              </button>
            </form>
          )}
        </Section>

        <Section title="Change password">
          <form onSubmit={password.onSubmit} className="mt-4 space-y-4">
            <Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" />
            <Field label="New password" name="newPassword" type="password" minLength={8} autoComplete="new-password" />
            <Feedback message={password.message} />
            <button type="submit" disabled={password.pending} className={primaryButton}>
              Change password
            </button>
          </form>
        </Section>

        <Section title="Delete account">
          <p className="mt-1 text-sm text-muted">This permanently removes your account and every board you own.</p>
          <form onSubmit={remove.onSubmit} className="mt-4 space-y-4">
            <Field label="Confirm with your password" name="password" type="password" autoComplete="current-password" />
            <Feedback message={remove.message} />
            <button
              type="submit"
              disabled={remove.pending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              Delete account
            </button>
          </form>
        </Section>
      </div>
    </main>
  );
}
