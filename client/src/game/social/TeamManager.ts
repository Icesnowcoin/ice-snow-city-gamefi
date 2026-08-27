/**
 * 组队系统管理器
 * 管理玩家组队、队伍管理、成员邀请等
 */

export type TeamRole = 'leader' | 'member';
export type TeamStatus = 'recruiting' | 'full' | 'disbanded';

export interface TeamMember {
  userId: string;
  userName: string;
  userLevel: number;
  userAvatar?: string;
  role: TeamRole;
  joinedAt: number;
  status: 'online' | 'offline';
}

export interface Team {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  members: TeamMember[];
  maxMembers: number;
  status: TeamStatus;
  createdAt: number;
  description?: string;
  tags?: string[];
  objectives?: string[];
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message?: string;
  createdAt: number;
  expiresAt: number;
}

export class TeamManager {
  private teams: Map<string, Team> = new Map();
  private userTeam: Map<string, string> = new Map(); // userId -> teamId
  private invitations: Map<string, TeamInvitation> = new Map();
  private listeners: {
    onTeamCreated: Array<(team: Team) => void>;
    onTeamDeleted: Array<(teamId: string) => void>;
    onMemberJoined: Array<(teamId: string, member: TeamMember) => void>;
    onMemberLeft: Array<(teamId: string, userId: string) => void>;
    onInvitationReceived: Array<(invitation: TeamInvitation) => void>;
    onTeamStatusChange: Array<(teamId: string, status: TeamStatus) => void>;
  } = {
    onTeamCreated: [],
    onTeamDeleted: [],
    onMemberJoined: [],
    onMemberLeft: [],
    onInvitationReceived: [],
    onTeamStatusChange: [],
  };

  /**
   * 创建队伍
   */
  createTeam(
    leaderId: string,
    leaderName: string,
    teamName: string,
    maxMembers: number = 4,
    leaderAvatar?: string
  ): Team {
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const leader: TeamMember = {
      userId: leaderId,
      userName: leaderName,
      userLevel: 1,
      userAvatar: leaderAvatar,
      role: 'leader',
      joinedAt: Date.now(),
      status: 'online',
    };

    const team: Team = {
      id: teamId,
      name: teamName,
      leaderId,
      leaderName,
      members: [leader],
      maxMembers,
      status: 'recruiting',
      createdAt: Date.now(),
    };

    this.teams.set(teamId, team);
    this.userTeam.set(leaderId, teamId);
    this.notifyListeners('onTeamCreated', team);

    return team;
  }

  /**
   * 邀请成员加入队伍
   */
  inviteMember(
    teamId: string,
    fromUserId: string,
    fromUserName: string,
    toUserId: string,
    message?: string
  ): TeamInvitation {
    const team = this.teams.get(teamId);
    if (!team) throw new Error('Team not found');

    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24小时后过期

    const invitation: TeamInvitation = {
      id: invitationId,
      teamId,
      teamName: team.name,
      fromUserId,
      fromUserName,
      toUserId,
      message,
      createdAt: Date.now(),
      expiresAt,
    };

    this.invitations.set(invitationId, invitation);
    this.notifyListeners('onInvitationReceived', invitation);

    return invitation;
  }

  /**
   * 接受队伍邀请
   */
  acceptInvitation(
    invitationId: string,
    userId: string,
    userName: string,
    userLevel: number,
    userAvatar?: string
  ): Team | null {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) return null;

    // 检查邀请是否过期
    if (Date.now() > invitation.expiresAt) {
      this.invitations.delete(invitationId);
      return null;
    }

    const team = this.teams.get(invitation.teamId);
    if (!team) return null;

    // 检查队伍是否已满
    if (team.members.length >= team.maxMembers) {
      return null;
    }

    // 检查用户是否已在其他队伍中
    if (this.userTeam.has(userId)) {
      return null;
    }

    // 添加成员
    const newMember: TeamMember = {
      userId,
      userName,
      userLevel,
      userAvatar,
      role: 'member',
      joinedAt: Date.now(),
      status: 'online',
    };

    team.members.push(newMember);
    this.userTeam.set(userId, team.id);

    // 更新队伍状态
    if (team.members.length >= team.maxMembers) {
      team.status = 'full';
      this.notifyListeners('onTeamStatusChange', team.id, 'full');
    }

    this.invitations.delete(invitationId);
    this.notifyListeners('onMemberJoined', team.id, newMember);

