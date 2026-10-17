# Kanban

A single-board Kanban app built with Next.js, Tailwind CSS and dnd-kit. Five renamable columns, cards with a title and details, drag and drop between columns. Changes are saved in your browser (local storage) and restored on reload.

## Run

```
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## Test

```
npm test                    # unit tests (Vitest)
npx playwright install chromium
npm run test:e2e            # integration tests (Playwright)
```

See `docs/PLAN.md` for the build plan.
