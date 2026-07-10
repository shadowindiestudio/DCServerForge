# Forge Plan Schema

A Forge Plan is the JSON structure that defines a complete Discord server blueprint.

## Top-Level Structure

```typescript
interface ForgePlan {
  id: string;              // Unique plan identifier (plan_<uuid>)
  name: string;            // Server name (max 100 chars)
  description?: string;    // Optional description (max 500 chars)
  status: PlanStatus;      // draft | validated | building | completed | failed
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
  roles: ForgeRole[];      // Role definitions
  categories: ForgeCategory[]; // Category definitions (contain channels)
  metadata: Record<string, unknown>; // Arbitrary metadata
}
```

## Role

```typescript
interface ForgeRole {
  id: string;              // Unique role ID (role_<unique>)
  name: string;            // Role name (max 100 chars)
  color?: number;          // Decimal color (0 to 16777215)
  hoist: boolean;          // Display separately in member list
  mentionable: boolean;    // Can be @mentioned
  permissions: string;    // Discord permission bitfield as string
  position: number;        // Sort position
  displayStyle?: RoleDisplayStyle; // inline | separate | none
  iconEmoji?: string;      // Role icon emoji
}
```

## Category

```typescript
interface ForgeCategory {
  id: string;              // Unique category ID (cat_<unique>)
  name: string;            // Category name (max 100 chars)
  position: number;        // Sort position
  channels: ForgeChannel[]; // Channels in this category
  overwrites: PermissionOverwrite[]; // Category-level permission overwrites
}
```

## Channel

```typescript
interface ForgeChannel {
  id: string;              // Unique channel ID (ch_<unique>)
  name: string;            // Channel name (lowercase, hyphens)
  type: ChannelType;       // text | voice | forum | announcement | stage
  topic?: string;          // Channel topic (max 1024 chars)
  position?: number;       // Sort position within category
  nsfw?: boolean;          // NSFW flag
  bitrate?: number;        // Voice bitrate (8000-384000)
  userLimit?: number;      // Voice user limit (0-99)
  rateLimitPerUser?: number; // Slowmode seconds (0-21600)
  parentId: string;        // Must match containing category ID
  overwrites: PermissionOverwrite[]; // Channel-level permission overwrites
}
```

## Permission Overwrite

```typescript
interface PermissionOverwrite {
  id: string;              // Role or member ID
  type: OverwriteType;     // role | member
  allow: string;           // Allowed permissions bitfield as string
  deny: string;            // Denied permissions bitfield as string
}
```

## Example

```json
{
  "id": "plan_abc123",
  "name": "Gaming Community",
  "description": "A gaming community server",
  "status": "draft",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "roles": [
    {
      "id": "role_admin",
      "name": "Admin",
      "color": 16711680,
      "hoist": true,
      "mentionable": true,
      "permissions": "8",
      "position": 10
    },
    {
      "id": "role_member",
      "name": "Member",
      "hoist": false,
      "mentionable": false,
      "permissions": "0",
      "position": 1
    }
  ],
  "categories": [
    {
      "id": "cat_info",
      "name": "Information",
      "position": 0,
      "channels": [
        {
          "id": "ch_welcome",
          "name": "welcome",
          "type": "text",
          "topic": "Welcome to the server!",
          "parentId": "cat_info",
          "overwrites": []
        },
        {
          "id": "ch_rules",
          "name": "rules",
          "type": "text",
          "topic": "Server rules",
          "parentId": "cat_info",
          "overwrites": []
        }
      ],
      "overwrites": []
    },
    {
      "id": "cat_voice",
      "name": "Voice Channels",
      "position": 1,
      "channels": [
        {
          "id": "ch_general_vc",
          "name": "General VC",
          "type": "voice",
          "userLimit": 10,
          "parentId": "cat_voice",
          "overwrites": []
        }
      ],
      "overwrites": []
    }
  ],
  "metadata": {}
}
```
