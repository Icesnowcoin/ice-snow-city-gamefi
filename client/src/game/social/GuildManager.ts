/**
 * 工会系统管理器
 * 管理工会创建、成员管理、权限、资金等
 */

export interface GuildMember {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  joinDate: number;
  role: 'founder' | 'officer' | 'member';
  contribution: number; // 贡献值
  level: number;
  joinStatus: 'active' | 'inactive' | 'pending';
}

export interface Guild {
  guildId: string;
  guildName: string;
  guildLogo: string;
  description: string;
  founder: string;
  foundedDate: number;
  members: GuildMember[];
  maxMembers: number;
  level: number;
  funds: number; // 工会资金
  experience: number; // 工会经验
  announcement: string;
  joinRequirement: 'open' | 'approval' | 'closed'; // 加入要求
  createdAt: number;
  updatedAt: number;
}

export interface GuildInvitation {
  invitationId: string;
  guildId: string;
  guildName: string;
  playerId: string;
  playerName: string;
  invitedBy: string;
  invitedAt: number;
  expiresAt: number; // 邀请过期时间（7天）
  status: 'pending' | 'accepted' | 'rejected';
}

export interface GuildApplication {
  applicationId: string;
  guildId: string;
  guildName: string;
  playerId: string;
  playerName: string;
  playerLevel: number;
  applicationMessage: string;
  appliedAt: number;
  status: 'pending' | 'approved' | 'rejected';
}

export type GuildEventType = 
  | 'guildCreated'
  | 'memberJoined'
  | 'memberLeft'
  | 'memberRemoved'
  | 'roleChanged'
  | 'guildLevelUp'
  | 'announcementUpdated'
  | 'fundUpdated'
  | 'invitationSent'
  | 'invitationAccepted'
  | 'applicationReceived'
  | 'applicationApproved';

export interface GuildEvent {
  type: GuildEventType;
  guildId: string;
  timestamp: number;
  data: Record<string, any>;
}

type GuildEventListener = (event: GuildEvent) => void;

export class GuildManager {
  private guilds: Map<string, Guild> = new Map();
  private invitations: Map<string, GuildInvitation> = new Map();
  private applications: Map<string, GuildApplication> = new Map();
  private playerGuilds: Map<string, string> = new Map(); // playerId -> guildId
  private eventListeners: GuildEventListener[] = [];

