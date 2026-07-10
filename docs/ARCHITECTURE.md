# Architecture

## Overview

DCServerForge follows a strict separation between AI generation and Discord API interaction.

```
User Prompt (Discord slash command)
      │
      ▼
AI Provider (generates JSON blueprint)
      │
      ▼
Forge Plan (validated data model)
      │
      ▼
Validator (schema + business rules)
      │
      ▼
Discord Builder (creates entities via Discord.js)
      │
      ▼
Discord API
```

## Key Principles

1. **AI never touches Discord API** — The AI provider's sole responsibility is producing a Forge Plan JSON. All Discord operations go through the Builder.

2. **Provider-agnostic** — AI providers implement a common interface. New providers can be added without touching any other module.

3. **Validation before execution** — Every plan must pass validation before the builder will execute it (unless dry-run mode is used).

4. **Discord-native UI** — All user interaction happens through Discord slash commands, buttons, modals, and embeds. No web dashboard.

5. **Modular and extensible** — Each module has clear interfaces and extension points.

## Module Dependencies

```
src/index.ts
  ├── config/        (environment loading)
  ├── logging/       (structured logging)
  ├── storage/       (plan persistence)
  ├── providers/     (AI abstraction)
  ├── validator/     (plan validation)
  ├── builder/       (Discord deployment)
  ├── diff/          (plan comparison)
  ├── discord/       (client, registrar, embeds)
  ├── commands/      (slash commands)
  └── interactions/  (button/modal/select routing)
```

## Extension Points

### AI Providers

Implement `AIProviderInterface` or extend `BaseProvider`:

```typescript
class MyProvider extends BaseProvider {
  readonly name = 'my-provider';
  protected get defaultBaseUrl() { return 'https://api.example.com/v1'; }
  protected get defaultModel() { return 'my-model'; }
  validateConfig(): boolean { return true; }
  async generatePlan(request: AIRequest): Promise<AIResponse> { ... }
  async chat(messages: ChatMessage[], options?: ProviderChatOptions): Promise<AIResponse> { ... }
}
```

Register in `src/providers/base/base-provider.ts` `createProvider()`.

### Validation Rules

Implement `ValidationRule` and add to the validator:

```typescript
class MyRule implements ValidationRule {
  readonly id = 'my-rule';
  readonly description = 'My custom validation';
  run(plan: ForgePlan): ValidationDiagnostic[] { ... }
}

validator.addRule(new MyRule());
```

### Slash Commands

Implement `SlashCommand` and register in `src/commands/index.ts`:

```typescript
class MyCommand implements SlashCommand {
  readonly name = 'my-command';
  readonly description = 'Does something';
  readonly data = new SlashCommandBuilder()...toJSON();
  async execute(interaction, deps) { ... }
}
```

### Interaction Handlers

Implement `InteractionHandler` and register with the `InteractionRouter`:

```typescript
class MyHandler implements InteractionHandler {
  readonly customIdPrefix = 'my_action:';
  async handleButton(interaction, deps) { ... }
}
```

## Data Flow

1. User invokes `/generate` with a text prompt
2. Command handler calls `provider.generatePlan()`
3. AI provider returns JSON text
4. `deserializePlan()` parses and validates the JSON shape
5. Plan is stored via `PlanStore.save()`
6. User invokes `/validate` to check business rules
7. User invokes `/build` to deploy
8. `DiscordBuilder.build()` creates roles, categories, channels in order
9. Progress callbacks update the user via ephemeral messages
