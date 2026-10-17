# Code Review

Date: 2026-10-17. Scope: the whole repo at commit `8c8dd11` (`frontend/src`, tests, config, docs).

## Summary

The codebase is small and clean, and it follows `AGENTS.md`. Board logic is pure and unit tested, persistence is two functions, and the components are short. Lint, the unit tests (17), the build and the Playwright tests (11) all pass. There are no known vulnerabilities in the production dependencies (`npm audit`).

The review found two functional bugs in drag and drop and storage, three display bugs on cards, and a few smaller consistency, accessibility and housekeeping items. A throwaway Playwright test in a real browser confirmed every item marked "Verified".

## Findings and actions

### High

**1. Cancelling a drag does not put the card back** (Verified)
`frontend/src/components/Board.tsx:43`, `:89`
`handleDragOver` moves the card into the hovered column as soon as the pointer crosses into it. `onDragCancel` only clears `activeId`. So pressing Escape mid-drag leaves the card in whatever column it was over. In the check, a card dragged over Review and cancelled with Escape stayed in Review.
Action: save `columns` in `handleDragStart` and restore them in `onDragCancel`. A drop "outside" never happens here, because `closestCorners` always reports the nearest column or card.
Status: Fixed. Playwright test "cancelling a drag with Escape puts the card back".

**2. Corrupt saved data leaves a blank page** (Verified)
`frontend/src/lib/board.ts:74`
When the `kanban-board` key holds invalid JSON, `JSON.parse` throws during the first render. The page then renders no board and has no way to recover, short of clearing site data by hand. This is the one place where a guard pays for itself, because the app can't recover any other way.
Action: wrap the parse in `try/catch` and fall back to `initialColumns`. Add a unit test.
Status: Fixed. Unit test "falls back to the dummy board when saved data is corrupt".

### Medium

**3. Line breaks in card details are lost** (Verified)
`frontend/src/components/Card.tsx:17`
The details field is a multi-line textarea, but the `<p>` collapses the newlines, so "line1\nline2" shows as a single line.
Action: add `whitespace-pre-line` to the details paragraph.
Status: Fixed. Playwright test "wraps long titles and keeps line breaks in details".

**4. Long words overflow the card** (Verified)
`frontend/src/components/Card.tsx:16-17`
A title with no spaces (a URL, say) overflows the card. In the check, the title was 700px wide inside a 173px box.
Action: add `wrap-anywhere` to the title and details.
Status: Fixed. Covered by the same Playwright test as item 3.

**5. Screen reader announcements read out internal ids** (Verified)
`frontend/src/components/Board.tsx` (`DndContext`)
The default dnd-kit announcements say "Draggable item card-9 was moved over droppable area card-9." Screen reader users hear ids instead of card and column names. The keyboard e2e test (`e2e/board.spec.ts:91-93`) asserts on this ids-based text, so it fixes the wording in place.
Action: pass `accessibility={{ announcements }}` to `DndContext` so it announces card titles and column names. Update the keyboard e2e test to match.
Status: Fixed. The keyboard and cancel e2e tests check the new wording.

### Low

**6. Hard-coded colors bypass the theme tokens**
`frontend/src/components/Column.tsx:40` (`bg-[#f2ebf7]`), `:111` (`hover:bg-[#62307a]`). `frontend/src/components/Card.tsx:42` uses `red-50`/`red-600`.
Action: add `--color-column` and `--color-secondary-dark` tokens to `globals.css` and use them. Keep red for delete; it is a sensible semantic choice outside the brand palette.

**7. Blue Primary is defined but never used**
`frontend/src/app/globals.css:5`
`AGENTS.md` assigns `#209dd7` to "links, key sections". Nothing in the UI uses it.
Action: decide on a use. Small options are the focus rings, or the "+ Add card" hover border. Or accept it as unused, since the UI has no links.

**8. The add-card form has no keyboard cancel**
`frontend/src/components/Column.tsx:90`
Column rename cancels on Escape, but the add-card form only closes through the Cancel button.
Action: on the form, handle `onKeyDown` so Escape calls `setAdding(false)`, to match rename.

**9. `crypto.randomUUID` needs a secure context**
`frontend/src/components/Column.tsx:30`
On `localhost` this works. If the dev server is opened over a LAN IP (for example to test on a phone), `crypto.randomUUID` is undefined and adding a card throws.
Action: none needed for the MVP. Note it if testing on other devices becomes a goal.

**10. Board is written to storage on every drag-over**
`frontend/src/components/Board.tsx:33`
The save effect runs on every `columns` change, including each cross-column move during a drag. This is harmless at this size.
Action: none. If item 1 is fixed with a snapshot, this stays correct.

## Tests

- Coverage of the pure functions is good, and the component tests cover rename, add, delete and persistence.
- Gaps: drag cancel (item 1), corrupt storage (item 2), and Escape on rename in a real browser. Escape was checked during this review and works, but no e2e test covers it.
- `e2e/board.spec.ts:91-93` asserts on dnd-kit's default announcement strings. Item 5 will change them.

## Housekeeping

- `frontend/AGENTS.md` is untracked. `next dev` generates it and says it should be committed so it stops showing as a change. Action: commit it.
- `docs/PLAN.md` Phase 5 still shows "Committed and pushed" unchecked, but the work is on `origin/main`. Action: tick it.
- `npm outdated`: `react`/`react-dom` have 19.3.1 available (a patch release). Action: upgrade. Hold off on the major updates (ESLint 10, TypeScript 7) until `eslint-config-next` supports them.

## Suggested order

1. Items 1 and 2, with tests.
2. Items 3, 4 and 8 (one-line class and handler changes).
3. Item 5, and update the keyboard e2e test.
4. Items 6 and 7, then the housekeeping.
