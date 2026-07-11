import type {
  ForgePlan,
  ForgeRole,
  ForgeCategory,
  ForgeChannel,
  PermissionOverwrite,
} from '../types/index.js';
import type { ChannelType, OverwriteType, RoleDisplayStyle } from '../types/enums.js';
import { PlanStatus } from '../types/enums.js';

export function createPermissionOverwrite(data: {
  id: string;
  type: OverwriteType;
  allow?: string;
  deny?: string;
}): PermissionOverwrite {
  return {
    id: data.id,
    type: data.type,
    allow: data.allow ?? '0',
    deny: data.deny ?? '0',
  };
}

export function createRole(data: {
  id: string;
  name: string;
  color?: number;
  hoist?: boolean;
  mentionable?: boolean;
  permissions?: string;
  position?: number;
  displayStyle?: RoleDisplayStyle;
  iconEmoji?: string;
}): ForgeRole {
  return {
    id: data.id,
    name: data.name,
    color: data.color,
    hoist: data.hoist ?? false,
    mentionable: data.mentionable ?? false,
    permissions: data.permissions ?? '0',
    position: data.position ?? 0,
    displayStyle: data.displayStyle,
    iconEmoji: data.iconEmoji,
  };
}

export function createChannel(data: {
  id: string;
  name: string;
  type: ChannelType;
  parentId: string;
  topic?: string;
  position?: number;
  nsfw?: boolean;
  bitrate?: number;
  userLimit?: number;
  rateLimitPerUser?: number;
  overwrites?: PermissionOverwrite[];
}): ForgeChannel {
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    topic: data.topic,
    position: data.position,
    nsfw: data.nsfw,
    bitrate: data.bitrate,
    userLimit: data.userLimit,
    rateLimitPerUser: data.rateLimitPerUser,
    parentId: data.parentId,
    overwrites: data.overwrites ?? [],
  };
}

export function createCategory(data: {
  id: string;
  name: string;
  position?: number;
  channels?: ForgeChannel[];
  overwrites?: PermissionOverwrite[];
}): ForgeCategory {
  return {
    id: data.id,
    name: data.name,
    position: data.position ?? 0,
    channels: data.channels ?? [],
    overwrites: data.overwrites ?? [],
  };
}

export function createPlan(data: {
  id: string;
  name: string;
  description?: string;
  roles?: ForgeRole[];
  categories?: ForgeCategory[];
  metadata?: Record<string, unknown>;
}): ForgePlan {
  const now = new Date().toISOString();
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    status: PlanStatus.DRAFT,
    createdAt: now,
    updatedAt: now,
    roles: data.roles ?? [],
    categories: data.categories ?? [],
    metadata: data.metadata ?? {},
  };
}

export function updatePlanStatus(plan: ForgePlan, status: PlanStatus): ForgePlan {
  return { ...plan, status, updatedAt: new Date().toISOString() };
}
