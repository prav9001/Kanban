export type Card = { id: string; title: string; details: string };
export type Column = { id: string; title: string; cards: Card[] };

export const initialColumns: Column[] = [
  {
    id: "col-backlog",
    title: "Backlog",
    cards: [
      { id: "card-1", title: "Audit current site content", details: "List every page, owner and last update date." },
      { id: "card-2", title: "Collect customer quotes", details: "Ask the success team for five recent wins." },
      { id: "card-3", title: "Pick analytics tool", details: "Compare privacy-friendly options." },
    ],
  },
  {
    id: "col-todo",
    title: "To do",
    cards: [
      { id: "card-4", title: "Write homepage copy", details: "Headline, three value points and a clear call to action." },
      { id: "card-5", title: "Define pricing tiers", details: "Starter, Team and Enterprise." },
    ],
  },
  {
    id: "col-progress",
    title: "In progress",
    cards: [
      { id: "card-6", title: "Design new navigation", details: "Keep it to five top-level items." },
      { id: "card-7", title: "Set up staging environment", details: "Mirror production settings and seed data." },
    ],
  },
  {
    id: "col-review",
    title: "Review",
    cards: [{ id: "card-8", title: "Brand color update", details: "Check contrast on buttons and links." }],
  },
  {
    id: "col-done",
    title: "Done",
    cards: [
      { id: "card-9", title: "Kickoff meeting", details: "Goals and timeline agreed with stakeholders." },
      { id: "card-10", title: "Domain renewal", details: "Renewed for two years." },
    ],
  },
];

export function renameColumn(columns: Column[], columnId: string, title: string): Column[] {
  return columns.map((c) => (c.id === columnId ? { ...c, title } : c));
}

export function addCard(columns: Column[], columnId: string, card: Card): Column[] {
  return columns.map((c) => (c.id === columnId ? { ...c, cards: [...c.cards, card] } : c));
}

export function deleteCard(columns: Column[], cardId: string): Column[] {
  return columns.map((c) => ({ ...c, cards: c.cards.filter((card) => card.id !== cardId) }));
}

export function findColumn(columns: Column[], id: string): Column | undefined {
  return columns.find((c) => c.id === id || c.cards.some((card) => card.id === id));
}

export function moveCard(columns: Column[], cardId: string, toColumnId: string, toIndex: number): Column[] {
  const card = columns.flatMap((c) => c.cards).find((c) => c.id === cardId)!;
  return columns.map((c) => {
    const cards = c.cards.filter((x) => x.id !== cardId);
    if (c.id === toColumnId) cards.splice(toIndex, 0, card);
    return { ...c, cards };
  });
}

const STORAGE_KEY = "kanban-board";

export function loadColumns(): Column[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : initialColumns;
}

export function saveColumns(columns: Column[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
}
