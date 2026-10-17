"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Card, Column } from "@/lib/board";
import SortableCard from "./Card";

type Props = {
  column: Column;
  onRename: (title: string) => void;
  onAdd: (card: Card) => void;
  onDelete: (cardId: string) => void;
};

export default function ColumnView({ column, onRename, onAdd, onDelete }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  function saveTitle(value: string) {
    if (value.trim()) onRename(value.trim());
    setEditing(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({ id: crypto.randomUUID(), title: title.trim(), details: details.trim() });
    setTitle("");
    setDetails("");
    setAdding(false);
  }

  return (
    <section
      aria-label={column.title}
      data-testid="column"
      className="flex min-w-56 flex-1 flex-col overflow-hidden rounded-2xl bg-[#f2ebf7] shadow-sm shadow-secondary/5 ring-1 ring-secondary/10"
    >
      <div className="h-1 bg-accent" />
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        {editing ? (
          <input
            autoFocus
            aria-label="Column name"
            defaultValue={column.title}
            onBlur={(e) => saveTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle(e.currentTarget.value);
              if (e.key === "Escape") setEditing(false);
            }}
            className="font-display w-full rounded-md border border-secondary bg-white px-2 py-0.5 text-lg font-semibold text-navy ring-3 ring-secondary/15 outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Rename column"
            className="font-display rounded-md px-2 py-0.5 -ml-2 text-left text-lg font-semibold text-navy transition hover:bg-accent/20"
          >
            {column.title}
          </button>
        )}
        <span className="min-w-6 rounded-full bg-accent px-2 py-0.5 text-center text-xs font-bold text-navy">
          {column.cards.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`mx-1.5 mb-1.5 flex-1 overflow-y-auto rounded-xl px-1.5 pt-0.5 transition-colors ${isOver ? "bg-accent/10" : ""}`}
      >
        <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2.5">
            {column.cards.map((card) => (
              <SortableCard key={card.id} card={card} onDelete={() => onDelete(card.id)} />
            ))}
            {column.cards.length === 0 && (
              <li className="rounded-xl border-2 border-dashed border-secondary/20 px-4 py-6 text-center text-sm text-muted">
                Drop a card here
              </li>
            )}
          </ul>
        </SortableContext>

        <div className="py-2.5">
          {adding ? (
            <form onSubmit={submit} className="space-y-2 rounded-xl border border-secondary/15 bg-white p-3 shadow-md shadow-secondary/10">
              <input
                autoFocus
                aria-label="Card title"
                placeholder="Card title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-navy/10 px-2.5 py-1.5 text-sm outline-none transition focus:border-secondary focus:ring-3 focus:ring-secondary/15"
              />
              <textarea
                aria-label="Card details"
                placeholder="Details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full resize-none rounded-md border border-navy/10 px-2.5 py-1.5 text-sm outline-none transition focus:border-secondary focus:ring-3 focus:ring-secondary/15"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="rounded-lg bg-secondary px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm shadow-secondary/30 transition hover:bg-[#62307a] disabled:opacity-40 disabled:shadow-none"
                >
                  Add card
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-navy"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full rounded-xl border border-dashed border-secondary/25 px-3 py-2 text-left text-sm font-semibold text-secondary transition hover:border-secondary/50 hover:bg-white"
            >
              + Add card
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
