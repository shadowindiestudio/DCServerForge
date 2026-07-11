import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, CommandDependencies } from '../command.js';
import { createInfoEmbed } from '../../discord/embeds.js';

export class PingCommand implements SlashCommand {
  readonly name = 'ping';
  readonly description = 'Check bot latency and status.';

  readonly data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .toJSON();

  async execute(
    interaction: ChatInputCommandInteraction,
    _deps: CommandDependencies,
  ): Promise<void> {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = createInfoEmbed('Pong!', `**Bot Latency:** ${latency}ms`);
    await interaction.editReply({ content: null, embeds: [embed] });
  }
}
