import type {
  ForgePlan,
  ValidationResult,
  ValidationDiagnostic,
  ForgeRole,
} from '../types/index.js';
import { DiagnosticSeverity } from '../types/enums.js';
import { forgePlanSchema } from '../forge-plan/schemas.js';

export interface ValidationRule {
  readonly id: string;
  readonly description: string;
  run(plan: ForgePlan): ValidationDiagnostic[];
}

export class SchemaRule implements ValidationRule {
  readonly id = 'schema';
  readonly description = 'Validates the plan against the Zod schema definition';

  run(plan: ForgePlan): ValidationDiagnostic[] {
    const result = forgePlanSchema.safeParse(plan);
    if (result.success) return [];

    return result.error.issues.map((issue) => ({
      severity: DiagnosticSeverity.ERROR,
      code: 'SCHEMA_VIOLATION',
      message: issue.message,
      path: issue.path.join('.'),
    }));
  }
}

export class DuplicateIdRule implements ValidationRule {
  readonly id = 'duplicate-ids';
  readonly description = 'Ensures all entity IDs are unique within their scope';

  run(plan: ForgePlan): ValidationDiagnostic[] {
    const diagnostics: ValidationDiagnostic[] = [];
    const roleIds = new Set<string>();
    const categoryIds = new Set<string>();
    const channelIds = new Set<string>();

    for (const role of plan.roles) {
      if (roleIds.has(role.id)) {
        diagnostics.push({
          severity: DiagnosticSeverity.ERROR,
          code: 'DUPLICATE_ROLE_ID',
          message: `Duplicate role ID: ${role.id}`,
          path: 'roles',
          entityId: role.id,
        });
      }
      roleIds.add(role.id);
    }

    for (const cat of plan.categories) {
      if (categoryIds.has(cat.id)) {
        diagnostics.push({
          severity: DiagnosticSeverity.ERROR,
          code: 'DUPLICATE_CATEGORY_ID',
          message: `Duplicate category ID: ${cat.id}`,
          path: 'categories',
          entityId: cat.id,
        });
      }
      categoryIds.add(cat.id);

      for (const ch of cat.channels) {
        if (channelIds.has(ch.id)) {
          diagnostics.push({
            severity: DiagnosticSeverity.ERROR,
            code: 'DUPLICATE_CHANNEL_ID',
            message: `Duplicate channel ID: ${ch.id}`,
            path: `categories.${cat.id}.channels`,
            entityId: ch.id,
          });
        }
        channelIds.add(ch.id);
      }
    }

    return diagnostics;
  }
}

export class ChannelParentRule implements ValidationRule {
  readonly id = 'channel-parent';
  readonly description = 'Ensures every channel references a valid parent category';

  run(plan: ForgePlan): ValidationDiagnostic[] {
    const diagnostics: ValidationDiagnostic[] = [];
    const categoryIds = new Set(plan.categories.map((c) => c.id));

    for (const cat of plan.categories) {
      for (const ch of cat.channels) {
        if (!categoryIds.has(ch.parentId)) {
          diagnostics.push({
            severity: DiagnosticSeverity.ERROR,
            code: 'INVALID_PARENT_REFERENCE',
            message: `Channel "${ch.name}" references unknown parent ID: ${ch.parentId}`,
            path: `categories.${cat.id}.channels.${ch.id}`,
            entityId: ch.id,
          });
        }
        if (ch.parentId !== cat.id) {
          diagnostics.push({
            severity: DiagnosticSeverity.ERROR,
            code: 'PARENT_MISMATCH',
            message: `Channel "${ch.name}" parentId (${ch.parentId}) does not match its containing category (${cat.id})`,
            path: `categories.${cat.id}.channels.${ch.id}`,
            entityId: ch.id,
          });
        }
      }
    }

    return diagnostics;
  }
}

export class RoleNameRule implements ValidationRule {
  readonly id = 'role-names';
  readonly description = 'Ensures role names are non-empty and unique';

