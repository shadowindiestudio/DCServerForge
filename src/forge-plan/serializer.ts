import { forgePlanSchema } from './schemas.js';
import type { ForgePlan } from '../types/index.js';

export class PlanSerializationError extends Error {
  constructor(
    message: string,
    readonly details: unknown,
  ) {
    super(message);
    this.name = 'PlanSerializationError';
  }
}

export function serializePlan(plan: ForgePlan): string {
  try {
    return JSON.stringify(plan, null, 2);
  } catch (err) {
    throw new PlanSerializationError('Failed to serialize Forge Plan', err);
  }
}

export function deserializePlan(json: string): ForgePlan {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    throw new PlanSerializationError('Invalid JSON: cannot parse Forge Plan', err);
  }

  const result = forgePlanSchema.safeParse(raw);
  if (!result.success) {
    throw new PlanSerializationError(
      'Forge Plan failed schema validation during deserialization',
      result.error.issues,
    );
  }
  return result.data as ForgePlan;
}

export function validatePlanShape(plan: unknown): { valid: boolean; errors: string[] } {
  const result = forgePlanSchema.safeParse(plan);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  };
}
