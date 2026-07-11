import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, CommandDependencies } from '../command.js';
import { createInfoEmbed, replyEphemeral } from '../../discord/embeds.js';

export class StatusCommand implements SlashCommand {
  readonly name = 'status';
  readonly description = 'Show DCServerForge bot status and configuration.';

  readonly data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .toJSON();

  async execute(
    interaction: ChatInputCommandInteraction,
    deps: CommandDependencies,
  ): Promise<void> {
    if (!interaction.guild) {
      await replyEphemeral(interaction, 'This command can only be used in a server.');
      return;
    }

    const embed = createInfoEmbed(
      'DCServerForge Status',
      'Current bot configuration and status.',
    ).addFields(
      { name: 'AI Provider', value: deps.config.ai.provider, inline: true },
      { name: 'AI Model', value: deps.config.ai.model ?? 'default', inline: true },
      { name: 'Storage Dir', value: deps.config.storage.dir, inline: true },
      { name: 'Log Level', value: deps.config.log.level, inline: true },
      { name: 'Environment', value: deps.config.nodeEnv, inline: true },
      {
        name: 'AI Configured',
        value: deps.provider.validateConfig() ? 'Yes' : 'No',
        inline: true,
      },
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
