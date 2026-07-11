import type { SlashCommand } from './command.js';
import { PingCommand } from './impl/ping.js';
import { StatusCommand } from './impl/status.js';
import { GenerateCommand } from './impl/generate.js';
import { ValidateCommand } from './impl/validate.js';
import { BuildCommand } from './impl/build.js';
import { ListPlansCommand } from './impl/list-plans.js';
import { ShowPlanCommand } from './impl/show-plan.js';

export function createAllCommands(): SlashCommand[] {
  return [
    new PingCommand(),
    new StatusCommand(),
    new GenerateCommand(),
    new ValidateCommand(),
    new BuildCommand(),
    new ListPlansCommand(),
    new ShowPlanCommand(),
  ];
}

export type { SlashCommand, CommandDependencies } from './command.js';
export { PingCommand } from './impl/ping.js';
export { StatusCommand } from './impl/status.js';
export { GenerateCommand } from './impl/generate.js';
export { ValidateCommand } from './impl/validate.js';
export { BuildCommand } from './impl/build.js';
export { ListPlansCommand } from './impl/list-plans.js';
export { ShowPlanCommand } from './impl/show-plan.js';
