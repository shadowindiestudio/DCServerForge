import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, CommandDependencies } from '../command.js';
import { createInfoEmbed, createErrorEmbed, replyEphemeral } from '../../discord/embeds.js';
import { getLogger } from '../../logging/index.js';

export class ListPlansCommand implements SlashCommand {
  readonly name = 'plans';
  readonly description = 'List all stored Forge Plans.';

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

    const logger = getLogger().child({ command: 'plans' });
    await interaction.deferReply({ ephemeral: true });

    try {
      const planIds = await deps.store.list();

      if (planIds.length === 0) {
        const embed = createInfoEmbed(
          'No Plans',
          'No Forge Plans are currently stored. Use `/generate` to create one.',
        );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const plans = await deps.store.loadAll();
      const fields = plans.slice(0, 25).map((p) => ({
        name: p.name,
        value: `ID: \`${p.id}\`\nStatus: ${p.status}\nRoles: ${p.roles.length} | Categories: ${p.categories.length}`,
        inline: false,
      }));

      const embed = createInfoEmbed(
        'Stored Forge Plans',
        `${plans.length} plan(s) found.`,
      ).addFields(fields);

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error('List plans failed', err as Error);
      const embed = createErrorEmbed('Error', (err as Error).message);
      await interaction.editReply({ embeds: [embed] });
    }
  }
}
