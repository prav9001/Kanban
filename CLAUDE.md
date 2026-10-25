# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Product requirements, color scheme and coding standards live in `AGENTS.md` -- read it first. Key rules: multi-user, many boards per user, keep it simple, no emojis ever, minimal README, every feature ships with tests. The build plan and roadmap are in `docs/PLAN.md`.

## Commands

All commands run from `frontend/` (Next.js 16, React 19, Tailwind 4, TypeScript, Node 22.13+ for `node:sqlite`).

```
npm run dev                          # dev server at http://localhost:3000
npm run build                        # production build
npm run lint                         # ESLint
npm test                             # Vitest unit, component and API tests
npm run test:coverage                # with coverage
npx vitest run src/lib/board.test.ts # single test file
npx vitest run -t "reorders within a column" # single test by name
npm run test:e2e                     # Playwright; builds and serves on port 3100 with data/e2e.db
npx playwright test -g "drag"        # single e2e test by name
```

First-time e2e setup: `npx playwright install chromium`. Run `npx next typegen` if `RouteContext` types are missing.

## Architecture

- `src/lib/board.ts` holds the `Card`/`Column`/`Board`/`BoardSummary` types, sample data (`initialColumns`), `emptyColumns`, and pure immutable state functions (`renameColumn`, `addCard`, `deleteCard`, `moveCard`, `findColumn`). Keep board logic here as pure functions and unit test it in `board.test.ts`.
- `src/lib/server/` is server-only: `db.ts` (node:sqlite singleton and schema; `DATABASE_PATH` env, `:memory:` in Vitest; `resetDb` for tests), `auth.ts` (users, async scrypt passwords, session tokens), `boards.ts` (board CRUD scoped by user id; columns stored as JSON), `schemas.ts` (zod request bodies), `http.ts` (`requireUser`, `parseBody`, `withSession`, `error`).
- Route Handlers: `src/app/api/auth/{signup,login,logout,me,password}` and `src/app/api/boards`, `src/app/api/boards/[id]`. `src/app/api/api.test.ts` calls them directly via `call` in `src/test/api.ts`.
- `src/proxy.ts` redirects requests without a session cookie away from `/boards` and `/account`; `/` redirects to `/boards` in `next.config.ts`.
- Pages are thin server files rendering client components (`AuthForm`, `BoardList`, `BoardPage`, `AccountPage`) that fetch with SWR through `src/lib/api.ts` (throws `ApiError`; a 401 outside the auth pages sends the browser to /login). `AppHeader` shows the user and sign out.
- `Board.tsx` takes a loaded board, owns `columns` state and saves each change through a serial PATCH queue with a visible save status; drag-over moves are only saved on drop. It hosts the dnd-kit `DndContext`; a `DragOverlay` renders the lifted card using `CardBody`.
- `Column.tsx` is a droppable (id = column id) wrapping a `SortableContext`; it also handles inline rename and the add-card form. `Card.tsx` exports `CardBody` (presentational) and the default `SortableCard`. Drop targets can be a column id or a card id, which is why `findColumn` matches both.
- Theme colors and fonts are Tailwind 4 `@theme` tokens in `src/app/globals.css` (`accent`, `primary`, `secondary`, `navy`, `muted`, `canvas`; `font-display` for headings). Use these utilities rather than raw hex values. Shared input/button classes are in `src/components/ui.ts`.
- Component tests use `renderWithSWR` and `mockFetch` from `src/test/render.tsx` and mock `next/navigation` per file.
- E2E tests sign up a fresh user per test through `e2e/helpers.ts`. Columns are `<section aria-label>` regions, cards are `data-testid="card"`, board tiles `data-testid="board-tile"`; preserve these when editing markup. Next keeps visited routes mounted but hidden, so use the helpers' visible-only locators (`cards`, `tiles`, `field`) and exact names.
