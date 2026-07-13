import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
  type ColorResolvable,
} from 'discord.js';
import { PlanStatus, BuildPhase } from '../types/enums.js';
import type { BuildProgress, BuildSummary } from '../types/index.js';

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

export function createPlanSummaryEmbed(
  planName: string,
  planDescription: string | undefined,
  status: PlanStatus,
  roleCount: number,
  categoryCount: number,
  channelCount: number,
): EmbedBuilder {
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

const PHASE_LABEL: Record<BuildPhase, string> = {
  [BuildPhase.ROLES]: 'Roles',
  [BuildPhase.CATEGORIES]: 'Categories',
  [BuildPhase.CHANNELS]: 'Channels',
  [BuildPhase.PERMISSIONS]: 'Permission Overwrites',
  [BuildPhase.CLEANUP]: 'Cleanup',
};

const PHASE_ORDER: BuildPhase[] = [
  BuildPhase.ROLES,
  BuildPhase.CATEGORIES,
  BuildPhase.CHANNELS,
  BuildPhase.PERMISSIONS,
];

/**
 * Builds a live progress embed updated on each ProgressCallback tick.
 * Shows current phase, percent complete, operation counts, and elapsed time.
 */
export function createProgressEmbed(
  planName: string,
  progress: BuildProgress,
  startedAt: number,
  created: number,
  skipped: number,
  failed: number,
): EmbedBuilder {
  const elapsedMs = Date.now() - startedAt;
  const elapsedSec = (elapsedMs / 1000).toFixed(1);

  // Overall progress bar across all phases.
  const phaseIndex = PHASE_ORDER.indexOf(progress.phase);
  const totalPhases = PHASE_ORDER.length;
  // Within-phase percent, clamped to [0, 1].
  const withinPhase =
    progress.total > 0 ? Math.min(progress.completed / progress.total, 1) : 0;
  const overallFraction = (phaseIndex + withinPhase) / totalPhases;
  const pct = Math.round(overallFraction * 100);
  const barFilled = Math.round(overallFraction * 20);
  const bar = '█'.repeat(barFilled) + '░'.repeat(20 - barFilled);

  const phaseLines = PHASE_ORDER.map((p) => {
    if (p === progress.phase) return `▶ **${PHASE_LABEL[p]}** — ${progress.currentEntity}`;
    if (PHASE_ORDER.indexOf(p) < phaseIndex) return `✓ ${PHASE_LABEL[p]}`;
    return `○ ${PHASE_LABEL[p]}`;
  }).join('\n');

  return new EmbedBuilder()
    .setTitle(`Building: ${planName}`)
    .setDescription(`\`${bar}\` ${pct}%`)
    .addFields(
      { name: 'Phase', value: phaseLines, inline: false },
      { name: 'Created', value: created.toString(), inline: true },
      { name: 'Skipped', value: skipped.toString(), inline: true },
      { name: 'Failed', value: failed.toString(), inline: true },
      { name: 'Elapsed', value: `${elapsedSec}s`, inline: true },
    )
    .setColor(WARNING_COLOR)
    .setTimestamp();
}

/**
 * Final embed shown after the build finishes, replacing the progress embed.
 * Includes per-entity skipped list when relevant.
 */
export function createBuildSummaryEmbed(
  planName: string,
  success: boolean,
  dryRun: boolean,
  summary: BuildSummary,
  skippedMessages: readonly string[],
): EmbedBuilder {
  const color: ColorResolvable = success ? SUCCESS_COLOR : ERROR_COLOR;
  const icon = dryRun ? '🔍' : success ? '🎉' : '❌';
  const verb = dryRun ? 'Dry Run Complete' : success ? 'Build Complete' : 'Build Failed';

  const embed = new EmbedBuilder()
    .setTitle(`${icon} ${verb}: ${planName}`)
    .addFields(
      { name: 'Created', value: summary.created.toString(), inline: true },
      { name: 'Skipped', value: summary.skipped.toString(), inline: true },
      { name: 'Failed', value: summary.failed.toString(), inline: true },
      { name: 'Total Steps', value: summary.total.toString(), inline: true },
      { name: 'Elapsed', value: `${(summary.elapsedMs / 1000).toFixed(1)}s`, inline: true },
    )
    .setColor(color)
    .setTimestamp();

  if (skippedMessages.length > 0) {
    const list = skippedMessages
      .slice(0, 10)
      .map((m) => `• ${m}`)
      .join('\n');
    const suffix = skippedMessages.length > 10 ? `\n…and ${skippedMessages.length - 10} more` : '';
    embed.addFields({ name: 'Skipped Resources', value: list + suffix, inline: false });
  }

  return embed;
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
  interaction:
    | ChatInputCommandInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction
    | ModalSubmitInteraction,
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
