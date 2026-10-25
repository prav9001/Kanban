"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { Board as BoardData } from "@/lib/board";
import Board from "./Board";

export const Loading = () => <main className="flex min-h-dvh items-center justify-center text-muted">Loading board</main>;

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = useSWR<BoardData>(`/api/boards/${id}`, api, { revalidateOnFocus: false });

  if (error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-navy">Board not found</h1>
        <p className="text-muted">It may have been deleted, or it belongs to someone else.</p>
        <Link href="/boards" className="font-semibold text-primary hover:underline">
          Back to your boards
        </Link>
      </main>
    );
  }
  if (!data) return <Loading />;
  return <Board key={data.id} board={data} />;
}
