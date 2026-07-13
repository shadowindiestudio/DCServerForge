import { describe, it, expect } from 'vitest';
import { detectDuplicates } from '../src/builder/duplicate-detector.js';
import { createPlan, createRole, createCategory, createChannel } from '../src/forge-plan/factory.js';
import { ChannelType } from '../src/types/enums.js';
import type { GuildState } from '../src/builder/interfaces.js';

function makeState(
  roles: string[] = [],
  categories: string[] = [],
  channels: string[] = [],
): GuildState {
  return {
    existingRoles: new Map(roles.map((n) => [n.toLowerCase(), { id: `r_${n}`, name: n }])),
    existingCategories: new Map(
      categories.map((n) => [n.toLowerCase(), { id: `c_${n}`, name: n }]),
    ),
    existingChannels: new Map(
      channels.map((n) => [n.toLowerCase(), { id: `ch_${n}`, name: n, parentId: null }]),
    ),
  };
}

describe('detectDuplicates', () => {
  it('reports no duplicates when guild is empty', () => {
    const plan = createPlan({
      id: 'p1',
      name: 'Test',
      roles: [createRole({ id: 'r1', name: 'Admin' })],
      categories: [
        createCategory({
          id: 'cat1',
          name: 'General',
          channels: [createChannel({ id: 'ch1', name: 'welcome', type: ChannelType.TEXT, parentId: 'cat1' })],
        }),
      ],
    });

    const result = detectDuplicates(plan, makeState());
    expect(result.roleNames.size).toBe(0);
    expect(result.categoryNames.size).toBe(0);
    expect(result.channelKeys.size).toBe(0);
  });

  it('detects a duplicate role (case-insensitive)', () => {
    const plan = createPlan({
      id: 'p1',
      name: 'Test',
      roles: [
        createRole({ id: 'r1', name: 'Admin' }),
        createRole({ id: 'r2', name: 'Member' }),
      ],
    });

    const result = detectDuplicates(plan, makeState(['ADMIN']));
    expect(result.roleNames.has('admin')).toBe(true);
    expect(result.roleNames.has('member')).toBe(false);
    expect(result.roleNames.size).toBe(1);
  });

  it('detects a duplicate category', () => {
    const plan = createPlan({
      id: 'p1',
      name: 'Test',
      categories: [
        createCategory({ id: 'cat1', name: 'Information' }),
        createCategory({ id: 'cat2', name: 'Gaming' }),
      ],
    });

    const result = detectDuplicates(plan, makeState([], ['information']));
    expect(result.categoryNames.has('information')).toBe(true);
    expect(result.categoryNames.has('gaming')).toBe(false);
  });

  it('detects a duplicate channel', () => {
    const plan = createPlan({
      id: 'p1',
      name: 'Test',
      categories: [
        createCategory({
          id: 'cat1',
          name: 'General',
          channels: [
            createChannel({ id: 'ch1', name: 'general', type: ChannelType.TEXT, parentId: 'cat1' }),
            createChannel({ id: 'ch2', name: 'new-channel', type: ChannelType.TEXT, parentId: 'cat1' }),
          ],
        }),
      ],
    });

    const result = detectDuplicates(plan, makeState([], [], ['general']));
    expect(result.channelKeys.has('general/general')).toBe(true);
    expect(result.channelKeys.has('general/new-channel')).toBe(false);
  });

  it('does not flag a channel when only its category name matches but not the channel', () => {
    const plan = createPlan({
      id: 'p1',
      name: 'Test',
      categories: [
        createCategory({
          id: 'cat1',
          name: 'General',
          channels: [
            createChannel({ id: 'ch1', name: 'announcements', type: ChannelType.TEXT, parentId: 'cat1' }),
          ],
        }),
      ],
    });

    // 'General' category exists but 'announcements' channel does not
    const result = detectDuplicates(plan, makeState([], ['general'], []));
    expect(result.channelKeys.size).toBe(0);
  });

  it('handles all duplicates simultaneously', () => {
    const plan = createPlan({
      id: 'p1',
      name: 'Test',
      roles: [createRole({ id: 'r1', name: 'Mod' })],
      categories: [
        createCategory({
          id: 'cat1',
          name: 'Info',
          channels: [
            createChannel({ id: 'ch1', name: 'rules', type: ChannelType.TEXT, parentId: 'cat1' }),
          ],
        }),
      ],
    });

    const result = detectDuplicates(plan, makeState(['Mod'], ['Info'], ['rules']));
    expect(result.roleNames.has('mod')).toBe(true);
    expect(result.categoryNames.has('info')).toBe(true);
    expect(result.channelKeys.has('info/rules')).toBe(true);
  });
});
