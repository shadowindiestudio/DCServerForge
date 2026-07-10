import type { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import type { CommandDependencies } from '../commands/command.js';

export interface InteractionHandler {
  readonly customIdPrefix: string;
  handleButton?(interaction: ButtonInteraction, deps: CommandDependencies): Promise<void>;
  handleModal?(interaction: ModalSubmitInteraction, deps: CommandDependencies): Promise<void>;
  handleSelectMenu?(interaction: StringSelectMenuInteraction, deps: CommandDependencies): Promise<void>;
}

export class InteractionRouter {
  private readonly handlers: Map<string, InteractionHandler> = new Map();

  register(handler: InteractionHandler): void {
    this.handlers.set(handler.customIdPrefix, handler);
  }

  findHandler(customId: string): InteractionHandler | undefined {
    for (const [prefix, handler] of this.handlers) {
      if (customId.startsWith(prefix)) return handler;
    }
    return undefined;
  }

  async routeButton(interaction: ButtonInteraction, deps: CommandDependencies): Promise<void> {
    const handler = this.findHandler(interaction.customId);
    if (handler?.handleButton) {
      await handler.handleButton(interaction, deps);
    }
  }

  async routeModal(interaction: ModalSubmitInteraction, deps: CommandDependencies): Promise<void> {
    const handler = this.findHandler(interaction.customId);
    if (handler?.handleModal) {
      await handler.handleModal(interaction, deps);
    }
  }

  async routeSelectMenu(interaction: StringSelectMenuInteraction, deps: CommandDependencies): Promise<void> {
    const handler = this.findHandler(interaction.customId);
    if (handler?.handleSelectMenu) {
      await handler.handleSelectMenu(interaction, deps);
    }
  }
}
