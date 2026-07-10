import type { ForgePlan, BuildResult, BuildProgress } from '../types/index.js';

export interface BuilderOptions {
  readonly dryRun: boolean;
  readonly skipRoles: boolean;
  readonly skipCategories: boolean;
  readonly skipChannels: boolean;
  readonly skipPermissions: boolean;
}

export const defaultBuilderOptions: BuilderOptions = {
  dryRun: false,
  skipRoles: false,
  skipCategories: false,
  skipChannels: false,
  skipPermissions: false,
};

export type ProgressCallback = (progress: BuildProgress) => void;

export interface GuildState {
  readonly existingRoles: ReadonlyMap<string, { id: string; name: string }>;
  readonly existingCategories: ReadonlyMap<string, { id: string; name: string }>;
  readonly existingChannels: ReadonlyMap<string, { id: string; name: string; parentId: string | null }>;
}

export interface DiscordBuilderInterface {
  build(plan: ForgePlan, guildId: string, options?: Partial<BuilderOptions>, onProgress?: ProgressCallback): Promise<BuildResult>;
  dryRun(plan: ForgePlan, guildId: string): Promise<BuildResult>;
  getCurrentState(guildId: string): Promise<GuildState>;
}
