import type { Client, Guild, Role, CategoryChannel, GuildChannel } from 'discord.js';
import type { GuildState } from './interfaces.js';

export class GuildStateFetcher {
  constructor(private readonly client: Client) {}

  async fetchGuild(guildId: string): Promise<Guild> {
    const guild = await this.client.guilds.fetch(guildId);
    if (!guild) throw new Error(`Guild not found: ${guildId}`);
    return guild;
  }

  async getCurrentState(guildId: string): Promise<GuildState> {
    const guild = await this.fetchGuild(guildId);
    await guild.roles.fetch();
    await guild.channels.fetch();

    const existingRoles = new Map<string, { id: string; name: string }>();
    for (const role of guild.roles.cache.values()) {
      existingRoles.set(role.name.toLowerCase(), { id: role.id, name: role.name });
    }

    const existingCategories = new Map<string, { id: string; name: string }>();
    const existingChannels = new Map<
      string,
      { id: string; name: string; parentId: string | null }
    >();

    for (const channel of guild.channels.cache.values()) {
      if (channel.type === 4) {
        existingCategories.set(channel.name.toLowerCase(), { id: channel.id, name: channel.name });
      }
      existingChannels.set(channel.name.toLowerCase(), {
        id: channel.id,
        name: channel.name,
        parentId: channel.parentId,
      });
    }

    return { existingRoles, existingCategories, existingChannels };
  }

  async createRole(
    guild: Guild,
    data: {
      name: string;
      color: number;
      hoist: boolean;
      mentionable: boolean;
      permissions: string;
      position: number;
    },
  ): Promise<Role> {
    return guild.roles.create({
      name: data.name,
      color: data.color,
      hoist: data.hoist,
      mentionable: data.mentionable,
      permissions: BigInt(data.permissions),
      position: data.position,
    });
  }

  async createCategory(
    guild: Guild,
    data: { name: string; position: number },
  ): Promise<CategoryChannel> {
    return guild.channels.create({
      name: data.name,
      type: 4,
      position: data.position,
    }) as unknown as Promise<CategoryChannel>;
  }

  async createTextChannel(
    guild: Guild,
    data: {
      name: string;
      topic: string;
      parent: CategoryChannel;
      position: number;
      nsfw: boolean;
      rateLimitPerUser: number;
    },
  ): Promise<GuildChannel> {
    return guild.channels.create({
      name: data.name,
      type: 0,
      topic: data.topic,
      parent: data.parent,
      position: data.position,
      nsfw: data.nsfw,
      rateLimitPerUser: data.rateLimitPerUser,
    });
  }

  async createVoiceChannel(
    guild: Guild,
    data: {
      name: string;
      bitrate: number;
      userLimit: number;
      parent: CategoryChannel;
      position: number;
    },
  ): Promise<GuildChannel> {
    return guild.channels.create({
      name: data.name,
      type: 2,
      bitrate: data.bitrate,
      userLimit: data.userLimit,
      parent: data.parent,
      position: data.position,
    });
  }

  async createForumChannel(
    guild: Guild,
    data: { name: string; topic: string; parent: CategoryChannel; position: number },
  ): Promise<GuildChannel> {
    return guild.channels.create({
      name: data.name,
      type: 15,
      topic: data.topic,
      parent: data.parent,
      position: data.position,
    });
  }

  async createAnnouncementChannel(
    guild: Guild,
    data: { name: string; topic: string; parent: CategoryChannel; position: number },
  ): Promise<GuildChannel> {
    return guild.channels.create({
      name: data.name,
      type: 5,
      topic: data.topic,
      parent: data.parent,
      position: data.position,
    });
  }

  async createStageChannel(
    guild: Guild,
    data: { name: string; parent: CategoryChannel; position: number },
  ): Promise<GuildChannel> {
    return guild.channels.create({
      name: data.name,
      type: 13,
      parent: data.parent,
      position: data.position,
    });
  }

  async deleteChannel(guild: Guild, channelId: string): Promise<void> {
    const channel = guild.channels.cache.get(channelId);
    if (channel) await channel.delete();
  }

  async deleteRole(guild: Guild, roleId: string): Promise<void> {
    const role = guild.roles.cache.get(roleId);
    if (role) await role.delete();
  }
}
