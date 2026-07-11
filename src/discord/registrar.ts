import { REST, Routes, type RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import type { AppConfig } from '../types/index.js';
import { getLogger } from '../logging/index.js';

export class CommandRegistrar {
  private readonly rest: REST;
  private readonly clientId: string;
  private readonly logger = getLogger();

  constructor(config: AppConfig) {
    this.rest = new REST({ version: '10' }).setToken(config.discord.token);
    this.clientId = config.discord.clientId;
  }

  async registerGlobal(commands: RESTPostAPIApplicationCommandsJSONBody[]): Promise<void> {
    this.logger.info('Registering global slash commands', { count: commands.length });
    await this.rest.put(Routes.applicationCommands(this.clientId), { body: commands });
    this.logger.info('Global slash commands registered');
  }

  async registerGuild(
    commands: RESTPostAPIApplicationCommandsJSONBody[],
    guildId: string,
  ): Promise<void> {
    this.logger.info('Registering guild slash commands', { count: commands.length, guildId });
    await this.rest.put(Routes.applicationGuildCommands(this.clientId, guildId), {
      body: commands,
    });
    this.logger.info('Guild slash commands registered', { guildId });
  }

  async clearGuildCommands(guildId: string): Promise<void> {
    this.logger.info('Clearing guild commands', { guildId });
    await this.rest.put(Routes.applicationGuildCommands(this.clientId, guildId), { body: [] });
    this.logger.info('Guild commands cleared', { guildId });
  }

  async clearGlobalCommands(): Promise<void> {
    this.logger.info('Clearing global commands');
    await this.rest.put(Routes.applicationCommands(this.clientId), { body: [] });
    this.logger.info('Global commands cleared');
  }
}
