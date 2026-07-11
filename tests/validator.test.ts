import { describe, it, expect } from 'vitest';
import { PlanValidator } from '../src/validator/validator.js';
import {
  createPlan,
  createRole,
  createCategory,
  createChannel,
} from '../src/forge-plan/factory.js';
import { ChannelType } from '../src/types/enums.js';

describe('PlanValidator', () => {
  const validator = new PlanValidator();

  it('validates a correct plan', () => {
    const plan = createPlan({
      id: 'plan_1',
      name: 'Test Server',
      roles: [createRole({ id: 'role_1', name: 'Member' })],
      categories: [
        createCategory({
          id: 'cat_1',
          name: 'Main',
          channels: [
            createChannel({
              id: 'ch_1',
              name: 'general',
              type: ChannelType.TEXT,
              parentId: 'cat_1',
            }),
          ],
        }),
      ],
    });

    const result = validator.validate(plan);
    expect(result.valid).toBe(true);
  });

  it('detects duplicate role IDs', () => {
    const plan = createPlan({
      id: 'plan_1',
      name: 'Test',
      roles: [
        createRole({ id: 'role_1', name: 'Member' }),
        createRole({ id: 'role_1', name: 'Admin' }),
      ],
    });

    const result = validator.validate(plan);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.code === 'DUPLICATE_ROLE_ID')).toBe(true);
  });

  it('detects invalid parent reference', () => {
    const plan = createPlan({
      id: 'plan_1',
      name: 'Test',
      categories: [
        createCategory({
          id: 'cat_1',
          name: 'Main',
          channels: [
            createChannel({
              id: 'ch_1',
              name: 'general',
              type: ChannelType.TEXT,
              parentId: 'cat_nonexistent',
            }),
          ],
        }),
      ],
    });

    const result = validator.validate(plan);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.code === 'INVALID_PARENT_REFERENCE')).toBe(true);
  });

  it('warns on invalid channel names', () => {
    const plan = createPlan({
      id: 'plan_1',
      name: 'Test',
      categories: [
        createCategory({
          id: 'cat_1',
          name: 'Main',
          channels: [
            createChannel({
              id: 'ch_1',
              name: 'Bad Channel Name',
              type: ChannelType.TEXT,
              parentId: 'cat_1',
            }),
          ],
        }),
      ],
    });

    const result = validator.validate(plan);
    expect(result.diagnostics.some((d) => d.code === 'INVALID_CHANNEL_NAME')).toBe(true);
  });

  it('detects channel limit exceeded', () => {
    const channels = Array.from({ length: 51 }, (_, i) =>
      createChannel({ id: `ch_${i}`, name: `ch-${i}`, type: ChannelType.TEXT, parentId: 'cat_1' }),
    );
    const plan = createPlan({
      id: 'plan_1',
      name: 'Test',
      categories: [createCategory({ id: 'cat_1', name: 'Big', channels: channels })],
    });

    const result = validator.validate(plan);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.code === 'CHANNEL_LIMIT_EXCEEDED')).toBe(true);
  });
});
