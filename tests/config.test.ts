import { describe, it, expect } from 'vitest';
import { loadConfig, validateConfig } from '../src/config/loader.js';
import { AIProvider, LogLevel } from '../src/types/enums.js';

describe('Config Loader', () => {
  it('loads valid config', () => {
    const config = loadConfig({
      DISCORD_TOKEN: 'test_token',
      DISCORD_CLIENT_ID: 'test_client_id',
      AI_PROVIDER: 'nvidia',
      AI_API_KEY: 'test_key',
      STORAGE_DIR: './data',
      LOG_LEVEL: 'info',
      NODE_ENV: 'test',
    });

    expect(config.discord.token).toBe('test_token');
    expect(config.discord.clientId).toBe('test_client_id');
    expect(config.ai.provider).toBe(AIProvider.NVIDIA);
    expect(config.log.level).toBe(LogLevel.INFO);
  });

  it('throws on missing required fields', () => {
    expect(() => loadConfig({})).toThrow();
  });

  it('applies defaults for optional fields', () => {
    const config = loadConfig({
      DISCORD_TOKEN: 'token',
      DISCORD_CLIENT_ID: 'client_id',
    });
    expect(config.ai.provider).toBe(AIProvider.NVIDIA);
    expect(config.ai.timeoutMs).toBe(30000);
    expect(config.storage.dir).toBe('./data');
    expect(config.log.level).toBe(LogLevel.INFO);
  });

  it('validates config and returns issues', () => {
    const config = loadConfig({
      DISCORD_TOKEN: 'token',
      DISCORD_CLIENT_ID: 'client_id',
      AI_PROVIDER: 'nvidia',
    });
    const issues = validateConfig(config);
    expect(issues).toContain('ai.apiKey is required for NVIDIA provider');
  });
});
