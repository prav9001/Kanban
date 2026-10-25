"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { Board, BoardSummary } from "@/lib/board";
import AppHeader from "./AppHeader";
import { inputClass, primaryButton } from "./ui";

const updated = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

function BoardTile({ board, onChange }: { board: BoardSummary; onChange: () => void }) {
  const [renaming, setRenaming] = useState(false);

  async function rename(name: string) {
    setRenaming(false);
    if (!name.trim() || name.trim() === board.name) return;
    await api(`/api/boards/${board.id}`, { method: "PATCH", body: { name } });
    onChange();
  }

  async function remove() {
    if (!confirm(`Delete "${board.name}" and all its cards?`)) return;
    await api(`/api/boards/${board.id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <li
      data-testid="board-tile"
      className="group relative flex flex-col rounded-2xl border border-l-4 border-secondary/10 border-l-accent bg-white p-5 shadow-sm shadow-secondary/5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-secondary/15"
    >
      {renaming ? (
        <input
          autoFocus
          aria-label="Board name"
          defaultValue={board.name}
          onBlur={(e) => rename(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") rename(e.currentTarget.value);
            if (e.key === "Escape") setRenaming(false);
          }}
          className={`${inputClass} font-display text-lg font-semibold`}
        />
      ) : (
        <Link href={`/boards/${board.id}`} className="font-display pr-24 text-lg font-semibold text-navy wrap-anywhere after:absolute after:inset-0">
          {board.name}
        </Link>
      )}
      <p className="mt-6 flex justify-between text-sm text-muted">
        <span>
          {board.cardCount} {board.cardCount === 1 ? "card" : "cards"}
        </span>
        <span>Updated {updated(board.updatedAt)}</span>
      </p>
      {!renaming && (
        <div className="absolute top-4 right-4 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          <button
            type="button"
            onClick={() => setRenaming(true)}
            aria-label={`Rename ${board.name}`}
            className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-accent/20 hover:text-navy"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={remove}
            aria-label={`Delete ${board.name}`}
            className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-red-50 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

export default function BoardList() {
  const router = useRouter();
  // Refetch every time the list is shown so counts and new boards are never stale.
  const { data: boards, mutate } = useSWR<BoardSummary[]>("/api/boards", api, { dedupingInterval: 0 });
  const [name, setName] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const board = await api<Board>("/api/boards", { method: "POST", body: { name } });
    router.push(`/boards/${board.id}`);
  }

  return (
    <main className="min-h-dvh">
      <AppHeader>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Your boards</h1>
        <p className="mt-1 text-sm text-white/75">
          {boards ? `${boards.length} ${boards.length === 1 ? "board" : "boards"}` : "Loading"}
        </p>
      </AppHeader>

      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
        <form onSubmit={create} className="flex max-w-lg gap-2">
          <input
            aria-label="New board name"
            placeholder="New board name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <button type="submit" disabled={!name.trim()} className={`${primaryButton} shrink-0`}>
            Create board
          </button>
        </form>

        {boards?.length === 0 && (
          <p className="mt-10 rounded-2xl border-2 border-dashed border-secondary/20 px-6 py-12 text-center text-muted">
            No boards yet. Create one to get started.
          </p>
        )}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards?.map((board) => (
            <BoardTile key={board.id} board={board} onChange={() => mutate()} />
          ))}
        </ul>
      </div>
    </main>
  );
}
