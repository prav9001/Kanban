# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Product requirements, color scheme and coding standards live in `AGENTS.md` -- read it first. Key rules: single board, five fixed renamable columns, cards with title and details only, no extra features, keep it simple, no emojis ever, minimal README. The build plan is in `docs/PLAN.md`.

## Commands

All commands run from `frontend/` (Next.js 16, React 19, Tailwind 4, TypeScript).

```
npm run dev                          # dev server at http://localhost:3000
npm run build                        # production build
npm run lint                         # ESLint
npm test                             # Vitest unit tests (jsdom)
npx vitest run src/lib/board.test.ts # single test file
npx vitest run -t "reorders within a column" # single test by name
npm run test:e2e                     # Playwright (chromium); starts or reuses the dev server
npx playwright test -g "drag"        # single e2e test by name
```

First-time e2e setup: `npx playwright install chromium`.

## Architecture

- `src/lib/board.ts` holds the `Card`/`Column` types, seed data (`initialColumns`), and pure immutable state functions (`renameColumn`, `addCard`, `deleteCard`, `moveCard`, `findColumn`) plus `loadColumns`/`saveColumns` for local storage (key `kanban-board`). Keep board logic here as pure functions and unit test it in `board.test.ts`.
- `src/components/Board.tsx` owns the single `columns` state, initialized lazily from local storage and persisted via a `useEffect` on every change. It hosts the dnd-kit `DndContext`: `onDragOver` moves a card across columns live, `onDragEnd` finalizes position; both go through `moveCard`. A `DragOverlay` renders the lifted card using `CardBody`.
- `Column.tsx` is a droppable (id = column id) wrapping a `SortableContext`; it also handles inline rename and the add-card form. `Card.tsx` exports `CardBody` (presentational) and the default `SortableCard`. Drop targets can be either a column id or a card id, which is why `findColumn` matches both.
- `src/app/page.tsx` loads `Board` with `dynamic(..., { ssr: false })` because state reads `localStorage` at init -- the app is fully client rendered.
- Theme colors and fonts are Tailwind 4 `@theme` tokens in `src/app/globals.css` (`accent`, `primary`, `secondary`, `navy`, `muted`, `canvas`; `font-display` for headings). Use these utilities rather than raw hex values.
- E2E tests in `e2e/board.spec.ts` locate columns by `getByRole("region", { name })` (columns are `<section aria-label>`) and cards by `data-testid="card"`; preserve these when editing markup.
