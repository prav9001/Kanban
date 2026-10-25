import { randomUUID } from "node:crypto";
import type { Board, BoardSummary, Column } from "@/lib/board";
import { getDb } from "./db";

type Row = { id: string; name: string; columns: string; updated_at: number };

const toBoard = (r: Row): Board => ({ id: r.id, name: r.name, columns: JSON.parse(r.columns), updatedAt: r.updated_at });

export function listBoards(userId: string): BoardSummary[] {
  const rows = getDb()
    .prepare("SELECT id, name, columns, updated_at FROM boards WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId) as Row[];
  return rows.map(toBoard).map((b) => ({
    id: b.id,
    name: b.name,
    cardCount: b.columns.reduce((n, c) => n + c.cards.length, 0),
    updatedAt: b.updatedAt,
  }));
}

export function getBoard(userId: string, id: string): Board | null {
  const row = getDb()
    .prepare("SELECT id, name, columns, updated_at FROM boards WHERE id = ? AND user_id = ?")
    .get(id, userId) as Row | undefined;
  return row ? toBoard(row) : null;
}

export function createBoard(userId: string, name: string, columns: Column[]): Board {
  const now = Date.now();
  const board = { id: randomUUID(), name, columns, updatedAt: now };
  getDb()
    .prepare("INSERT INTO boards (id, user_id, name, columns, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(board.id, userId, name, JSON.stringify(columns), now, now);
  return board;
}

export function updateBoard(userId: string, id: string, changes: { name?: string; columns?: Column[] }): Board | null {
  const board = getBoard(userId, id);
  if (!board) return null;
  const next = { ...board, ...changes, updatedAt: Date.now() };
  getDb()
    .prepare("UPDATE boards SET name = ?, columns = ?, updated_at = ? WHERE id = ?")
    .run(next.name, JSON.stringify(next.columns), next.updatedAt, id);
  return next;
}

export function deleteBoard(userId: string, id: string) {
  return getDb().prepare("DELETE FROM boards WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}
