import { z } from 'zod';
import { ChannelType, OverwriteType, RoleDisplayStyle, PlanStatus } from '../types/enums.js';

export const permissionOverwriteSchema = z.object({
  id: z.string().min(1),
  type: z.nativeEnum(OverwriteType),
  allow: z.string(),
  deny: z.string(),
});

export const forgeRoleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  color: z.number().int().min(0).max(0xffffff).optional(),
  hoist: z.boolean().default(false),
  mentionable: z.boolean().default(false),
  permissions: z.string().default('0'),
  position: z.number().int().default(0),
  displayStyle: z.nativeEnum(RoleDisplayStyle).optional(),
  iconEmoji: z.string().optional(),
});

export const forgeChannelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(ChannelType),
  topic: z.string().max(1024).optional(),
  position: z.number().int().optional(),
  nsfw: z.boolean().optional(),
  bitrate: z.number().int().min(8000).max(384000).optional(),
  userLimit: z.number().int().min(0).max(99).optional(),
  rateLimitPerUser: z.number().int().min(0).max(21600).optional(),
  parentId: z.string().min(1),
  overwrites: z.array(permissionOverwriteSchema).default([]),
});

export const forgeCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  position: z.number().int().default(0),
  channels: z.array(forgeChannelSchema).default([]),
  overwrites: z.array(permissionOverwriteSchema).default([]),
});

export const forgePlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(PlanStatus).default(PlanStatus.DRAFT),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  roles: z.array(forgeRoleSchema).default([]),
  categories: z.array(forgeCategorySchema).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type PermissionOverwriteSchema = z.infer<typeof permissionOverwriteSchema>;
export type ForgeRoleSchema = z.infer<typeof forgeRoleSchema>;
export type ForgeChannelSchema = z.infer<typeof forgeChannelSchema>;
export type ForgeCategorySchema = z.infer<typeof forgeCategorySchema>;
export type ForgePlanSchema = z.infer<typeof forgePlanSchema>;
