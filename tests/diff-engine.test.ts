import { describe, it, expect } from 'vitest';
import { PlanDiffEngine } from '../src/diff/diff-engine.js';
import { createPlan, createRole, createCategory, createChannel } from '../src/forge-plan/factory.js';
import { ChannelType } from '../src/types/enums.js';

describe('PlanDiffEngine', () => {
  const diffEngine = new PlanDiffEngine();

  it('detects added roles', () => {
    const oldPlan = createPlan({ id: 'p1', name: 'Test' });
    const newPlan = createPlan({
      id: 'p1',
      name: 'Test',
      roles: [createRole({ id: 'role_1', name: 'New' })],
    });

    const result = diffEngine.diff(oldPlan, newPlan);
    expect(result.hasChanges).toBe(true);
    expect(result.entries.some((e) => e.type === 'added' && e.entityType === 'role')).toBe(true);
  });

  it('detects removed roles', () => {
    const oldPlan = createPlan({
      id: 'p1',
      name: 'Test',
      roles: [createRole({ id: 'role_1', name: 'Old' })],
    });
    const newPlan = createPlan({ id: 'p1', name: 'Test' });

    const result = diffEngine.diff(oldPlan, newPlan);
    expect(result.entries.some((e) => e.type === 'removed' && e.entityType === 'role')).toBe(true);
  });

  it('detects added channels', () => {
    const oldPlan = createPlan({ id: 'p1', name: 'Test' });
    const newPlan = createPlan({
      id: 'p1',
      name: 'Test',
      categories: [
        createCategory({
          id: 'cat_1',
          name: 'Main',
          channels: [createChannel({ id: 'ch_1', name: 'general', type: ChannelType.TEXT, parentId: 'cat_1' })],
        }),
      ],
    });

    const result = diffEngine.diff(oldPlan, newPlan);
    expect(result.entries.some((e) => e.type === 'added' && e.entityType === 'channel')).toBe(true);
  });

  it('detects plan name change', () => {
    const oldPlan = createPlan({ id: 'p1', name: 'Old Name' });
    const newPlan = createPlan({ id: 'p1', name: 'New Name' });

    const result = diffEngine.diff(oldPlan, newPlan);
    expect(result.entries.some((e) => e.type === 'modified' && e.entityType === 'plan' && e.path === 'name')).toBe(true);
  });

  it('returns no changes for identical plans', () => {
    const plan = createPlan({
      id: 'p1',
      name: 'Test',
      roles: [createRole({ id: 'role_1', name: 'Member' })],
    });

    const result = diffEngine.diff(plan, plan);
    expect(result.hasChanges).toBe(false);
  });
});
