import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { ForgePlan, StoredPlan } from '../types/index.js';
import { serializePlan, deserializePlan } from '../forge-plan/serializer.js';
import { getLogger } from '../logging/index.js';

export class StorageError extends Error {
  constructor(
    message: string,
    readonly cause?: Error,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class PlanStore {
  private readonly dataDir: string;
  private readonly logger = getLogger();

  constructor(baseDir: string) {
    this.dataDir = path.resolve(baseDir, 'plans');
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      this.logger.debug('Plan store initialized', { dir: this.dataDir });
    } catch (err) {
      throw new StorageError(
        `Failed to initialize storage directory: ${this.dataDir}`,
        err as Error,
      );
    }
  }

  async save(plan: ForgePlan): Promise<StoredPlan> {
    const filePath = this.planPath(plan.id);
    try {
      const data = serializePlan(plan);
      await fs.writeFile(filePath, data, 'utf-8');
      const stored: StoredPlan = { id: plan.id, plan, storedAt: new Date().toISOString() };
      this.logger.debug('Plan saved', { id: plan.id, path: filePath });
      return stored;
    } catch (err) {
      throw new StorageError(`Failed to save plan ${plan.id}`, err as Error);
    }
  }

  async load(planId: string): Promise<ForgePlan> {
    const filePath = this.planPath(planId);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return deserializePlan(data);
    } catch (err) {
      throw new StorageError(`Failed to load plan ${planId}`, err as Error);
    }
  }

  async exists(planId: string): Promise<boolean> {
    try {
      await fs.access(this.planPath(planId));
      return true;
    } catch {
      return false;
    }
  }

  async delete(planId: string): Promise<void> {
    try {
      await fs.unlink(this.planPath(planId));
      this.logger.debug('Plan deleted', { id: planId });
    } catch (err) {
      throw new StorageError(`Failed to delete plan ${planId}`, err as Error);
    }
  }

  async list(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dataDir);
      return files.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
    } catch (err) {
      throw new StorageError('Failed to list plans', err as Error);
    }
  }

  async loadAll(): Promise<ForgePlan[]> {
    const ids = await this.list();
    const plans: ForgePlan[] = [];
    for (const id of ids) {
      try {
        plans.push(await this.load(id));
      } catch {
        this.logger.warn('Skipping unreadable plan', { id });
      }
    }
    return plans;
  }

  private planPath(planId: string): string {
    const safe = planId.replace(/[^a-zA-Z0-9_-]/g, '');
    return path.join(this.dataDir, `${safe}.json`);
  }
}

export function generatePlanId(): string {
  return `plan_${crypto.randomUUID()}`;
}