  run(plan: ForgePlan): ValidationDiagnostic[] {
    const diagnostics: ValidationDiagnostic[] = [];
    const names = new Set<string>();

    for (const role of plan.roles) {
      if (names.has(role.name)) {
        diagnostics.push({
          severity: DiagnosticSeverity.WARNING,
          code: 'DUPLICATE_ROLE_NAME',
          message: `Duplicate role name: ${role.name}`,
          path: 'roles',
          entityId: role.id,
        });
      }
      names.add(role.name);
    }

    return diagnostics;
  }
}

export class ChannelNameRule implements ValidationRule {
  readonly id = 'channel-names';
  readonly description = 'Ensures channel names follow Discord naming conventions';

  run(plan: ForgePlan): ValidationDiagnostic[] {
    const diagnostics: ValidationDiagnostic[] = [];
    const namePattern = /^[a-z0-9-]+$/;

    for (const cat of plan.categories) {
      for (const ch of cat.channels) {
        if (!namePattern.test(ch.name)) {
          diagnostics.push({
            severity: DiagnosticSeverity.WARNING,
            code: 'INVALID_CHANNEL_NAME',
            message: `Channel name "${ch.name}" should be lowercase with hyphens`,
            path: `categories.${cat.id}.channels.${ch.id}`,
            entityId: ch.id,
          });
        }
      }
    }

    return diagnostics;
  }
}

export class RolePositionRule implements ValidationRule {
  readonly id = 'role-positions';
  readonly description = 'Warns about roles with duplicate positions';

  run(plan: ForgePlan): ValidationDiagnostic[] {
    const diagnostics: ValidationDiagnostic[] = [];
    const positions = new Map<number, ForgeRole[]>();

    for (const role of plan.roles) {
      const existing = positions.get(role.position) ?? [];
      existing.push(role);
      positions.set(role.position, existing);
    }

    for (const [pos, roles] of positions) {
      if (roles.length > 1) {
        diagnostics.push({
          severity: DiagnosticSeverity.WARNING,
          code: 'DUPLICATE_ROLE_POSITION',
          message: `${roles.length} roles share position ${pos}`,
          path: 'roles',
        });
      }
    }

    return diagnostics;
  }
}

export class CategoryChannelLimitRule implements ValidationRule {
  readonly id = 'category-channel-limit';
  readonly description = 'Warns when a category exceeds 50 channels (Discord limit)';

  private readonly maxChannels = 50;

  run(plan: ForgePlan): ValidationDiagnostic[] {
    const diagnostics: ValidationDiagnostic[] = [];

    for (const cat of plan.categories) {
      if (cat.channels.length > this.maxChannels) {
        diagnostics.push({
          severity: DiagnosticSeverity.ERROR,
          code: 'CHANNEL_LIMIT_EXCEEDED',
          message: `Category "${cat.name}" has ${cat.channels.length} channels (max ${this.maxChannels})`,
          path: `categories.${cat.id}`,
          entityId: cat.id,
        });
      }
    }

    return diagnostics;
  }
}

export class PlanValidator {
  private readonly rules: ValidationRule[];

  constructor(rules?: ValidationRule[]) {
    this.rules = rules ?? [
      new SchemaRule(),
      new DuplicateIdRule(),
      new ChannelParentRule(),
      new RoleNameRule(),
      new ChannelNameRule(),
      new RolePositionRule(),
      new CategoryChannelLimitRule(),
    ];
  }

  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  validate(plan: ForgePlan): ValidationResult {
    const allDiagnostics: ValidationDiagnostic[] = [];

    for (const rule of this.rules) {
      const diagnostics = rule.run(plan);
      allDiagnostics.push(...diagnostics);
    }

    const hasErrors = allDiagnostics.some((d) => d.severity === DiagnosticSeverity.ERROR);
    return {
      valid: !hasErrors,
      diagnostics: allDiagnostics,
    };
  }
}
