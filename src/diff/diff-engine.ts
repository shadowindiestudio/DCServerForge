import type { ForgePlan, DiffEntry, DiffResult } from '../types/index.js';

export interface DiffEngine {
  diff(oldPlan: ForgePlan, newPlan: ForgePlan): DiffResult;
}

export class PlanDiffEngine implements DiffEngine {
  diff(oldPlan: ForgePlan, newPlan: ForgePlan): DiffResult {
    const entries: DiffEntry[] = [];

    this.diffRoles(oldPlan, newPlan, entries);
    this.diffCategories(oldPlan, newPlan, entries);
    this.diffChannels(oldPlan, newPlan, entries);
    this.diffPlanMetadata(oldPlan, newPlan, entries);

    return { entries, hasChanges: entries.length > 0 };
  }

  private diffRoles(oldPlan: ForgePlan, newPlan: ForgePlan, entries: DiffEntry[]): void {
    const oldRoles = new Map(oldPlan.roles.map((r) => [r.id, r]));
    const newRoles = new Map(newPlan.roles.map((r) => [r.id, r]));

    for (const [id, role] of oldRoles) {
      if (!newRoles.has(id)) {
        entries.push({
          type: 'removed',
          entityType: 'role',
          entityId: id,
          oldValue: role,
          path: 'roles',
        });
      }
    }
    for (const [id, role] of newRoles) {
      if (!oldRoles.has(id)) {
        entries.push({
          type: 'added',
          entityType: 'role',
          entityId: id,
          newValue: role,
          path: 'roles',
        });
      } else {
        const oldRole = oldRoles.get(id)!;
        if (JSON.stringify(oldRole) !== JSON.stringify(role)) {
          entries.push({
            type: 'modified',
            entityType: 'role',
            entityId: id,
            oldValue: oldRole,
            newValue: role,
            path: 'roles',
          });
        }
      }
    }
  }

  private diffCategories(oldPlan: ForgePlan, newPlan: ForgePlan, entries: DiffEntry[]): void {
    const oldCats = new Map(oldPlan.categories.map((c) => [c.id, c]));
    const newCats = new Map(newPlan.categories.map((c) => [c.id, c]));

    for (const [id, cat] of oldCats) {
      if (!newCats.has(id)) {
        entries.push({
          type: 'removed',
          entityType: 'category',
          entityId: id,
          oldValue: cat,
          path: 'categories',
        });
      }
    }
    for (const [id, cat] of newCats) {
      if (!oldCats.has(id)) {
        entries.push({
          type: 'added',
          entityType: 'category',
          entityId: id,
          newValue: cat,
          path: 'categories',
        });
      } else {
        const oldCat = oldCats.get(id)!;
        if (oldCat.position !== cat.position) {
          entries.push({
            type: 'moved',
            entityType: 'category',
            entityId: id,
            oldValue: oldCat.position,
            newValue: cat.position,
            path: `categories.${id}.position`,
          });
        }
        if (oldCat.name !== cat.name) {
          entries.push({
            type: 'modified',
            entityType: 'category',
            entityId: id,
            oldValue: oldCat.name,
            newValue: cat.name,
            path: `categories.${id}.name`,
          });
        }
      }
    }
  }

  private diffChannels(oldPlan: ForgePlan, newPlan: ForgePlan, entries: DiffEntry[]): void {
    const oldChannels = new Map<string, { channelId: string; parentId: string }>();
    const newChannels = new Map<string, { channelId: string; parentId: string }>();

    for (const cat of oldPlan.categories) {
      for (const ch of cat.channels) {
        oldChannels.set(ch.id, { channelId: ch.id, parentId: cat.id });
      }
    }
    for (const cat of newPlan.categories) {
      for (const ch of cat.channels) {
        newChannels.set(ch.id, { channelId: ch.id, parentId: cat.id });
      }
    }

    for (const [id, info] of oldChannels) {
      if (!newChannels.has(id)) {
        entries.push({
          type: 'removed',
          entityType: 'channel',
          entityId: id,
          oldValue: info,
          path: `categories.${info.parentId}.channels`,
        });
      }
    }
    for (const [id, info] of newChannels) {
      if (!oldChannels.has(id)) {
        entries.push({
          type: 'added',
          entityType: 'channel',
          entityId: id,
          newValue: info,
          path: `categories.${info.parentId}.channels`,
        });
      } else {
        const oldInfo = oldChannels.get(id)!;
        if (oldInfo.parentId !== info.parentId) {
          entries.push({
            type: 'moved',
            entityType: 'channel',
            entityId: id,
            oldValue: oldInfo.parentId,
            newValue: info.parentId,
            path: `channels.${id}.parentId`,
          });
        }
      }
    }
  }

  private diffPlanMetadata(oldPlan: ForgePlan, newPlan: ForgePlan, entries: DiffEntry[]): void {
    if (oldPlan.name !== newPlan.name) {
      entries.push({
        type: 'modified',
        entityType: 'plan',
        entityId: newPlan.id,
        oldValue: oldPlan.name,
        newValue: newPlan.name,
        path: 'name',
      });
    }
    if (oldPlan.description !== newPlan.description) {
      entries.push({
        type: 'modified',
        entityType: 'plan',
        entityId: newPlan.id,
        oldValue: oldPlan.description,
        newValue: newPlan.description,
        path: 'description',
      });
    }
  }
}
