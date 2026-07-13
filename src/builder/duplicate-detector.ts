import type { ForgePlan } from '../types/index.js';
import type { GuildState } from './interfaces.js';

/**
 * Names (lowercased) of plan entities that already exist in the guild.
 * The builder uses these sets to skip creation and record a skipped step instead.
 */
export interface DuplicateReport {
  readonly roleNames: ReadonlySet<string>;
  readonly categoryNames: ReadonlySet<string>;
  /** Key: `${categoryNameLower}/${channelNameLower}` */
  readonly channelKeys: ReadonlySet<string>;
}

/**
 * Compares a Forge Plan against live guild state and returns the sets of
 * entities that already exist by name (case-insensitive).
 *
 * Matching is intentionally name-based: Discord does not guarantee that
 * plan IDs map 1-to-1 with Discord snowflakes, so name collision is the
 * safest signal of a duplicate at plan-application time.
 */
export function detectDuplicates(plan: ForgePlan, state: GuildState): DuplicateReport {
  const roleNames = new Set<string>();
  for (const role of plan.roles) {
    const key = role.name.toLowerCase();
    if (state.existingRoles.has(key)) {
      roleNames.add(key);
    }
  }

  const categoryNames = new Set<string>();
  const channelKeys = new Set<string>();

  for (const cat of plan.categories) {
    const catKey = cat.name.toLowerCase();
    if (state.existingCategories.has(catKey)) {
      categoryNames.add(catKey);
    }

    for (const ch of cat.channels) {
      const chKey = ch.name.toLowerCase();
      // A channel is a duplicate only if a channel with the same name
      // already exists anywhere in the guild (Discord allows duplicate
      // channel names across categories but we treat same-name as a skip
      // to avoid accidental proliferation).
      if (state.existingChannels.has(chKey)) {
        channelKeys.add(`${catKey}/${chKey}`);
      }
    }
  }

  return { roleNames, categoryNames, channelKeys };
}
