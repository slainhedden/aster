# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Aster has two parts:
1. **Slack bot** (`src/`) — TypeScript/Node.js Slack bot with AI-powered answers augmented by custom "skills" per workspace. Built with Slack Bolt SDK (Socket Mode), OpenAI API, and SQLite (better-sqlite3).
2. **Playbook web app** (`web/`) — React + Vite + Tailwind CSS guide for selling/marketing Aster as a business.

### Dev commands

Bot (root `package.json`):
- `npm run dev` — start bot with hot-reload (requires valid Slack + OpenAI credentials in `.env`)
- `npm test` — run all tests (Vitest)
- `npm run lint` — ESLint
- `npm run build` — TypeScript compile to `dist/`
- `npm run demo` — interactive CLI demo (no credentials needed)

Web app (`web/`):
- `cd web && npm run dev` — start playbook web app on port 5173
- `cd web && npm run build` — production build

### Non-obvious caveats

- **Bot dev server requires real credentials**: `npm run dev` connects to Slack via Socket Mode; it will fail with `invalid_auth` if tokens are dummy values. Tests use mocked OpenAI so they run without credentials.
- **SQLite auto-creates**: The database and `data/` directory are created automatically on first run. No migration step needed.
- **Test isolation**: Each test file creates/destroys its own SQLite database in `tests/.test-data/`. These are gitignored.
- **OpenAI mock pattern**: Tests mock the `openai` module with a class-based mock (not function-based). See `tests/services/ai.test.ts` for the pattern.
- **Web app uses Tailwind v4**: Uses `@tailwindcss/vite` plugin (not PostCSS). Import via `@import "tailwindcss"` in CSS.
- **Two separate `node_modules`**: Root and `web/` have independent `package.json` files and dependencies. Run `npm install` in both.
