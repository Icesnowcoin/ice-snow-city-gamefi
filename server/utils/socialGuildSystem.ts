/**
 * 社交和联盟系统 (Phase 89)
 */

export interface Guild {
  id: string;
  name: string;
  leader: string;
  members: string[];
  level: number;
  treasury: number;
  createdAt: number;
  description: string;
}

export interface PlayerFriend {
  playerId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: number;
}

export interface SocialMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'chat' | 'trade_request' | 'guild_invite';
  read: boolean;
  createdAt: number;
}

export class SocialGuildSystem {
  private guilds: Map<string, Guild> = new Map();
  private playerGuilds: Map<string, string> = new Map(); // playerId -> guildId
  private friendships: Map<string, PlayerFriend[]> = new Map();
  private messages: Map<string, SocialMessage[]> = new Map();

  createGuild(name: string, leader: string, description: string): Guild {
    const guild: Guild = {
      id: `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      leader,
      members: [leader],
      level: 1,
      treasury: 0,
      createdAt: Date.now(),
      description,
    };

    this.guilds.set(guild.id, guild);
    this.playerGuilds.set(leader, guild.id);
    return guild;
  }

  joinGuild(playerId: string, guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    if (!guild.members.includes(playerId)) {
      guild.members.push(playerId);
      this.playerGuilds.set(playerId, guildId);
      return true;
    }
    return false;
  }

  leaveGuild(playerId: string): boolean {
    const guildId = this.playerGuilds.get(playerId);
    if (!guildId) return false;

    const guild = this.guilds.get(guildId);
    if (guild) {
      guild.members = guild.members.filter((m) => m !== playerId);
      this.playerGuilds.delete(playerId);
      return true;
    }
    return false;
  }

  getGuild(guildId: string): Guild | null {
    return this.guilds.get(guildId) || null;
  }

  getPlayerGuild(playerId: string): Guild | null {
    const guildId = this.playerGuilds.get(playerId);
    if (!guildId) return null;
    return this.guilds.get(guildId) || null;
  }

  addFriend(playerId: string, friendId: string): PlayerFriend {
    const friendship: PlayerFriend = {
      playerId,
      friendId,
      status: 'pending',
      createdAt: Date.now(),
    };

    if (!this.friendships.has(playerId)) {
      this.friendships.set(playerId, []);
    }
    this.friendships.get(playerId)!.push(friendship);

    return friendship;
  }

  acceptFriendRequest(playerId: string, friendId: string): boolean {
    const friendships = this.friendships.get(playerId);
    if (!friendships) return false;

    const friendship = friendships.find((f) => f.friendId === friendId);
    if (friendship) {
      friendship.status = 'accepted';
      return true;
    }
    return false;
  }

  getFriends(playerId: string): PlayerFriend[] {
    return this.friendships.get(playerId) || [];
  }

  sendMessage(from: string, to: string, content: string, type: SocialMessage['type']): SocialMessage {
    const message: SocialMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      content,
      type,
      read: false,
      createdAt: Date.now(),
    };

    if (!this.messages.has(to)) {
      this.messages.set(to, []);
    }
    this.messages.get(to)!.push(message);

    return message;
  }

  getMessages(playerId: string): SocialMessage[] {
    return this.messages.get(playerId) || [];
  }

  markMessageAsRead(playerId: string, messageId: string): boolean {
    const messages = this.messages.get(playerId);
    if (!messages) return false;

    const message = messages.find((m) => m.id === messageId);
    if (message) {
      message.read = true;
      return true;
    }
    return false;
  }

  getSystemStats() {
    return {
      totalGuilds: this.guilds.size,
      totalFriendships: Array.from(this.friendships.values()).reduce((sum, f) => sum + f.length, 0),
      totalMessages: Array.from(this.messages.values()).reduce((sum, m) => sum + m.length, 0),
    };
  }
}

export default SocialGuildSystem;