    return team;
  }

  /**
   * 拒绝队伍邀请
   */
  rejectInvitation(invitationId: string): void {
    this.invitations.delete(invitationId);
  }

  /**
   * 成员离开队伍
   */
  leaveMember(teamId: string, userId: string): Team | null {
    const team = this.teams.get(teamId);
    if (!team) return null;

    // 队长不能离开（除非解散队伍）
    if (team.leaderId === userId) {
      return null;
    }

    team.members = team.members.filter((m) => m.userId !== userId);
    this.userTeam.delete(userId);

    // 更新队伍状态
    if (team.members.length < team.maxMembers && team.status === 'full') {
      team.status = 'recruiting';
      this.notifyListeners('onTeamStatusChange', team.id, 'recruiting');
    }

    this.notifyListeners('onMemberLeft', team.id, userId);

    return team;
  }

  /**
   * 踢出成员
   */
  kickMember(teamId: string, leaderId: string, userId: string): Team | null {
    const team = this.teams.get(teamId);
    if (!team || team.leaderId !== leaderId) return null;

    return this.leaveMember(teamId, userId);
  }

  /**
   * 解散队伍
   */
  disbandTeam(teamId: string, leaderId: string): void {
    const team = this.teams.get(teamId);
    if (!team || team.leaderId !== leaderId) return;

    // 移除所有成员的队伍绑定
    team.members.forEach((member) => {
      this.userTeam.delete(member.userId);
    });

    this.teams.delete(teamId);
    this.notifyListeners('onTeamDeleted', teamId);
  }

  /**
   * 获取队伍
   */
  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId);
  }

  /**
   * 获取用户所在队伍
   */
  getUserTeam(userId: string): Team | undefined {
    const teamId = this.userTeam.get(userId);
    return teamId ? this.teams.get(teamId) : undefined;
  }

  /**
   * 获取所有队伍
   */
  getAllTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  /**
   * 获取招募中的队伍
   */
  getRecruitingTeams(): Team[] {
    return Array.from(this.teams.values()).filter((t) => t.status === 'recruiting');
  }

  /**
   * 获取用户的邀请列表
   */
  getUserInvitations(userId: string): TeamInvitation[] {
    return Array.from(this.invitations.values()).filter(
      (inv) => inv.toUserId === userId && Date.now() <= inv.expiresAt
    );
  }

  /**
   * 更新成员状态
   */
  updateMemberStatus(teamId: string, userId: string, status: 'online' | 'offline'): void {
    const team = this.teams.get(teamId);
    if (team) {
      const member = team.members.find((m) => m.userId === userId);
      if (member) {
        member.status = status;
      }
    }
  }

  /**
   * 获取队伍成员数
   */
  getTeamMemberCount(teamId: string): number {
    const team = this.teams.get(teamId);
    return team ? team.members.length : 0;
  }

  /**
   * 检查用户是否在队伍中
   */
  isUserInTeam(userId: string): boolean {
    return this.userTeam.has(userId);
  }

  /**
   * 订阅队伍创建
   */
  onTeamCreated(listener: (team: Team) => void): () => void {
    this.listeners.onTeamCreated.push(listener);
    return () => {
      this.listeners.onTeamCreated = this.listeners.onTeamCreated.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * 订阅成员加入
   */
  onMemberJoined(listener: (teamId: string, member: TeamMember) => void): () => void {
    this.listeners.onMemberJoined.push(listener);
    return () => {
      this.listeners.onMemberJoined = this.listeners.onMemberJoined.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * 订阅成员离开
   */
  onMemberLeft(listener: (teamId: string, userId: string) => void): () => void {
    this.listeners.onMemberLeft.push(listener);
    return () => {
      this.listeners.onMemberLeft = this.listeners.onMemberLeft.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * 订阅邀请接收
   */
  onInvitationReceived(listener: (invitation: TeamInvitation) => void): () => void {
    this.listeners.onInvitationReceived.push(listener);
    return () => {
      this.listeners.onInvitationReceived = this.listeners.onInvitationReceived.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * 通知监听器
   */
  private notifyListeners(event: keyof typeof this.listeners, ...args: any[]): void {
    const listeners = this.listeners[event] as any[];
    listeners.forEach((listener) => {
      listener(...args);
    });
  }
}

// 全局单例
let teamManagerInstance: TeamManager | null = null;

export function getTeamManager(): TeamManager {
  if (!teamManagerInstance) {
    teamManagerInstance = new TeamManager();
  }
  return teamManagerInstance;
}
