import 'dotenv/config';
import { loadConfig, validateConfig } from './config/index.js';
import { initLogger, getLogger } from './logging/index.js';
import { PlanStore } from './storage/index.js';
import { PlanValidator } from './validator/index.js';
import { DiscordBuilder } from './builder/index.js';
import { createProvider } from './providers/index.js';
import {
  createDiscordClient,
  loginDiscord,
  shutdownDiscord,
  CommandRegistrar,
} from './discord/index.js';
import { createAllCommands } from './commands/index.js';
import {
  InteractionRouter,
  ConfirmBuildHandler,
  CancelBuildHandler,
} from './interactions/index.js';
import type { CommandDependencies } from './commands/command.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = initLogger(config.log.level);

  logger.info('DCServerForge starting', {
    env: config.nodeEnv,
    provider: config.ai.provider,
    logLevel: config.log.level,
  });

  const configIssues = validateConfig(config);
  if (configIssues.length > 0) {
    logger.warn('Configuration issues detected', { issues: configIssues });
  }

  const store = new PlanStore(config.storage.dir);
  await store.init();

  const validator = new PlanValidator();
  const provider = createProvider(config.ai);
  const client = createDiscordClient();
  const builder = new DiscordBuilder(client);

  const deps: CommandDependencies = { config, store, validator, builder, provider };

  const commands = createAllCommands();
  const commandMap = new Map(commands.map((c) => [c.name, c]));

  const interactionRouter = new InteractionRouter();
  interactionRouter.register(new ConfirmBuildHandler());
  interactionRouter.register(new CancelBuildHandler());

  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const command = commandMap.get(interaction.commandName);
        if (command) {
          await command.execute(interaction, deps);
        } else {
          await interaction.reply({
            content: `Unknown command: ${interaction.commandName}`,
            ephemeral: true,
          });
        }
      } else if (interaction.isButton()) {
        await interactionRouter.routeButton(interaction, deps);
      } else if (interaction.isModalSubmit()) {
        await interactionRouter.routeModal(interaction, deps);
      } else if (interaction.isStringSelectMenu()) {
        await interactionRouter.routeSelectMenu(interaction, deps);
      }
    } catch (err) {
      logger.error('Interaction handling error', err as Error, {
        interactionId: interaction.id,
        type: interaction.type,
      });
      if (interaction.isRepliable() && !interaction.replied) {
        await interaction
          .reply({ content: 'An error occurred while processing your request.', ephemeral: true })
          .catch(() => {});
      }
    }
  });

  const registrar = new CommandRegistrar(config);
  const commandData = commands.map((c) => c.data);

  await loginDiscord(client, config);

  if (config.discord.guildId) {
    await registrar.registerGuild(commandData, config.discord.guildId);
    logger.info('Commands registered to guild', { guildId: config.discord.guildId });
  } else {
    await registrar.registerGlobal(commandData);
    logger.info('Commands registered globally');
  }

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down...`);
    await shutdownDiscord(client);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  logger.info('DCServerForge is ready');
}

main().catch((err) => {
  const logger = getLogger();
  logger.error('Fatal startup error', err as Error);
  process.exit(1);
});
