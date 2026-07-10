import { describe, it, expect } from 'vitest';
import { createPlan, createRole, createCategory, createChannel, updatePlanStatus } from '../src/forge-plan/factory.js';
import { PlanStatus, ChannelType } from '../src/types/enums.js';

describe('Forge Plan Factory', () => {
  it('creates a plan with default values', () => {
    const plan = createPlan({ id: 'test-plan', name: 'Test Server' });
    expect(plan.id).toBe('test-plan');
    expect(plan.name).toBe('Test Server');
    expect(plan.status).toBe(PlanStatus.DRAFT);
    expect(plan.roles).toEqual([]);
    expect(plan.categories).toEqual([]);
    expect(plan.createdAt).toBeDefined();
    expect(plan.updatedAt).toBeDefined();
  });

  it('creates a role with defaults', () => {
    const role = createRole({ id: 'role_1', name: 'Member' });
    expect(role.hoist).toBe(false);
    expect(role.mentionable).toBe(false);
    expect(role.permissions).toBe('0');
    expect(role.position).toBe(0);
  });

  it('creates a channel with correct type', () => {
    const ch = createChannel({ id: 'ch_1', name: 'general', type: ChannelType.TEXT, parentId: 'cat_1' });
    expect(ch.type).toBe(ChannelType.TEXT);
    expect(ch.parentId).toBe('cat_1');
    expect(ch.overwrites).toEqual([]);
  });

  it('creates a category with channels', () => {
    const ch = createChannel({ id: 'ch_1', name: 'general', type: ChannelType.TEXT, parentId: 'cat_1' });
    const cat = createCategory({ id: 'cat_1', name: 'Main', channels: [ch] });
    expect(cat.channels).toHaveLength(1);
    expect(cat.channels[0]!.name).toBe('general');
  });

  it('updates plan status', () => {
    const plan = createPlan({ id: 'test', name: 'Test' });
    const updated = updatePlanStatus(plan, PlanStatus.VALIDATED);
    expect(updated.status).toBe(PlanStatus.VALIDATED);
    expect(updated.status).toBe(PlanStatus.VALIDATED);
  });
});
