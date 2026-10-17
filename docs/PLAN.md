# Kanban MVP Plan

## Phase 1: Scaffolding
- [x] Next.js (latest, App Router, TypeScript, Tailwind) created in `frontend/`
- [x] Root `.gitignore` covers node_modules, .next, test output, env files
- [x] Vitest + Testing Library configured; `npm test` runs
- [x] Playwright configured; `npm run test:e2e` runs
- [x] `npm run lint` and `npm run build` pass

## Phase 2: Board state (pure logic)
- [x] Board model: 5 fixed columns, cards with id, title, details
- [x] Dummy data seeded on load
- [x] Pure functions: renameColumn, addCard, deleteCard, moveCard
- [x] Unit tests cover every function, including moves within and across columns

## Phase 3: UI
- [x] Single board, 5 columns, color scheme applied
- [x] Rename a column inline (click title, edit, Enter/blur saves, Escape cancels)
- [x] Add a card (title required, details optional) to any column
- [x] Delete a card
- [x] Drag and drop cards within and between columns, including empty columns
- [x] Component tests for rename, add, delete
- [x] Keyboard drag supported (dnd-kit keyboard sensor)

## Phase 4: Integration testing
- [x] Playwright: loads with dummy data and 5 columns
- [x] Playwright: rename, add, delete, drag across columns, drag to empty column
- [x] All defects found are fixed; unit and e2e suites green

## Phase 5: Delivery
- [x] Minimal README with run/test commands
- [ ] Committed and pushed to the user's GitHub repo
- [ ] Dev server running
