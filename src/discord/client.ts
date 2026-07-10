import { Client, GatewayIntentBits, Partials } from 'discord.js';
import type { AppConfig } from '../types/index.js';
import { getLogger } from '../logging/index.js';

const REQUIRED_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageTyping,
];

export function createDiscordClient(): Client {
  const logger = getLogger();

  const client = new Client({
    intents: REQUIRED_INTENTS,
    partials: [Partials.Channel, Partials.GuildMember, Partials.Message],
    allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
  });

  client.once('ready', (c) => {
    logger.info('Discord client connected', {
      tag: c.user.tag,
      id: c.user.id,
      guilds: c.guilds.cache.size,
    });
  });

  client.on('error', (error) => {
    logger.error('Discord client error', error);
  });

  client.on('warn', (message) => {
    logger.warn(`Discord client warning: ${message}`);
  });

  client.on('debug', (message) => {
    logger.debug(`Discord debug: ${message}`);
  });

  return client;
}

export async function loginDiscord(client: Client, config: AppConfig): Promise<void> {
  const logger = getLogger();
  logger.info('Connecting to Discord gateway...');
  await client.login(config.discord.token);
}

export async function shutdownDiscord(client: Client): Promise<void> {
  const logger = getLogger();
  logger.info('Disconnecting from Discord gateway...');
  await client.destroy();
  logger.info('Discord client destroyed');
}

export { REQUIRED_INTENTS };
