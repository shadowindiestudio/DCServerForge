import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, CommandDependencies } from '../command.js';
import {
  createErrorEmbed,
  replyEphemeral,
  createProgressEmbed,
  createBuildSummaryEmbed,
} from '../../discord/embeds.js';
import type { BuildProgress, BuildSummary, BuildStepResult } from '../../types/index.js';
import { getLogger } from '../../logging/index.js';

export class BuildCommand implements SlashCommand {
  readonly name = 'build';
  readonly description = 'Build a validated Forge Plan into the current Discord server.';

  readonly data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((opt) =>
      opt.setName('plan-id').setDescription('The Forge Plan ID to build.').setRequired(true),
    )
    .addBooleanOption((opt) =>
      opt
        .setName('dry-run')
        .setDescription('Simulate the build without making changes.')
        .setRequired(false),
    )
    .toJSON();

  async execute(
    interaction: ChatInputCommandInteraction,
    deps: CommandDependencies,
  ): Promise<void> {
    if (!interaction.guild) {
      await replyEphemeral(interaction, 'This command can only be used in a server.');
      return;
    }

    const planId = interaction.options.getString('plan-id', true);
    const dryRun = interaction.options.getBoolean('dry-run') ?? false;
    const logger = getLogger().child({ command: 'build', planId, dryRun });

    await interaction.deferReply({ ephemeral: true });

    try {
      const exists = await deps.store.exists(planId);
      if (!exists) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Plan Not Found', `No plan found with ID: \`${planId}\``)],
        });
        return;
      }

      const plan = await deps.store.load(planId);
      const validation = deps.validator.validate(plan);

      if (!validation.valid && !dryRun) {
        await interaction.editReply({
          embeds: [
            createErrorEmbed(
              'Plan Not Validated',
              'The plan has validation errors. Run `/validate` first or fix the issues before building.',
            ),
          ],
        });
        return;
      }

      logger.info('Starting build', { planName: plan.name });

      // Track live counters updated by the progress callback.
      const startedAt = Date.now();
      let created = 0;
      let skipped = 0;
      let failed = 0;
      let lastProgress: BuildProgress | null = null;

      // Debounce Discord edits: Discord rate-limits message edits to ~5/5s per channel.
      // We send at most one update every 2.5 seconds to stay well within limits.
      let pendingUpdate: ReturnType<typeof setTimeout> | null = null;

      const flushProgressUpdate = async (progress: BuildProgress): Promise<void> => {
        try {
          await interaction.editReply({
            embeds: [
              createProgressEmbed(plan.name, progress, startedAt, created, skipped, failed),
            ],
          });
        } catch {
          // Silently swallow edit errors (interaction may have expired).
        }
      };

      const scheduleProgressUpdate = (progress: BuildProgress): void => {
        lastProgress = progress;
        if (pendingUpdate !== null) return;
        pendingUpdate = setTimeout(() => {
          pendingUpdate = null;
          if (lastProgress) void flushProgressUpdate(lastProgress);
        }, 2500);
      };

      const onProgress = (progress: BuildProgress): void => {
        const step = progress.stepResult;
        if (step) {
          if (step.skipped) skipped++;
          else if (!step.success) failed++;
          else created++;
        }
        scheduleProgressUpdate(progress);
      };

      // Send the initial progress embed immediately so the user sees activity.
      if (plan.roles.length > 0 || plan.categories.length > 0) {
        const firstPhase = plan.roles.length > 0 ? 'roles' : 'categories';
        try {
          await interaction.editReply({
            embeds: [
              createProgressEmbed(
                plan.name,
                {
                  planId: plan.id,
                  phase: firstPhase as BuildProgress['phase'],
                  completed: 0,
                  total:
                    firstPhase === 'roles' ? plan.roles.length : plan.categories.length,
                  currentEntity: 'Starting…',
                },
                startedAt,
                0,
                0,
                0,
              ),
            ],
          });
        } catch {
          // Non-fatal if initial paint fails.
        }
      }

      const result = await deps.builder.build(plan, interaction.guildId!, { dryRun }, onProgress);

      // Cancel any pending debounced update — we're about to replace with final summary.
      if (pendingUpdate !== null) {
        clearTimeout(pendingUpdate);
        pendingUpdate = null;
      }

      const elapsedMs = Date.now() - startedAt;

      // Recount from authoritative result steps to stay in sync.
      const finalCreated = result.steps.filter((s) => !s.skipped && s.success).length;
      const finalSkipped = result.steps.filter((s) => s.skipped === true).length;
      const finalFailed = result.steps.filter((s) => !s.success && !s.skipped).length;

      const summary: BuildSummary = {
        total: result.steps.length,
        created: finalCreated,
        skipped: finalSkipped,
        failed: finalFailed,
        elapsedMs,
      };

      const skippedMessages = result.steps
        .filter((s): s is BuildStepResult & { skipped: true } => s.skipped === true)
        .map((s) => s.message);

      await interaction.editReply({
        embeds: [createBuildSummaryEmbed(plan.name, result.success, dryRun, summary, skippedMessages)],
      });

      logger.info('Build finished', {
        success: result.success,
        created: finalCreated,
        skipped: finalSkipped,
        failed: finalFailed,
        elapsedMs,
      });
    } catch (err) {
      logger.error('Build command failed', err as Error);
      try {
        await interaction.editReply({
          embeds: [createErrorEmbed('Build Error', (err as Error).message)],
        });
      } catch {
        // Interaction may have already expired.
      }
    }
  }
}
