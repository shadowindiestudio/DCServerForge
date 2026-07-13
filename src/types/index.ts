import {
  ChannelType,
  OverwriteType,
  RoleDisplayStyle,
  PlanStatus,
  BuildPhase,
  DiagnosticSeverity,
  AIProvider,
  LogLevel,
} from './enums.js';

export {
  ChannelType,
  OverwriteType,
  RoleDisplayStyle,
  PlanStatus,
  BuildPhase,
  DiagnosticSeverity,
  AIProvider,
  LogLevel,
};

/** A permission overwrite applied to a specific channel. */
export interface PermissionOverwrite {
  readonly id: string;
  readonly type: OverwriteType;
  readonly allow: string;
  readonly deny: string;
}

/** A Discord role within a Forge Plan. */
export interface ForgeRole {
  readonly id: string;
  readonly name: string;
  readonly color?: number;
  readonly hoist: boolean;
  readonly mentionable: boolean;
  readonly permissions: string;
  readonly position: number;
  readonly displayStyle?: RoleDisplayStyle;
  readonly iconEmoji?: string;
}

/** A channel within a Forge Plan category. */
export interface ForgeChannel {
  readonly id: string;
  readonly name: string;
  readonly type: ChannelType;
  readonly topic?: string;
  readonly position?: number;
  readonly nsfw?: boolean;
  readonly bitrate?: number;
  readonly userLimit?: number;
  readonly rateLimitPerUser?: number;
  readonly parentId: string;
  readonly overwrites: readonly PermissionOverwrite[];
}

/** A category containing channels. */
export interface ForgeCategory {
  readonly id: string;
  readonly name: string;
  readonly position: number;
  readonly channels: readonly ForgeChannel[];
  readonly overwrites: readonly PermissionOverwrite[];
}

/** The complete server blueprint. */
export interface ForgePlan {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly status: PlanStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly roles: readonly ForgeRole[];
  readonly categories: readonly ForgeCategory[];
  readonly metadata: Record<string, unknown>;
}

/** A single validation diagnostic. */
export interface ValidationDiagnostic {
  readonly severity: DiagnosticSeverity;
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly entityId?: string;
}

/** Result of validating a Forge Plan. */
export interface ValidationResult {
  readonly valid: boolean;
  readonly diagnostics: readonly ValidationDiagnostic[];
}

/** A single build step result. */
export interface BuildStepResult {
  readonly phase: BuildPhase;
  readonly success: boolean;
  /** True when the resource was detected as already existing and was not created. */
  readonly skipped?: boolean;
  readonly skipReason?: string;
  readonly entityId: string;
  readonly discordId?: string;
  readonly message: string;
  readonly error?: string;
}

/** Aggregated counts from a finished build, derived from BuildStepResult[]. */
export interface BuildSummary {
  readonly total: number;
  readonly created: number;
  readonly skipped: number;
  readonly failed: number;
  readonly elapsedMs: number;
}

/** Progress update emitted during a build. */
export interface BuildProgress {
  readonly planId: string;
  readonly phase: BuildPhase;
  readonly completed: number;
  readonly total: number;
  readonly currentEntity: string;
  readonly stepResult?: BuildStepResult;
}

/** Final result of a build operation. */
export interface BuildResult {
  readonly planId: string;
  readonly success: boolean;
  readonly guildId: string;
  readonly steps: readonly BuildStepResult[];
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly error?: string;
}

/** Request sent to an AI provider to generate a Forge Plan. */
export interface AIRequest {
  readonly prompt: string;
  readonly guildId: string;
  readonly guildName: string;
  readonly context?: Record<string, unknown>;
}

/** Response from an AI provider containing a generated plan. */
export interface AIResponse {
  readonly content: string;
  readonly usage?: {
    readonly promptTokens?: number;
    readonly completionTokens?: number;
    readonly totalTokens?: number;
  };
  readonly model?: string;
  readonly finishReason?: string;
}

/** A message in a provider chat completion request. */
export interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

/** Configuration for an AI provider instance. */
export interface ProviderConfig {
  readonly provider: AIProvider;
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly model?: string;
  readonly timeoutMs?: number;
}

/** Application configuration loaded from environment. */
export interface AppConfig {
  readonly discord: {
    readonly token: string;
    readonly clientId: string;
    readonly guildId?: string;
    readonly ownerId?: string;
  };
  readonly ai: ProviderConfig;
  readonly storage: {
    readonly dir: string;
  };
  readonly log: {
    readonly level: LogLevel;
  };
  readonly nodeEnv: string;
}

/** A diff entry between two Forge Plans. */
export interface DiffEntry {
  readonly type: 'added' | 'removed' | 'modified' | 'moved';
  readonly entityType: 'role' | 'category' | 'channel' | 'overwrite' | 'plan';
  readonly entityId: string;
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
  readonly path: string;
}

/** Result of diffing two Forge Plans. */
export interface DiffResult {
  readonly entries: readonly DiffEntry[];
  readonly hasChanges: boolean;
}

/** A stored Forge Plan record. */
export interface StoredPlan {
  readonly id: string;
  readonly plan: ForgePlan;
  readonly storedAt: string;
}

/** Context passed to command handlers. */
export interface CommandContext {
  readonly planId?: string;
  readonly userId: string;
  readonly guildId: string;
  readonly guildName: string;
  readonly locale?: string;
}

/** Options for registering a slash command. */
export interface CommandRegistrationOptions {
  readonly guildId?: string;
  readonly clearExisting: boolean;
}
