import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, CommandDependencies } from '../command.js';
import { createInfoEmbed, createErrorEmbed, replyEphemeral } from '../../discord/embeds.js';
import { getLogger } from '../../logging/index.js';

export class ShowPlanCommand implements SlashCommand {
  readonly name = 'show';
  readonly description = 'Display the details of a stored Forge Plan.';

  readonly data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((opt) =>
      opt.setName('plan-id').setDescription('The Forge Plan ID to display.').setRequired(true),
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
    const logger = getLogger().child({ command: 'show', planId });

    await interaction.deferReply({ ephemeral: true });

    try {
      const exists = await deps.store.exists(planId);
      if (!exists) {
        const embed = createErrorEmbed('Plan Not Found', `No plan found with ID: \`${planId}\``);
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const plan = await deps.store.load(planId);
      const channelCount = plan.categories.reduce((sum, c) => sum + c.channels.length, 0);

      const embed = createInfoEmbed(plan.name, plan.description ?? 'No description').addFields(
        { name: 'Plan ID', value: `\`${plan.id}\``, inline: false },
        { name: 'Status', value: plan.status, inline: true },
        { name: 'Roles', value: plan.roles.length.toString(), inline: true },
        { name: 'Categories', value: plan.categories.length.toString(), inline: true },
        { name: 'Channels', value: channelCount.toString(), inline: true },
        {
          name: 'Created',
          value: `<t:${Math.floor(new Date(plan.createdAt).getTime() / 1000)}:R>`,
          inline: true,
        },
        {
          name: 'Updated',
          value: `<t:${Math.floor(new Date(plan.updatedAt).getTime() / 1000)}:R>`,
          inline: true,
        },
      );

      if (plan.roles.length > 0) {
        const roleList = plan.roles
          .slice(0, 15)
          .map((r) => `• ${r.name} (pos ${r.position})`)
          .join('\n');
        embed.addFields({ name: 'Roles', value: roleList, inline: false });
      }

      if (plan.categories.length > 0) {
        const catList = plan.categories
          .slice(0, 15)
          .map((c) => `• ${c.name} (${c.channels.length} channels)`)
          .join('\n');
        embed.addFields({ name: 'Categories', value: catList, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error('Show plan failed', err as Error);
      const embed = createErrorEmbed('Error', (err as Error).message);
      await interaction.editReply({ embeds: [embed] });
    }
  }
}
