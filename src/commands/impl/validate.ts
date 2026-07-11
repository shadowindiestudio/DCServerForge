import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, CommandDependencies } from '../command.js';
import { createSuccessEmbed, createErrorEmbed, replyEphemeral } from '../../discord/embeds.js';
import { getLogger } from '../../logging/index.js';

export class ValidateCommand implements SlashCommand {
  readonly name = 'validate';
  readonly description = 'Validate a stored Forge Plan.';

  readonly data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((opt) =>
      opt.setName('plan-id').setDescription('The Forge Plan ID to validate.').setRequired(true),
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
    const logger = getLogger().child({ command: 'validate', planId });

    await interaction.deferReply({ ephemeral: true });

    try {
      const exists = await deps.store.exists(planId);
      if (!exists) {
        const embed = createErrorEmbed('Plan Not Found', `No plan found with ID: \`${planId}\``);
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const plan = await deps.store.load(planId);
      const result = deps.validator.validate(plan);

      if (result.valid) {
        const embed = createSuccessEmbed(
          'Plan Valid',
          `Plan \`${plan.name}\` passed all validation checks with ${result.diagnostics.length} warnings.`,
        );
        await interaction.editReply({ embeds: [embed] });
      } else {
        const errors = result.diagnostics
          .filter((d) => d.severity === 'error')
          .map((d) => `• [${d.code}] ${d.path}: ${d.message}`)
          .join('\n')
          .slice(0, 1024);

        const warnings = result.diagnostics
          .filter((d) => d.severity === 'warning')
          .map((d) => `• [${d.code}] ${d.path}: ${d.message}`)
          .join('\n')
          .slice(0, 1024);

        const embed = createErrorEmbed(
          'Plan Invalid',
          `Found ${result.diagnostics.filter((d) => d.severity === 'error').length} error(s).`,
        ).addFields(
          { name: 'Errors', value: errors || 'None' },
          { name: 'Warnings', value: warnings || 'None' },
        );

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      logger.error('Validation failed', err as Error);
      const embed = createErrorEmbed('Validation Error', (err as Error).message);
      await interaction.editReply({ embeds: [embed] });
    }
  }
}
