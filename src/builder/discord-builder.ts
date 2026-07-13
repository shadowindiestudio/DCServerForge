import type { Client } from 'discord.js';
import type { ForgePlan, BuildResult, BuildStepResult } from '../types/index.js';
import { BuildPhase } from '../types/enums.js';
import type {
  BuilderOptions,
  ProgressCallback,
  DiscordBuilderInterface,
  GuildState,
} from './interfaces.js';
import { defaultBuilderOptions } from './interfaces.js';
import { GuildStateFetcher } from './guild-state.js';
import { detectDuplicates } from './duplicate-detector.js';
import { getLogger } from '../logging/index.js';

export class DiscordBuilder implements DiscordBuilderInterface {
  private readonly fetcher: GuildStateFetcher;
  private readonly logger = getLogger();

  constructor(client: Client) {
    this.fetcher = new GuildStateFetcher(client);
  }

  async build(
    plan: ForgePlan,
    guildId: string,
    options: Partial<BuilderOptions> = {},
    onProgress?: ProgressCallback,
  ): Promise<BuildResult> {
    const opts: BuilderOptions = { ...defaultBuilderOptions, ...options };
    const startedAt = new Date().toISOString();
    const steps: BuildStepResult[] = [];

    try {
      const guild = await this.fetcher.fetchGuild(guildId);

      // Fetch live guild state once upfront for duplicate detection.
      const guildState = await this.fetcher.getCurrentState(guildId);
      const duplicates = detectDuplicates(plan, guildState);

      // Phase 1: Roles
      if (!opts.skipRoles && plan.roles.length > 0) {
        steps.push(...(await this.buildRoles(plan, guild, duplicates.roleNames, onProgress)));
      }

      // Phase 2: Categories
      if (!opts.skipCategories && plan.categories.length > 0) {
        steps.push(
          ...(await this.buildCategories(plan, guild, duplicates.categoryNames, onProgress)),
        );
      }

      // Phase 3: Channels — refresh category cache after creation
      if (!opts.skipChannels) {
        await guild.channels.fetch();
        steps.push(
          ...(await this.buildChannels(plan, guild, duplicates.channelKeys, onProgress)),
        );
      }

      // Phase 4: Permissions
      if (!opts.skipPermissions) {
        steps.push(...(await this.buildPermissions(plan, guild, onProgress)));
      }

      return {
        planId: plan.id,
        success: true,
        guildId,
        steps,
        startedAt,
        finishedAt: new Date().toISOString(),
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error('Build failed', error, { planId: plan.id, guildId });
      return {
        planId: plan.id,
        success: false,
        guildId,
        steps,
        startedAt,
        finishedAt: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  async dryRun(plan: ForgePlan, guildId: string): Promise<BuildResult> {
    const startedAt = new Date().toISOString();
    const steps: BuildStepResult[] = [];

    for (const role of plan.roles) {
      steps.push({
        phase: BuildPhase.ROLES,
        success: true,
        entityId: role.id,
        message: `[DRY RUN] Would create role: ${role.name}`,
      });
    }

    for (const cat of plan.categories) {
      steps.push({
        phase: BuildPhase.CATEGORIES,
        success: true,
        entityId: cat.id,
        message: `[DRY RUN] Would create category: ${cat.name}`,
      });
      for (const ch of cat.channels) {
        steps.push({
          phase: BuildPhase.CHANNELS,
          success: true,
          entityId: ch.id,
          message: `[DRY RUN] Would create ${ch.type} channel: ${ch.name} in ${cat.name}`,
        });
      }
    }

    return {
      planId: plan.id,
      success: true,
      guildId,
      steps,
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }

  async getCurrentState(guildId: string): Promise<GuildState> {
    return this.fetcher.getCurrentState(guildId);
  }

  private async buildRoles(
    plan: ForgePlan,
    guild: Awaited<ReturnType<GuildStateFetcher['fetchGuild']>>,
    duplicateRoleNames: ReadonlySet<string>,
    onProgress?: ProgressCallback,
  ): Promise<BuildStepResult[]> {
    const steps: BuildStepResult[] = [];
    const total = plan.roles.length;
    let completed = 0;

    for (const role of plan.roles) {
      const isDuplicate = duplicateRoleNames.has(role.name.toLowerCase());

      if (isDuplicate) {
        const step: BuildStepResult = {
          phase: BuildPhase.ROLES,
          success: true,
          skipped: true,
          skipReason: 'Role already exists in the server',
          entityId: role.id,
          message: `Skipped role (already exists): ${role.name}`,
        };
        steps.push(step);
        onProgress?.({
          planId: plan.id,
          phase: BuildPhase.ROLES,
          completed,
          total,
          currentEntity: role.name,
          stepResult: step,
        });
        continue;
      }

      try {
        const created = await this.fetcher.createRole(guild, {
          name: role.name,
          color: role.color ?? 0,
          hoist: role.hoist,
          mentionable: role.mentionable,
          permissions: role.permissions,
          position: role.position,
        });
        completed++;
        const step: BuildStepResult = {
          phase: BuildPhase.ROLES,
          success: true,
          entityId: role.id,
          discordId: created.id,
          message: `Created role: ${role.name}`,
        };
        steps.push(step);
        onProgress?.({
          planId: plan.id,
          phase: BuildPhase.ROLES,
          completed,
          total,
          currentEntity: role.name,
          stepResult: step,
        });
      } catch (err) {
        const step: BuildStepResult = {
          phase: BuildPhase.ROLES,
          success: false,
          entityId: role.id,
          message: `Failed to create role: ${role.name}`,
          error: (err as Error).message,
        };
        steps.push(step);
        onProgress?.({
          planId: plan.id,
          phase: BuildPhase.ROLES,
          completed,
          total,
          currentEntity: role.name,
          stepResult: step,
        });
      }
    }

    return steps;
  }

  private async buildCategories(
    plan: ForgePlan,
    guild: Awaited<ReturnType<GuildStateFetcher['fetchGuild']>>,
    duplicateCategoryNames: ReadonlySet<string>,
    onProgress?: ProgressCallback,
  ): Promise<BuildStepResult[]> {
    const steps: BuildStepResult[] = [];
    const total = plan.categories.length;
    let completed = 0;

    for (const cat of plan.categories) {
      const isDuplicate = duplicateCategoryNames.has(cat.name.toLowerCase());

      if (isDuplicate) {
        const step: BuildStepResult = {
          phase: BuildPhase.CATEGORIES,
          success: true,
          skipped: true,
          skipReason: 'Category already exists in the server',
          entityId: cat.id,
          message: `Skipped category (already exists): ${cat.name}`,
        };
        steps.push(step);
        onProgress?.({
          planId: plan.id,
          phase: BuildPhase.CATEGORIES,
          completed,
          total,
          currentEntity: cat.name,
          stepResult: step,
        });
        continue;
      }

      try {
        const created = await this.fetcher.createCategory(guild, {
          name: cat.name,
          position: cat.position,
        });
        completed++;
        const step: BuildStepResult = {
          phase: BuildPhase.CATEGORIES,
          success: true,
          entityId: cat.id,
          discordId: created.id,
          message: `Created category: ${cat.name}`,
        };
        steps.push(step);
        onProgress?.({
          planId: plan.id,
          phase: BuildPhase.CATEGORIES,
          completed,
          total,
          currentEntity: cat.name,
          stepResult: step,
        });
      } catch (err) {
        const step: BuildStepResult = {
          phase: BuildPhase.CATEGORIES,
          success: false,
          entityId: cat.id,
          message: `Failed to create category: ${cat.name}`,
          error: (err as Error).message,
        };
        steps.push(step);
        onProgress?.({
          planId: plan.id,
          phase: BuildPhase.CATEGORIES,
          completed,
          total,
          currentEntity: cat.name,
          stepResult: step,
        });
      }
    }

    return steps;
  }

  private async buildChannels(
    plan: ForgePlan,
    guild: Awaited<ReturnType<GuildStateFetcher['fetchGuild']>>,
    duplicateChannelKeys: ReadonlySet<string>,
    onProgress?: ProgressCallback,
  ): Promise<BuildStepResult[]> {
    const steps: BuildStepResult[] = [];
    const allChannels = plan.categories.flatMap((c) => c.channels.map((ch) => ({ ch, cat: c })));
    const total = allChannels.length;
    let completed = 0;

    const categoryMap = new Map<string, Awaited<ReturnType<GuildStateFetcher['createCategory']>>>();
    for (const ch of guild.channels.cache.values()) {
      if (ch.type === 4) {
        categoryMap.set(
          ch.name.toLowerCase(),
          ch as Awaited<ReturnType<GuildStateFetcher['createCategory']>>,
        );
      }
    }

    for (const { ch, cat } of allChannels) {
      const channelKey = `${cat.name.toLowerCase()}/${ch.name.toLowerCase()}`;
      const isDuplicate = duplicateChannelKeys.has(channelKey);

      if (isDuplicate) {
        const step: BuildStepResult = {
          phase: BuildPhase.CHANNELS,
          success: true,
          skipped: true,
          skipReason: 'Channel already exists in the server',
          entityId: ch.id,
          message: `Skipped ${ch.type} channel (already exists): ${ch.name}`,
        };
        steps.push(step);
        onProgress?.({
          planId: plan.id,
          phase: BuildPhase.CHANNELS,
          completed,
          total,
          currentEntity: ch.name,
          stepResult: step,
        });
        continue;
      }

      const parent = categoryMap.get(cat.name.toLowerCase());
      if (!parent) {
        const step: BuildStepResult = {
          phase: BuildPhase.CHANNELS,
          success: false,
          entityId: ch.id,
          message: `Parent category not found: ${cat.name}`,
          error: `Category "${cat.name}" not found in guild`,
        };
        steps.push(step);
        onProgress?.({
          planId: plan.id,
          phase: BuildPhase.CHANNELS,
          completed,
          total,
          currentEntity: ch.name,
          stepResult: step,
        });
        continue;
      }

      try {
        let created;
        switch (ch.type) {
          case 'text':
            created = await this.fetcher.createTextChannel(guild, {
              name: ch.name,
              topic: ch.topic ?? '',
              parent,
              position: ch.position ?? 0,
              nsfw: ch.nsfw ?? false,
              rateLimitPerUser: ch.rateLimitPerUser ?? 0,
            });
            break;
          case 'voice':
            created = await this.fetcher.createVoiceChannel(guild, {
              name: ch.name,
              bitrate: ch.bitrate ?? 64000,
              userLimit: ch.userLimit ?? 0,
              parent,
              position: ch.position ?? 0,
            });
            break;
          case 'forum':
            created = await this.fetcher.createForumChannel(guild, {
              name: ch.name,
              topic: ch.topic ?? '',
              parent,
              position: ch.position ?? 0,
            });
            break;
          case 'announcement':
            created = await this.fetcher.createAnnouncementChannel(guild, {
              name: ch.name,
              topic: ch.topic ?? '',
              parent,
              position: ch.position ?? 0,
            });
            break;
          case 'stage':
            created = await this.fetcher.createStageChannel(guild, {
              name: ch.name,
              parent,
              position: ch.position ?? 0,
            });
            break;
          default:
            throw new Error(`Unknown channel type: ${ch.type}`);
        }
        completed++;
        const step: BuildStepResult = {
          phase: BuildPhase.CHANNELS,
          success: true,
          entityId: ch.id,
          discordId: created.id,
          message: `Created ${ch.type} channel: ${ch.name}`,
        };
        steps.push(step);
        onProgress?.({
          planId: plan.id,
          phase: BuildPhase.CHANNELS,
          completed,
          total,
          currentEntity: ch.name,
          stepResult: step,
        });
      } catch (err) {
        const step: BuildStepResult = {
          phase: BuildPhase.CHANNELS,
          success: false,
          entityId: ch.id,
          message: `Failed to create channel: ${ch.name}`,
          error: (err as Error).message,
        };
        steps.push(step);
        onProgress?.({
          planId: plan.id,
          phase: BuildPhase.CHANNELS,
          completed,
          total,
          currentEntity: ch.name,
          stepResult: step,
        });
      }
    }

    return steps;
  }

  private async buildPermissions(
    plan: ForgePlan,
    _guild: Awaited<ReturnType<GuildStateFetcher['fetchGuild']>>,
    onProgress?: ProgressCallback,
  ): Promise<BuildStepResult[]> {
    const steps: BuildStepResult[] = [];
    // Permission overwrite application is an extension point.
    // The full implementation requires mapping plan role IDs to Discord role IDs,
    // which depends on the ID mapping strategy chosen during the build phase.
    // This stub records that the phase was reached without error.
    const step: BuildStepResult = {
      phase: BuildPhase.PERMISSIONS,
      success: true,
      entityId: 'permissions',
      message: 'Permission overwrite application skipped (extension point)',
    };
    steps.push(step);
    onProgress?.({
      planId: plan.id,
      phase: BuildPhase.PERMISSIONS,
      completed: 0,
      total: 0,
      currentEntity: 'permissions',
      stepResult: step,
    });
    return steps;
  }
}
