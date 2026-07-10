/**
 * Discord permission bitflags used by Forge Plan permission overwrites.
 *
 * These are the subset of permissions relevant to channel-level overwrites.
 * Values mirror Discord's API bitfield constants.
 */
export const Permissions = {
  VIEW_CHANNEL: 1n << 0n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_EMOJIS_AND_STICKERS: 1n << 30n,
  VIEW_AUDIT_LOG: 1n << 3n,
  MANAGE_WEBHOOKS: 1n << 29n,
  SEND_MESSAGES: 1n << 11n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  ADD_REACTIONS: 1n << 6n,
  USE_EXTERNAL_EMOJIS: 1n << 37n,
  USE_EXTERNAL_STICKERS: 1n << 37n,
  MENTION_EVERYONE: 1n << 17n,
  MANAGE_MESSAGES: 1n << 13n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
  CREATE_PUBLIC_THREADS: 1n << 35n,
  CREATE_PRIVATE_THREADS: 1n << 34n,
  USE_APPLICATION_COMMANDS: 1n << 31n,
  MANAGE_EVENTS: 1n << 33n,
  MANAGE_THREADS: 1n << 34n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  STREAM: 1n << 9n,
  USE_VAD: 1n << 25n,
  PRIORITY_SPEAKER: 1n << 8n,
  MUTE_MEMBERS: 1n << 22n,
  DEAFEN_MEMBERS: 1n << 23n,
  MOVE_MEMBERS: 1n << 24n,
  REQUEST_TO_SPEAK: 1n << 32n,
  USE_EMBEDDED_ACTIVITIES: 1n << 39n,
} as const;

export type PermissionName = keyof typeof Permissions;

/**
 * Channel types supported by Forge Plan.
 */
export enum ChannelType {
  TEXT = 'text',
  VOICE = 'voice',
  FORUM = 'forum',
  ANNOUNCEMENT = 'announcement',
  STAGE = 'stage',
}

/**
 * Permission overwrite target types.
 */
export enum OverwriteType {
  ROLE = 'role',
  MEMBER = 'member',
}

/**
 * Role display style.
 */
export enum RoleDisplayStyle {
  INLINE = 'inline',
  SEPARATE = 'separate',
  NONE = 'none',
}

/**
 * Forge Plan status lifecycle.
 */
export enum PlanStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  BUILDING = 'building',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Build phase identifiers, used for progress tracking.
 */
export enum BuildPhase {
  ROLES = 'roles',
  CATEGORIES = 'categories',
  CHANNELS = 'channels',
  PERMISSIONS = 'permissions',
  CLEANUP = 'cleanup',
}

/**
 * Severity levels for validation diagnostics.
 */
export enum DiagnosticSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * AI provider identifiers.
 */
export enum AIProvider {
  NVIDIA = 'nvidia',
  OLLAMA = 'ollama',
  OPENAI = 'openai',
  CUSTOM = 'custom',
}

/**
 * Application log levels.
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SILENT = 'silent',
}
