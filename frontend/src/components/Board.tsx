"use client";

import { useState } from "react";
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
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { addCard, deleteCard, findColumn, initialColumns, moveCard, renameColumn, type Column } from "@/lib/board";
import ColumnView from "./Column";
import { CardBody } from "./Card";

function targetIndex(column: Column, overId: string) {
  return column.id === overId ? column.cards.length : column.cards.findIndex((c) => c.id === overId);
}

export default function Board() {
  const [columns, setColumns] = useState(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeCard = columns.flatMap((c) => c.cards).find((c) => c.id === activeId);
  const total = columns.reduce((n, c) => n + c.cards.length, 0);
  const done = columns.at(-1)!.cards.length;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = findColumn(columns, String(active.id));
    const to = findColumn(columns, String(over.id));
    if (!from || !to || from.id === to.id) return;
    setColumns(moveCard(columns, String(active.id), to.id, targetIndex(to, String(over.id))));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const to = findColumn(columns, String(over.id));
    if (!to) return;
    setColumns(moveCard(columns, String(active.id), to.id, targetIndex(to, String(over.id))));
  }

  return (
    <main className="flex h-dvh flex-col">
      <header className="border-b-4 border-accent bg-secondary px-6 pt-8 pb-7 text-white sm:px-8">
        <p className="text-sm font-medium text-accent">Website relaunch</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Launch board</h1>
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
      </header>

      <DndContext
        id="board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-1 gap-3 overflow-x-auto px-6 pt-6 pb-8 sm:px-8">
          {columns.map((column) => (
            <ColumnView
              key={column.id}
              column={column}
              onRename={(title) => setColumns((cols) => renameColumn(cols, column.id, title))}
              onAdd={(card) => setColumns((cols) => addCard(cols, column.id, card))}
              onDelete={(cardId) => setColumns((cols) => deleteCard(cols, cardId))}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>{activeCard && <CardBody card={activeCard} lifted />}</DragOverlay>
      </DndContext>
    </main>
  );
}
