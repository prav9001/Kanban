# Kanban Plan

Phases 1-5 built the single-board MVP. Phase 6 onward grows it into a multi-user project management app.

## Phase 1: Scaffolding
- [x] Next.js (latest, App Router, TypeScript, Tailwind) created in `frontend/`
- [x] Root `.gitignore` covers node_modules, .next, test output, env files
- [x] Vitest + Testing Library configured; `npm test` runs
- [x] Playwright configured; `npm run test:e2e` runs
- [x] `npm run lint` and `npm run build` pass

## Phase 2: Board state (pure logic)
- [x] Board model: 5 fixed columns, cards with id, title, details
- [x] Dummy data seeded on first load
- [x] Board saved to local storage after every change and restored on reload
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
- [x] Playwright: changes survive a page reload
- [x] All defects found are fixed; unit and e2e suites green

## Phase 5: Delivery
- [x] Minimal README with run/test commands
- [x] Committed to the user's repo

## Phase 6: Users and multiple boards
- [x] SQLite storage (node:sqlite) with users, sessions and boards tables
- [x] Sign up, sign in, sign out; scrypt password hashing; httpOnly session cookie
- [x] Proxy redirects signed-out visitors to /login; API returns 401 without a session
- [x] Boards list: create, rename, delete (with confirmation); card counts and last updated
- [x] Each new account gets a sample board; each user only sees their own boards
- [x] Board page loads from and saves to the API, in order, with a save status
- [x] Account page: change name, change password (signs out other sessions), delete account
- [x] API integration tests for every route, including cross-user access
- [x] Component tests for every page; Playwright for auth, boards, account and board flows

## Roadmap (next phases, each with unit, API and e2e tests)
- [ ] Card detail dialog: edit title and details in place
- [ ] Card priority, due date and labels, shown on the card
- [ ] Add, delete and reorder columns
- [ ] Search and filter cards on a board
- [ ] Share a board with other users by email (owner and member roles)
- [ ] Card comments and activity history
