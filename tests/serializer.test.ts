import { describe, it, expect } from 'vitest';
import { serializePlan, deserializePlan } from '../src/forge-plan/serializer.js';
import { createPlan, createRole } from '../src/forge-plan/factory.js';

describe('Plan Serializer', () => {
  it('serializes and deserializes a plan', () => {
    const plan = createPlan({
      id: 'plan_1',
      name: 'Test',
      roles: [createRole({ id: 'role_1', name: 'Member' })],
    });

    const json = serializePlan(plan);
    expect(json).toContain('plan_1');
    expect(json).toContain('Member');

    const restored = deserializePlan(json);
    expect(restored.id).toBe('plan_1');
    expect(restored.name).toBe('Test');
    expect(restored.roles).toHaveLength(1);
    expect(restored.roles[0]!.name).toBe('Member');
  });

  it('throws on invalid JSON', () => {
    expect(() => deserializePlan('not valid json')).toThrow();
  });

  it('throws on schema violation', () => {
    expect(() => deserializePlan('{"invalid": true}')).toThrow();
  });
});
