import type { ChatMessage } from '../../types/index.js';

export const SYSTEM_PROMPT = `You are DCServerForge, a Discord server architecture assistant.
Given a natural language description, generate a Forge Plan JSON that defines the complete server structure.

The Forge Plan must follow this structure:
{
  "id": "plan_<uuid>",
  "name": "Server Name",
  "description": "Optional description",
  "status": "draft",
  "createdAt": "<ISO 8601 timestamp>",
  "updatedAt": "<ISO 8601 timestamp>",
  "roles": [
    {
      "id": "role_<unique_id>",
      "name": "Role Name",
      "color": 0,
      "hoist": false,
      "mentionable": false,
      "permissions": "0",
      "position": 0
    }
  ],
  "categories": [
    {
      "id": "cat_<unique_id>",
      "name": "Category Name",
      "position": 0,
      "channels": [
        {
          "id": "ch_<unique_id>",
          "name": "channel-name",
          "type": "text|voice|forum|announcement|stage",
          "topic": "Optional topic",
          "parentId": "cat_<matching_id>",
          "overwrites": []
        }
      ],
      "overwrites": []
    }
  ],
  "metadata": {}
}

Rules:
- Channel names must be lowercase, use hyphens not spaces.
- Every channel must have a parentId matching its containing category id.
- Role permissions must be a numeric string (Discord permission bitfield).
- Color must be a decimal integer (0 to 16777215).
- Use unique ids for every entity (role_, cat_, ch_ prefixes).
- Respond ONLY with the Forge Plan JSON. No markdown, no explanation.`;

export function buildPlanGenerationPrompt(userPrompt: string, guildName: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Guild name: ${guildName}\n\nUser request:\n${userPrompt}`,
    },
  ];
}
