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
      <header className="px-6 pt-8 pb-6 sm:px-8">
        <p className="text-sm text-muted">Website relaunch</p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Launch board
        </h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted">
          <span className="h-1 w-12 rounded-full bg-accent" />
          {total} cards across {columns.length} stages
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
        <div className="flex flex-1 gap-3 overflow-x-auto px-6 pb-8 sm:px-8">
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
        <DragOverlay>{activeCard && <CardBody card={activeCard} lifted />}</DragOverlay>
      </DndContext>
    </main>
  );
}
