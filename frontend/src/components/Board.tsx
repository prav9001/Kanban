"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type Announcements,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useSWRConfig } from "swr";
import { api } from "@/lib/api";
import { addCard, deleteCard, findColumn, moveCard, renameColumn, type Board as BoardData, type Column } from "@/lib/board";
import AppHeader from "./AppHeader";
import ColumnView from "./Column";
import { CardBody } from "./Card";

function targetIndex(column: Column, overId: string) {
  return column.id === overId ? column.cards.length : column.cards.findIndex((c) => c.id === overId);
}

type SaveState = "saved" | "saving" | "error";

const saveLabels: Record<SaveState, string> = { saved: "All changes saved", saving: "Saving...", error: "Could not save changes" };

export default function Board({ board }: { board: BoardData }) {
  const { mutate } = useSWRConfig();
  const [name, setName] = useState(board.name);
  const [renaming, setRenaming] = useState(false);
  const [columns, setColumns] = useState(board.columns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const beforeDrag = useRef(columns);
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Saves run one at a time so the server always ends up with the latest change.
  function save(changes: Partial<Pick<BoardData, "name" | "columns">>) {
    const url = `/api/boards/${board.id}`;
    pending.current++;
    setSaveState("saving");
    queue.current = queue.current
      .then(() => api<BoardData>(url, { method: "PATCH", body: changes }))
      .then(
        (updated) => {
          mutate(url, updated, { revalidate: false });
          if (--pending.current === 0) setSaveState("saved");
        },
        () => {
          pending.current--;
          setSaveState("error");
        },
      );
  }

  function update(next: Column[]) {
    setColumns(next);
    save({ columns: next });
  }

  function rename(value: string) {
    setRenaming(false);
    if (!value.trim() || value.trim() === name) return;
    setName(value.trim());
    save({ name: value.trim() });
  }

  const cards = columns.flatMap((c) => c.cards);
  const activeCard = cards.find((c) => c.id === activeId);
  const total = cards.length;
  const done = columns.at(-1)!.cards.length;

  function handleDragStart({ active }: DragStartEvent) {
    beforeDrag.current = columns;
    setActiveId(String(active.id));
  }

  function handleDragCancel() {
    setColumns(beforeDrag.current);
    setActiveId(null);
  }

  const titleOf = (id: UniqueIdentifier) => cards.find((c) => c.id === id)?.title;
  const columnOf = (id: UniqueIdentifier) => findColumn(columns, String(id))!.title;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) => {
      if (!over) return;
      const near = over.id !== active.id && titleOf(over.id);
      return `${titleOf(active.id)} is ${near ? `over ${near} ` : ""}in ${columnOf(over.id)}.`;
    },
    onDragEnd: ({ active, over }) => (over ? `${titleOf(active.id)} was dropped in ${columnOf(over.id)}.` : undefined),
    onDragCancel: ({ active }) => `${titleOf(active.id)} was returned to its place.`,
  };

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = findColumn(columns, String(active.id));
    const to = findColumn(columns, String(over.id));
    if (!from || !to || from.id === to.id) return;
    setColumns(moveCard(columns, String(active.id), to.id, targetIndex(to, String(over.id))));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const to = over && findColumn(columns, String(over.id));
    if (!to) return handleDragCancel();
    update(moveCard(columns, String(active.id), to.id, targetIndex(to, String(over.id))));
  }

  return (
    <main className="flex h-dvh flex-col">
      <AppHeader back>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="min-w-0">
            {renaming ? (
              <input
                autoFocus
                aria-label="Board name"
                defaultValue={name}
                onBlur={(e) => rename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") rename(e.currentTarget.value);
                  if (e.key === "Escape") setRenaming(false);
                }}
                className="font-display w-full max-w-xl rounded-lg bg-white/10 px-2 py-0.5 text-3xl font-bold tracking-tight text-white ring-2 ring-accent outline-none sm:text-4xl"
              />
            ) : (
              <h1 className="font-display text-3xl font-bold tracking-tight wrap-anywhere sm:text-4xl">
                <button
                  type="button"
                  onClick={() => setRenaming(true)}
                  title="Rename board"
                  className="-ml-2 rounded-lg px-2 py-0.5 text-left hover:bg-white/10"
                >
                  {name}
                </button>
              </h1>
            )}
            <p role="status" className={`mt-1 text-xs ${saveState === "error" ? "font-semibold text-accent" : "text-white/60"}`}>
              {saveLabels[saveState]}
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-sm text-white/75">
              <span>
                {total} cards across {columns.length} stages
              </span>
              <span className="font-semibold text-white">{done} done</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </AppHeader>

      <DndContext
        id="board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{ announcements }}
      >
        <div className="flex flex-1 gap-3 overflow-x-auto px-6 pt-6 pb-8 sm:px-8">
          {columns.map((column) => (
            <ColumnView
              key={column.id}
              column={column}
              onRename={(title) => update(renameColumn(columns, column.id, title))}
              onAdd={(card) => update(addCard(columns, column.id, card))}
              onDelete={(cardId) => update(deleteCard(columns, cardId))}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>{activeCard && <CardBody card={activeCard} lifted />}</DragOverlay>
      </DndContext>
    </main>
  );
}
