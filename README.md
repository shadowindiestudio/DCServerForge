# DCServerForge

> Build complete Discord servers from natural language prompts.

DCServerForge is an open-source, AI-assisted tool that generates and builds Discord server structures from simple text descriptions.

Instead of manually creating categories, channels, roles, and permissions, describe your community in plain English, review the generated blueprint, and let DCServerForge build it for you.

---

## Features

- Discord-native: all interaction via slash commands, buttons, modals, and embeds
- Discord OAuth authentication (bot token)
- Natural language prompt input
- AI-generated server blueprint (Forge Plan)
- Blueprint validation
- Automatic creation of categories, text channels, voice channels, forum channels, roles
- Build progress tracking
- Provider-agnostic AI integration (NVIDIA, Ollama, OpenAI, custom)
- Dry-run mode for safe simulation
- Local plan storage and retrieval
- Diff engine for comparing plan versions

---

## Architecture

```
Prompt → AI Provider → Blueprint JSON → Validator → Discord Builder → Discord API
```

The AI **never directly interacts with the Discord API**. Its only responsibility is generating a structured blueprint (Forge Plan).

### Module Overview

| Module | Purpose |
|--------|---------|
| `src/types` | Shared TypeScript types, enums, constants |
| `src/forge-plan` | Forge Plan models, Zod schemas, serialization |
| `src/config` | Environment configuration loading and validation |
| `src/logging` | Centralized structured logging |
| `src/storage` | Local filesystem plan persistence |
| `src/providers` | AI provider abstraction (NVIDIA, Ollama, OpenAI, custom) |
| `src/validator` | Forge Plan validation framework with pluggable rules |
| `src/builder` | Discord deployment engine with progress tracking |
| `src/diff` | Diff engine for comparing Forge Plans |
| `src/discord` | Discord.js client, command registration, embed helpers |
| `src/commands` | Slash command framework and implementations |
| `src/interactions` | Button, modal, and select menu routing |
| `src/utils` | Shared utilities |

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- A Discord bot application with a token
- An AI provider API key (or local Ollama instance)

### Installation

```bash
git clone https://github.com/shadowindiestudio/DCServerForge.git
cd DCServerForge
npm install
```

### Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Application Client ID |
| `AI_PROVIDER` | One of: `nvidia`, `ollama`, `openai`, `custom` |
| `AI_API_KEY` | API key (required for NVIDIA, OpenAI) |

Optional variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DISCORD_GUILD_ID` | — | Guild ID for instant command registration |
| `BOT_OWNER_ID` | — | Bot owner user ID |
| `AI_BASE_URL` | provider default | Custom API base URL |
| `AI_MODEL` | provider default | Model name override |
| `AI_TIMEOUT_MS` | `30000` | Request timeout in milliseconds |
| `STORAGE_DIR` | `./data` | Plan storage directory |
| `LOG_LEVEL` | `info` | Log level: debug, info, warn, error, silent |

### Running

```bash
npm run dev    # Development with hot reload
npm run build  # Production build
npm start      # Run production build
```

### Docker

```bash
docker compose up -d
```

---

## Slash Commands

| Command | Description |
|---------|-------------|
| `/ping` | Check bot latency and status |
| `/status` | Show bot configuration and status |
| `/generate` | Generate a Forge Plan from a text description |
| `/validate` | Validate a stored Forge Plan |
| `/build` | Build a Forge Plan into the current server (supports dry-run) |
| `/plans` | List all stored Forge Plans |
| `/show` | Display details of a specific Forge Plan |

---

## Development

```bash
npm run lint        # Run ESLint
npm run lint:fix    # Fix lint issues
npm run format       # Format with Prettier
npm run typecheck    # TypeScript type checking
npm test             # Run tests
npm run test:watch   # Watch mode tests
npm run test:coverage # Coverage report
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

> Build once. Customize forever.
