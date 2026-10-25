"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { api } from "@/lib/api";
import type { User } from "@/lib/user";

export default function AppHeader({ back, children }: { back?: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: user } = useSWR<User>("/api/auth/me", api);

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" });
    await mutate(() => true, undefined, { revalidate: false });
    router.replace("/login");
  }

  return (
    <header className="border-b-4 border-accent bg-secondary px-6 pt-5 pb-7 text-white sm:px-8">
      <nav className="flex items-center justify-between gap-4 text-sm">
        <Link href="/boards" className="font-medium text-accent hover:text-white">
          {back ? "← All boards" : "Kanban"}
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <Link href="/account" className="text-white/80 hover:text-white" title="Account settings">
              {user.name}
            </Link>
          )}
          <button type="button" onClick={signOut} className="rounded-md px-2 py-1 text-white/80 ring-1 ring-white/25 hover:bg-white/10 hover:text-white">
            Sign out
          </button>
        </div>
      </nav>
      <div className="mt-4">{children}</div>
    </header>
  );
}
