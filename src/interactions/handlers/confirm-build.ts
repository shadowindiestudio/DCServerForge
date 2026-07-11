import { ButtonBuilder, ButtonStyle, ActionRowBuilder, type ButtonInteraction } from 'discord.js';
import type { InteractionHandler } from '../router.js';
import type { CommandDependencies } from '../../commands/command.js';
import { createInfoEmbed, createSuccessEmbed, replyEphemeral } from '../../discord/embeds.js';

export class ConfirmBuildHandler implements InteractionHandler {
  readonly customIdPrefix = 'confirm_build:';

  static createButtons(planId: string): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_build:${planId}`)
        .setLabel('Confirm Build')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`cancel_build:${planId}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary),
    );
  }

  async handleButton(interaction: ButtonInteraction, deps: CommandDependencies): Promise<void> {
    const planId = interaction.customId.split(':')[1];

    if (!planId) {
      await replyEphemeral(interaction, 'Invalid plan ID in button.');
      return;
    }

    await interaction.deferUpdate();

    try {
      const plan = await deps.store.load(planId);
      const result = await deps.builder.build(plan, interaction.guildId!, {});

      if (result.success) {
        const successCount = result.steps.filter((s) => s.success).length;
        const embed = createSuccessEmbed(
          'Build Complete',
          `Deployed ${successCount} entities successfully.`,
        );
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = createInfoEmbed('Build Failed', result.error ?? 'Unknown error');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      await interaction.editReply({ content: `Build error: ${(err as Error).message}` });
    }
  }
}

export class CancelBuildHandler implements InteractionHandler {
  readonly customIdPrefix = 'cancel_build:';

  async handleButton(interaction: ButtonInteraction, _deps: CommandDependencies): Promise<void> {
    await interaction.update({ content: 'Build cancelled.', components: [] });
  }
}
