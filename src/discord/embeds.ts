import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
  type ColorResolvable,
} from 'discord.js';
import { PlanStatus } from '../types/enums.js';

const ACCENT_COLOR: ColorResolvable = 0x00aeef;
const SUCCESS_COLOR: ColorResolvable = 0x57f287;
const WARNING_COLOR: ColorResolvable = 0xfee75c;
const ERROR_COLOR: ColorResolvable = 0xed4245;

export function createInfoEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(title).setColor(ACCENT_COLOR).setTimestamp();
  if (description) embed.setDescription(description);
  return embed;
}

export function createSuccessEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(title).setColor(SUCCESS_COLOR).setTimestamp();
  if (description) embed.setDescription(description);
  return embed;
}

export function createWarningEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(title).setColor(WARNING_COLOR).setTimestamp();
  if (description) embed.setDescription(description);
  return embed;
}

export function createErrorEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(title).setColor(ERROR_COLOR).setTimestamp();
  if (description) embed.setDescription(description);
  return embed;
}

export function createPlanSummaryEmbed(planName: string, planDescription: string | undefined, status: PlanStatus, roleCount: number, categoryCount: number, channelCount: number): EmbedBuilder {
  const statusEmoji: Record<PlanStatus, string> = {
    [PlanStatus.DRAFT]: '📝',
    [PlanStatus.VALIDATED]: '✅',
    [PlanStatus.BUILDING]: '🔨',
    [PlanStatus.COMPLETED]: '🎉',
    [PlanStatus.FAILED]: '❌',
  };

  return new EmbedBuilder()
    .setTitle(`${statusEmoji[status]} ${planName}`)
    .setDescription(planDescription ?? 'No description provided')
    .addFields(
      { name: 'Status', value: status, inline: true },
      { name: 'Roles', value: roleCount.toString(), inline: true },
      { name: 'Categories', value: categoryCount.toString(), inline: true },
      { name: 'Channels', value: channelCount.toString(), inline: true },
    )
    .setColor(ACCENT_COLOR)
    .setTimestamp();
}

export async function replyEphemeral(
  interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction,
  content: string,
): Promise<void> {
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp({ content, ephemeral: true });
  } else {
    await interaction.reply({ content, ephemeral: true });
  }
}

export async function replyError(
  interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction,
  title: string,
  description: string,
): Promise<void> {
  const embed = createErrorEmbed(title, description);
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp({ embeds: [embed], ephemeral: true });
  } else {
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
