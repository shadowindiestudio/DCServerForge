import { z } from 'zod';
import { AIProvider, LogLevel } from '../types/enums.js';
import type { AppConfig } from '../types/index.js';

export class ConfigError extends Error {
  constructor(
    message: string,
    readonly missing: string[] = [],
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_GUILD_ID: z.string().optional(),
  BOT_OWNER_ID: z.string().optional(),

  AI_PROVIDER: z
    .enum(['nvidia', 'ollama', 'openai', 'custom'])
    .optional()
    .transform((v) => (v ? (v as AIProvider) : AIProvider.NVIDIA)),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().optional(),
  AI_MODEL: z.string().optional(),
  AI_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 30000)),

  STORAGE_DIR: z.string().optional().default('./data'),
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error', 'silent'])
    .optional()
    .transform((v) => (v ? (v as LogLevel) : LogLevel.INFO)),

  NODE_ENV: z.string().optional().default('development'),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const missing = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new ConfigError('Environment configuration validation failed', missing);
  }

  const e = result.data;

  return {
    discord: {
      token: e.DISCORD_TOKEN,
      clientId: e.DISCORD_CLIENT_ID,
      guildId: e.DISCORD_GUILD_ID,
      ownerId: e.BOT_OWNER_ID,
    },
    ai: {
      provider: e.AI_PROVIDER,
      apiKey: e.AI_API_KEY,
      baseUrl: e.AI_BASE_URL,
      model: e.AI_MODEL,
      timeoutMs: e.AI_TIMEOUT_MS,
    },
    storage: {
      dir: e.STORAGE_DIR,
    },
    log: {
      level: e.LOG_LEVEL,
    },
    nodeEnv: e.NODE_ENV,
  };
}

export function validateConfig(config: AppConfig): string[] {
  const issues: string[] = [];

  if (!config.discord.token) issues.push('discord.token is required');
  if (!config.discord.clientId) issues.push('discord.clientId is required');

  if (config.ai.provider === AIProvider.NVIDIA && !config.ai.apiKey) {
    issues.push('ai.apiKey is required for NVIDIA provider');
  }
  if (config.ai.provider === AIProvider.OPENAI && !config.ai.apiKey) {
    issues.push('ai.apiKey is required for OpenAI provider');
  }

  if (config.ai.timeoutMs && config.ai.timeoutMs < 1000) {
    issues.push('ai.timeoutMs must be at least 1000ms');
  }

  return issues;
}
