# Aster

AI-powered Slack assistant with an easy skill system for companies. Teams can add custom "skills" — specialized knowledge and instructions — that shape how Aster responds, making it a configurable AI teammate.

## Features

- **Custom Skills** — Add, update, remove, and search domain-specific skills per workspace
- **AI-Powered Responses** — Uses OpenAI (GPT-4o) with skill-aware context
- **Slack Native** — Slash commands, modals, @mentions, and DMs via Bolt SDK
- **Multi-Tenant** — Skills are isolated per Slack workspace
- **Persistent Storage** — SQLite database for skill persistence

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your Slack and OpenAI credentials

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
npm start
```

## Slack App Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app
2. Enable **Socket Mode** and generate an App-Level Token (`xapp-...`)
3. Add the `/aster` slash command
4. Subscribe to bot events: `app_mention`, `message.im`
5. Add bot scopes: `chat:write`, `commands`, `app_mentions:read`, `im:history`
6. Install the app to your workspace and copy the Bot Token (`xoxb-...`)

## Commands

| Command | Description |
|---------|-------------|
| `/aster ask <question>` | Ask Aster a question (uses all configured skills) |
| `/aster skill add` | Opens a modal to add a new skill |
| `/aster skill list` | Lists all skills for the workspace |
| `/aster skill info <name>` | View details of a specific skill |
| `/aster skill remove <name>` | Remove a skill |
| `/aster help` | Show available commands |

## What is a Skill?

A skill is a set of instructions and knowledge that customizes how Aster responds. For example:

- **Code Review Expert** — Instructions for reviewing code, what to look for, team standards
- **Onboarding Guide** — Steps for new employee onboarding, links, contacts
- **Deploy Process** — Your team's specific deployment checklist

Skills are added via a Slack modal with fields for name, description, instructions, and optional examples.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SLACK_BOT_TOKEN` | Yes | — | Bot User OAuth Token (`xoxb-...`) |
| `SLACK_APP_TOKEN` | Yes | — | App-Level Token (`xapp-...`) |
| `SLACK_SIGNING_SECRET` | Yes | — | Signing Secret from app settings |
| `OPENAI_API_KEY` | Yes | — | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o` | OpenAI model to use |
| `DATABASE_PATH` | No | `./data/aster.db` | SQLite database file path |
| `LOG_LEVEL` | No | `info` | Log level (debug/info/warn/error) |

## Project Structure

```
src/
├── app.ts                          # Entry point, Bolt app initialization
├── config.ts                       # Environment config loader
├── types/index.ts                  # TypeScript types and Zod schemas
├── services/
│   ├── store.ts                    # SQLite persistence layer
│   ├── skills.ts                   # Skill business logic
│   └── ai.ts                       # OpenAI integration
└── listeners/
    ├── commands/aster.ts           # /aster slash command handler
    ├── views/skill-modal.ts        # Modal UI and submission handler
    └── messages/index.ts           # @mention and DM handlers

tests/
├── services/                       # Unit tests for services
├── listeners/                      # Command flow tests
├── views/                          # Modal structure tests
├── integration/use-cases.test.ts   # Multi-scenario integration tests
├── e2e/demo.test.ts                # 17-step end-to-end workflow demo
└── config.test.ts                  # Configuration tests
```

## Development

```bash
npm run dev          # Start with hot-reload (tsx watch)
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run build        # TypeScript compile
```

## License

MIT
