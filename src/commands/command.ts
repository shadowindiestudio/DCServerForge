import type {
  ChatInputCommandInteraction,
  RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';
import type { AppConfig } from '../types/index.js';
import type { PlanStore } from '../storage/index.js';
import type { PlanValidator } from '../validator/index.js';
import type { DiscordBuilderInterface } from '../builder/interfaces.js';
import type { AIProviderInterface } from '../providers/base/base-provider.js';

export interface CommandDependencies {
  readonly config: AppConfig;
  readonly store: PlanStore;
  readonly validator: PlanValidator;
  readonly builder: DiscordBuilderInterface;
  readonly provider: AIProviderInterface;
}

export interface SlashCommand {
  readonly name: string;
  readonly description: string;
  readonly data: RESTPostAPIApplicationCommandsJSONBody;
  execute(interaction: ChatInputCommandInteraction, deps: CommandDependencies): Promise<void>;
}
