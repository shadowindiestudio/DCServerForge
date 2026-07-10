import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { SlashCommand, CommandDependencies } from '../command.js';
import { createInfoEmbed, createErrorEmbed, replyEphemeral } from '../../discord/embeds.js';
import { deserializePlan } from '../../forge-plan/serializer.js';
import { getLogger } from '../../logging/index.js';

export class GenerateCommand implements SlashCommand {
  readonly name = 'generate';
  readonly description = 'Generate a Forge Plan from a natural language description.';

  readonly data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((opt) =>
      opt.setName('prompt').setDescription('Describe the server you want to build.').setRequired(true).setMaxLength(2000),
    )
    .toJSON();

  async execute(interaction: ChatInputCommandInteraction, deps: CommandDependencies): Promise<void> {
    if (!interaction.guild) {
      await replyEphemeral(interaction, 'This command can only be used in a server.');
      return;
    }

    const prompt = interaction.options.getString('prompt', true);
    const logger = getLogger().child({ command: 'generate', userId: interaction.user.id });

    await interaction.deferReply({ ephemeral: true });
    logger.info('Generating Forge Plan', { promptLength: prompt.length });

    try {
      if (!deps.provider.validateConfig()) {
        const embed = createErrorEmbed(
          'AI Provider Not Configured',
          'The AI provider is not properly configured. Check AI_API_KEY and AI_PROVIDER in the environment.',
        );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const response = await deps.provider.generatePlan({
        prompt,
        guildId: interaction.guildId!,
        guildName: interaction.guild.name,
      });

      let plan;
      try {
        plan = deserializePlan(response.content);
      } catch {
        const embed = createErrorEmbed(
          'Plan Parsing Failed',
          'The AI response could not be parsed as a valid Forge Plan. Try rephrasing your prompt.',
        );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      await deps.store.save(plan);

      const embed = createInfoEmbed('Forge Plan Generated', `Plan ID: \`${plan.id}\`\n\nUse \`/validate\` to check it, or \`/build\` to deploy.`)
        .addFields(
          { name: 'Roles', value: plan.roles.length.toString(), inline: true },
          { name: 'Categories', value: plan.categories.length.toString(), inline: true },
          { name: 'Channels', value: plan.categories.reduce((sum, c) => sum + c.channels.length, 0).toString(), inline: true },
        );

      await interaction.editReply({ embeds: [embed] });
      logger.info('Forge Plan generated and stored', { planId: plan.id });
    } catch (err) {
      logger.error('Generation failed', err as Error);
      const embed = createErrorEmbed('Generation Failed', (err as Error).message);
      await interaction.editReply({ embeds: [embed] });
    }
  }
}
