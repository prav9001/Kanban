"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "@/lib/board";

export function CardBody({ card, lifted }: { card: Card; lifted?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-l-4 bg-white p-4 transition duration-200 ${
        lifted
          ? "rotate-2 scale-[1.02] cursor-grabbing border-secondary/20 border-l-accent shadow-2xl shadow-secondary/30 ring-2 ring-accent"
          : "border-secondary/10 border-l-transparent shadow-sm shadow-secondary/5 group-hover:-translate-y-0.5 group-hover:border-l-accent group-hover:shadow-md group-hover:shadow-secondary/15"
      }`}
    >
      <h3 className="pr-6 text-[15px] leading-snug font-semibold text-navy">{card.title}</h3>
      {card.details && <p className="mt-1.5 text-sm leading-relaxed text-muted">{card.details}</p>}
    </div>
  );
}

export default function SortableCard({ card, onDelete }: { card: Card; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative rounded-xl ${isDragging ? "bg-secondary/5 outline-2 outline-dashed outline-secondary/40 *:invisible" : ""}`}
      data-testid="card"
    >
      <div
        className="cursor-grab touch-none rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        {...attributes}
        {...listeners}
      >
        <CardBody card={card} />
      </div>
      <button
        type="button"
        aria-label={`Delete ${card.title}`}
        onClick={onDelete}
        className="absolute top-3 right-3 rounded-md p-1 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden>
          <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
        </svg>
      </button>
    </li>
  );
}
