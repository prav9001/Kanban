# Kanban

A multi-user Kanban project management app built with Next.js, Tailwind CSS, dnd-kit and SQLite. Sign up, keep any number of boards, rename columns, add and drag cards. Data is stored in `frontend/data/kanban.db`.

## Run

```
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and create an account.

## Test

```
npm test                    # unit, component and API tests (Vitest)
npm run test:coverage       # same, with a coverage report
npx playwright install chromium
npm run test:e2e            # integration tests (Playwright, builds and serves on port 3100)
```

Requires Node 22.13 or later (uses the built-in `node:sqlite`). See `docs/PLAN.md` for the build plan.
