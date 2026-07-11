import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, CommandDependencies } from '../command.js';
import { createSuccessEmbed, createErrorEmbed, replyEphemeral } from '../../discord/embeds.js';
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
        const embed = createErrorEmbed('Plan Not Found', `No plan found with ID: \`${planId}\``);
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const plan = await deps.store.load(planId);
      const validation = deps.validator.validate(plan);

      if (!validation.valid && !dryRun) {
        const embed = createErrorEmbed(
          'Plan Not Validated',
          'The plan has validation errors. Run `/validate` first or fix the issues before building.',
        );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      logger.info('Starting build', { planName: plan.name });
      const result = await deps.builder.build(plan, interaction.guildId!, { dryRun });

      if (result.success) {
        const successCount = result.steps.filter((s) => s.success).length;
        const failCount = result.steps.filter((s) => !s.success).length;
        const embed = createSuccessEmbed(
          dryRun ? 'Dry Run Complete' : 'Build Complete',
          `Plan \`${plan.name}\` ${dryRun ? 'simulated' : 'deployed'} with ${successCount} successful step(s)${failCount > 0 ? ` and ${failCount} failure(s)` : ''}.`,
        );
        await interaction.editReply({ embeds: [embed] });
        logger.info('Build completed', { successCount, failCount });
      } else {
        const embed = createErrorEmbed(
          'Build Failed',
          result.error ?? 'Unknown error during build.',
        );
        await interaction.editReply({ embeds: [embed] });
        logger.error('Build failed', new Error(result.error ?? 'Unknown'));
      }
    } catch (err) {
      logger.error('Build command failed', err as Error);
      const embed = createErrorEmbed('Build Error', (err as Error).message);
      await interaction.editReply({ embeds: [embed] });
    }
  }
}