  /**
   * 创建工会
   */
  createGuild(
    guildName: string,
    founderId: string,
    founderName: string,
    founderAvatar: string,
    description: string = '',
    logo: string = ''
  ): Guild {
    const guildId = `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const founder: GuildMember = {
      playerId: founderId,
      playerName: founderName,
      playerAvatar: founderAvatar,
      joinDate: now,
      role: 'founder',
      contribution: 0,
      level: 1,
      joinStatus: 'active',
    };

    const guild: Guild = {
      guildId,
      guildName,
      guildLogo: logo,
      description,
      founder: founderId,
      foundedDate: now,
      members: [founder],
      maxMembers: 50,
      level: 1,
      funds: 0,
      experience: 0,
      announcement: '',
      joinRequirement: 'approval',
      createdAt: now,
      updatedAt: now,
    };

    this.guilds.set(guildId, guild);
    this.playerGuilds.set(founderId, guildId);

    this.emitEvent({
      type: 'guildCreated',
      guildId,
      timestamp: now,
      data: { guildName, founderId },
    });

    return guild;
  }

  /**
   * 解散工会（仅创始人可操作）
   */
  dissolveGuild(guildId: string, playerId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.founder !== playerId) {
      return false;
    }

    // 移除所有成员的工会关联
    guild.members.forEach((member) => {
      this.playerGuilds.delete(member.playerId);
    });

    this.guilds.delete(guildId);
    return true;
  }

  /**
   * 邀请玩家加入工会
   */
  invitePlayer(
    guildId: string,
    playerId: string,
    playerName: string,
    invitedBy: string
  ): GuildInvitation {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      throw new Error('Guild not found');
    }

    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const invitation: GuildInvitation = {
      invitationId,
      guildId,
      guildName: guild.guildName,
      playerId,
      playerName,
      invitedBy,
      invitedAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7天过期
      status: 'pending',
    };

    this.invitations.set(invitationId, invitation);

    this.emitEvent({
      type: 'invitationSent',
      guildId,
      timestamp: now,
      data: { playerId, playerName, invitedBy },
    });

    return invitation;
  }

  /**
   * 接受工会邀请
   */
  acceptInvitation(invitationId: string): boolean {
    const invitation = this.invitations.get(invitationId);
    if (!invitation || invitation.status !== 'pending') {
      return false;
    }

    if (invitation.expiresAt < Date.now()) {
      invitation.status = 'rejected';
      return false;
    }

    const guild = this.guilds.get(invitation.guildId);
    if (!guild || guild.members.length >= guild.maxMembers) {
      return false;
    }

    // 添加成员
    const newMember: GuildMember = {
      playerId: invitation.playerId,
      playerName: invitation.playerName,
      playerAvatar: '', // 需要从玩家数据获取
      joinDate: Date.now(),
      role: 'member',
      contribution: 0,
      level: 1,
      joinStatus: 'active',
    };

    guild.members.push(newMember);
    this.playerGuilds.set(invitation.playerId, invitation.guildId);
    invitation.status = 'accepted';

    this.emitEvent({
      type: 'invitationAccepted',
      guildId: invitation.guildId,
      timestamp: Date.now(),
      data: { playerId: invitation.playerId, playerName: invitation.playerName },
    });

    return true;
  }

  /**
   * 拒绝工会邀请
   */
  rejectInvitation(invitationId: string): boolean {
    const invitation = this.invitations.get(invitationId);
    if (!invitation || invitation.status !== 'pending') {
      return false;
    }

    invitation.status = 'rejected';
    return true;
  }

  /**
   * 申请加入工会
   */
  applyToGuild(
    guildId: string,
    playerId: string,
    playerName: string,
    playerLevel: number,
    message: string = ''
  ): GuildApplication {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      throw new Error('Guild not found');
    }

    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const application: GuildApplication = {
      applicationId,
      guildId,
      guildName: guild.guildName,
      playerId,
      playerName,
      playerLevel,
      applicationMessage: message,
      appliedAt: now,
      status: 'pending',
    };

    this.applications.set(applicationId, application);

    this.emitEvent({
      type: 'applicationReceived',
      guildId,
      timestamp: now,
      data: { playerId, playerName, playerLevel },
    });

    return application;
  }

  /**
   * 批准工会申请
   */
  approveApplication(applicationId: string, approvedBy: string): boolean {
    const application = this.applications.get(applicationId);
    if (!application || application.status !== 'pending') {
      return false;
    }

    const guild = this.guilds.get(application.guildId);
    if (!guild || guild.members.length >= guild.maxMembers) {
      return false;
    }

    // 添加成员
    const newMember: GuildMember = {
      playerId: application.playerId,
      playerName: application.playerName,
      playerAvatar: '',
      joinDate: Date.now(),
      role: 'member',
      contribution: 0,
      level: application.playerLevel,
      joinStatus: 'active',
    };

    guild.members.push(newMember);
    this.playerGuilds.set(application.playerId, application.guildId);
    application.status = 'approved';

    this.emitEvent({
      type: 'applicationApproved',
      guildId: application.guildId,
      timestamp: Date.now(),
      data: { playerId: application.playerId, playerName: application.playerName },
    });

    return true;
  }

  /**
   * 拒绝工会申请
   */
  rejectApplication(applicationId: string): boolean {
    const application = this.applications.get(applicationId);
    if (!application || application.status !== 'pending') {
      return false;
    }

    application.status = 'rejected';
    return true;
  }

  /**
   * 离开工会
   */
  leaveGuild(playerId: string): boolean {
    const guildId = this.playerGuilds.get(playerId);
    if (!guildId) {
      return false;
    }

    const guild = this.guilds.get(guildId);
    if (!guild) {
      return false;
    }

    // 如果是创始人，无法离开
    if (guild.founder === playerId) {
      return false;
    }

    const memberIndex = guild.members.findIndex((m) => m.playerId === playerId);
    if (memberIndex === -1) {
      return false;
    }

    const member = guild.members[memberIndex];
    guild.members.splice(memberIndex, 1);
    this.playerGuilds.delete(playerId);

    this.emitEvent({
      type: 'memberLeft',
      guildId,
      timestamp: Date.now(),
      data: { playerId, playerName: member.playerName },
    });

    return true;
  }

  /**
   * 踢出成员
   */
  kickMember(guildId: string, playerId: string, operatorId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return false;
    }

    // 检查操作者权限
    const operator = guild.members.find((m) => m.playerId === operatorId);
    if (!operator || (operator.role !== 'founder' && operator.role !== 'officer')) {
      return false;
    }

    const memberIndex = guild.members.findIndex((m) => m.playerId === playerId);
    if (memberIndex === -1) {
      return false;
    }

    const member = guild.members[memberIndex];
    guild.members.splice(memberIndex, 1);
    this.playerGuilds.delete(playerId);

    this.emitEvent({
      type: 'memberRemoved',
      guildId,
      timestamp: Date.now(),
      data: { playerId, playerName: member.playerName, removedBy: operatorId },
    });

    return true;
  }

  /**
   * 更改成员角色
   */
  changeMemberRole(
    guildId: string,
    playerId: string,
    newRole: 'officer' | 'member',
    operatorId: string
  ): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return false;
    }

    // 检查操作者权限
    const operator = guild.members.find((m) => m.playerId === operatorId);
    if (!operator || operator.role !== 'founder') {
      return false;
    }

    const member = guild.members.find((m) => m.playerId === playerId);
    if (!member) {
      return false;
    }

    const oldRole = member.role;
    member.role = newRole;

    this.emitEvent({
      type: 'roleChanged',
      guildId,
      timestamp: Date.now(),
      data: { playerId, oldRole, newRole },
    });

    return true;
  }

  /**
   * 更新公告
   */
  updateAnnouncement(guildId: string, announcement: string, operatorId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return false;
    }

    const operator = guild.members.find((m) => m.playerId === operatorId);
    if (!operator || (operator.role !== 'founder' && operator.role !== 'officer')) {
      return false;
    }

    guild.announcement = announcement;
    guild.updatedAt = Date.now();

    this.emitEvent({
      type: 'announcementUpdated',
      guildId,
      timestamp: Date.now(),
      data: { announcement },
    });

    return true;
  }

  /**
   * 更新工会资金
   */
  updateFunds(guildId: string, amount: number): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return false;
    }

    guild.funds += amount;
    guild.updatedAt = Date.now();

    this.emitEvent({
      type: 'fundUpdated',
      guildId,
      timestamp: Date.now(),
      data: { amount, totalFunds: guild.funds },
    });

    return true;
  }

  /**
   * 升级工会
   */
  levelUpGuild(guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return false;
    }

    // 检查升级条件（示例：需要足够的经验和资金）
    const requiredExp = guild.level * 1000;
    const requiredFunds = guild.level * 10000;

    if (guild.experience < requiredExp || guild.funds < requiredFunds) {
      return false;
    }

    guild.level += 1;
    guild.maxMembers += 10;
    guild.experience -= requiredExp;
    guild.funds -= requiredFunds;
    guild.updatedAt = Date.now();

    this.emitEvent({
      type: 'guildLevelUp',
      guildId,
      timestamp: Date.now(),
      data: { newLevel: guild.level, maxMembers: guild.maxMembers },
    });

    return true;
  }

  /**
   * 获取工会信息
   */
  getGuild(guildId: string): Guild | undefined {
    return this.guilds.get(guildId);
  }

  /**
   * 获取玩家所在工会
   */
  getPlayerGuild(playerId: string): Guild | undefined {
    const guildId = this.playerGuilds.get(playerId);
    return guildId ? this.guilds.get(guildId) : undefined;
  }

  /**
   * 获取所有工会（用于工会列表）
   */
  getAllGuilds(): Guild[] {
    return Array.from(this.guilds.values());
  }

  /**
   * 获取玩家的邀请列表
   */
  getPlayerInvitations(playerId: string): GuildInvitation[] {
    return Array.from(this.invitations.values()).filter(
      (inv) => inv.playerId === playerId && inv.status === 'pending'
    );
  }

  /**
   * 获取工会的申请列表
   */
  getGuildApplications(guildId: string): GuildApplication[] {
    return Array.from(this.applications.values()).filter(
      (app) => app.guildId === guildId && app.status === 'pending'
    );
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: GuildEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(listener: GuildEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: GuildEvent): void {
    this.eventListeners.forEach((listener) => listener(event));
  }

  /**
   * 清理过期邀请
   */
  cleanupExpiredInvitations(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    this.invitations.forEach((invitation, id) => {
      if (invitation.expiresAt < now && invitation.status === 'pending') {
        expiredIds.push(id);
      }
    });

    expiredIds.forEach((id) => this.invitations.delete(id));
  }
}
