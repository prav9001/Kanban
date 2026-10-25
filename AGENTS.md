# Kanban Project

## Business Requirements

The MVP (single board, local storage) has grown into a multi-user project management app.

- Users sign up and sign in with email and password; each user only sees their own data
- A user has many boards; boards can be created, renamed and deleted
- A new account starts with one sample board populated with dummy data
- Boards have columns that can be renamed; cards have a title and details
- Drag and drop interface to move cards within and between columns
- Add a new card to a column; delete an existing card
- The priority is a slick, professional, gorgeous UI/UX
- New features are added incrementally; each one ships with unit, API and Playwright tests

## Technical Details

- A modern Next.js app in the subdirectory `frontend`; pages are client components that talk to Route Handlers under `/api`
- Data is stored in SQLite via the built-in `node:sqlite` module (file set by `DATABASE_PATH`, default `frontend/data/kanban.db`)
- Passwords hashed with scrypt; sessions are random tokens in an httpOnly cookie
- Board changes are saved to the server after every change
- Use popular libraries
- As simple as possible but with an elegant UI

## Color Scheme

- Accent Yellow: `#ecad0a` - accent lines, highlights
- Blue Primary: `#209dd7` - links, key sections
- Purple Secondary: `#753991` - submit buttons, important actions
- Dark Navy: `#032147` - main headings
- Gray Text: `#888888` - supporting text, labels

## Strategy

1. Write plan with success criteria for each phase to be checked off. Include project scaffolding, including .gitignore, and rigorous unit testing.
2. Execute the plan ensuring all critiera are met
3. Carry out extensive integration testing with Playwright or similar, fixing defects
4. Only complete when the MVP is finished and tested, with the server running and ready for the user

## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
