# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Aster is a Slack bot (TypeScript/Node.js) that provides AI-powered answers augmented by custom "skills" per workspace. Built with Slack Bolt SDK (Socket Mode), OpenAI API, and SQLite (better-sqlite3).

### Dev commands

All standard commands are in `package.json` scripts. Key ones:

- `npm run dev` — start with hot-reload (requires valid Slack + OpenAI credentials in `.env`)
- `npm test` — run all 79 tests (Vitest)
- `npm run lint` — ESLint
- `npm run build` — TypeScript compile to `dist/`

### Non-obvious caveats

- **Dev server requires real credentials**: `npm run dev` connects to Slack via Socket Mode; it will fail with `invalid_auth` if tokens are dummy values. Tests use mocked OpenAI so they run without credentials.
- **SQLite auto-creates**: The database and `data/` directory are created automatically on first run. No migration step needed.
- **Test isolation**: Each test file creates/destroys its own SQLite database in `tests/.test-data/`. These are gitignored.
- **OpenAI mock pattern**: Tests mock the `openai` module with a class-based mock (not function-based). See `tests/services/ai.test.ts` for the pattern.
