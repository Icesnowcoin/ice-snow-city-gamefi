/**
 * 婚姻系统
 * Phase 5: 玩家社交和关系系统
 */

export interface MarriageProposal {
  proposalId: string;
  proposerId: string;
  proposeeId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  rejectedAt?: number;
  cancelledAt?: number;
  message?: string;
}

export interface Marriage {
  marriageId: string;
  spouse1Id: string;
  spouse2Id: string;
  marriedAt: number;
  anniversaryDate: number;
  status: 'active' | 'divorced' | 'widowed';
  divorceInitiator?: string;
  divorceAt?: number;
  sharedWealthPercentage: number; // 0-100
  children: string[]; // 子女 ID 列表
  notes?: string;
}

export interface MarriageStats {
  playerId: string;
  totalMarriages: number;
  currentMarriage?: Marriage;
  marriageHistory: Marriage[];
  proposalsSent: number;
  proposalsReceived: number;
  childrenCount: number;
  totalSharedWealth: number;
  marriageAnniversaries: Array<{ spouseId: string; daysUntil: number }>;
}

export interface PrivateSpace {
  spaceId: string;
  ownerId: string;
  spouseId?: string;
  spaceName: string;
  description: string;
  createdAt: number;
  lastModifiedAt: number;
  furniture: Array<{
    furnitureId: string;
    name: string;
    position: { x: number; y: number };
  }>;
  decorations: string[];
  photos: string[];
  notes: string[];
  accessList: string[]; // 允许访问的玩家 ID
}

export class MarriageSystem {
  private proposals: Map<string, MarriageProposal> = new Map();
  private marriages: Map<string, Marriage> = new Map();
  private playerMarriages: Map<string, string> = new Map(); // playerId -> marriageId
  private privateSpaces: Map<string, PrivateSpace> = new Map();
  private stats: Map<string, MarriageStats> = new Map();

  /**
   * 创建求婚
   */
  createProposal(
    proposerId: string,
    proposeeId: string,
    message?: string,
    expirationDays: number = 7,
  ): MarriageProposal {
    // 检查是否已结婚
    if (this.playerMarriages.has(proposerId) || this.playerMarriages.has(proposeeId)) {
      throw new Error('One or both players are already married');
    }

    const proposalId = `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const proposal: MarriageProposal = {
      proposalId,
      proposerId,
      proposeeId,
      status: 'pending',
      createdAt: now,
      expiresAt: now + expirationDays * 24 * 60 * 60 * 1000,
      message,
    };

    this.proposals.set(proposalId, proposal);
    return proposal;
  }

  /**
   * 获取求婚
   */
  getProposal(proposalId: string): MarriageProposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * 获取玩家的待处理求婚
   */
  getPendingProposals(playerId: string): MarriageProposal[] {
    const proposals: MarriageProposal[] = [];
    const now = Date.now();

    this.proposals.forEach((proposal) => {
      if (proposal.proposeeId === playerId && proposal.status === 'pending') {
        if (proposal.expiresAt >= now) {
          proposals.push(proposal);
        } else {
          proposal.status = 'expired';
        }
      }
    });

    return proposals;
  }

  /**
   * 接受求婚
   */
  acceptProposal(proposalId: string): Marriage | null {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'pending') {
      return null;
    }

    if (proposal.expiresAt < Date.now()) {
      proposal.status = 'expired';
      return null;
    }

    proposal.status = 'accepted';
    proposal.acceptedAt = Date.now();

    // 创建婚姻
    const marriage = this.createMarriage(proposal.proposerId, proposal.proposeeId);

    return marriage;
  }

  /**
   * 拒绝求婚
   */
  rejectProposal(proposalId: string): boolean {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'pending') {
      return false;
    }

    proposal.status = 'rejected';
    proposal.rejectedAt = Date.now();
    return true;
  }

  /**
   * 创建婚姻
   */
  private createMarriage(spouse1Id: string, spouse2Id: string): Marriage {
    const marriageId = `marriage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const marriage: Marriage = {
      marriageId,
      spouse1Id,
      spouse2Id,
      marriedAt: now,
      anniversaryDate: now + 365 * 24 * 60 * 60 * 1000, // 一年后
      status: 'active',
      sharedWealthPercentage: 50,
      children: [],
    };

    this.marriages.set(marriageId, marriage);
    this.playerMarriages.set(spouse1Id, marriageId);
    this.playerMarriages.set(spouse2Id, marriageId);

    // 创建私密空间
    this.createPrivateSpace(spouse1Id, spouse2Id);

    // 更新统计
    this.updateMarriageStats(spouse1Id);
    this.updateMarriageStats(spouse2Id);

    return marriage;
  }

  /**
   * 获取玩家的婚姻
   */
  getPlayerMarriage(playerId: string): Marriage | undefined {
    const marriageId = this.playerMarriages.get(playerId);
    if (!marriageId) {
      return undefined;
    }

    const marriage = this.marriages.get(marriageId);
    if (marriage && marriage.status === 'active') {
      return marriage;
    }

    return undefined;
  }

  /**
   * 获取配偶 ID
   */
  getSpouseId(playerId: string): string | undefined {
    const marriage = this.getPlayerMarriage(playerId);
    if (!marriage) {
      return undefined;
    }

    return marriage.spouse1Id === playerId ? marriage.spouse2Id : marriage.spouse1Id;
  }

  /**
   * 离婚
   */
  divorce(playerId: string, reason?: string): boolean {
    const marriage = this.getPlayerMarriage(playerId);
    if (!marriage) {
      return false;
    }

    marriage.status = 'divorced';
    marriage.divorceInitiator = playerId;
    marriage.divorceAt = Date.now();

    // 移除婚姻关联
    this.playerMarriages.delete(marriage.spouse1Id);
    this.playerMarriages.delete(marriage.spouse2Id);

    // 更新统计
    this.updateMarriageStats(marriage.spouse1Id);
    this.updateMarriageStats(marriage.spouse2Id);

    return true;
  }

  /**
   * 添加子女
   */
  addChild(playerId: string, childId: string): boolean {
    const marriage = this.getPlayerMarriage(playerId);
    if (!marriage) {
      return false;
    }

    if (!marriage.children.includes(childId)) {
      marriage.children.push(childId);
    }

    return true;
  }

  /**
   * 获取子女列表
   */
  getChildren(playerId: string): string[] {
    const marriage = this.getPlayerMarriage(playerId);
    return marriage ? marriage.children : [];
  }

  /**
   * 创建私密空间
   */
  private createPrivateSpace(spouse1Id: string, spouse2Id: string): PrivateSpace {
    const spaceId = `space_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const space: PrivateSpace = {
      spaceId,
      ownerId: spouse1Id,
      spouseId: spouse2Id,
      spaceName: `${spouse1Id} & ${spouse2Id}'s Home`,
      description: 'A private space for the couple',
      createdAt: Date.now(),
      lastModifiedAt: Date.now(),
      furniture: [],
      decorations: [],
      photos: [],
      notes: [],
      accessList: [spouse1Id, spouse2Id],
    };

    this.privateSpaces.set(spaceId, space);
    return space;
  }

  /**
   * 获取私密空间
   */
  getPrivateSpace(spaceId: string): PrivateSpace | undefined {
    return this.privateSpaces.get(spaceId);
  }

  /**
   * 获取玩家的私密空间
   */
  getPlayerPrivateSpace(playerId: string): PrivateSpace | undefined {
    const spaces = Array.from(this.privateSpaces.values());
    for (const space of spaces) {
      if (space.accessList.includes(playerId)) {
        return space;
      }
    }
    return undefined;
  }

  /**
   * 检查访问权限
   */
  canAccessPrivateSpace(playerId: string, spaceId: string): boolean {
    const space = this.privateSpaces.get(spaceId);
    if (!space) {
      return false;
    }

    return space.accessList.includes(playerId);
  }

  /**
   * 添加家具
   */
  addFurniture(
    spaceId: string,
    playerId: string,
    furnitureId: string,
    name: string,
    x: number,
    y: number,
  ): boolean {
    const space = this.privateSpaces.get(spaceId);
    if (!space || !this.canAccessPrivateSpace(playerId, spaceId)) {
      return false;
    }

    space.furniture.push({
      furnitureId,
      name,
      position: { x, y },
    });

    space.lastModifiedAt = Date.now();
    return true;
  }

  /**
   * 添加照片
   */
  addPhoto(spaceId: string, playerId: string, photoUrl: string): boolean {
    const space = this.privateSpaces.get(spaceId);
    if (!space || !this.canAccessPrivateSpace(playerId, spaceId)) {
      return false;
    }

    space.photos.push(photoUrl);
    space.lastModifiedAt = Date.now();
    return true;
  }

  /**
   * 更新婚姻统计
   */
  private updateMarriageStats(playerId: string): void {
    if (!this.stats.has(playerId)) {
      this.stats.set(playerId, {
        playerId,
        totalMarriages: 0,
        marriageHistory: [],
        proposalsSent: 0,
        proposalsReceived: 0,
        childrenCount: 0,
        totalSharedWealth: 0,
        marriageAnniversaries: [],
      });
    }

    const stat = this.stats.get(playerId)!;
    const marriage = this.getPlayerMarriage(playerId);

    if (marriage) {
      stat.currentMarriage = marriage;
      stat.childrenCount = marriage.children.length;

      // 计算距离周年纪念的天数
      const daysUntilAnniversary = Math.ceil(
        (marriage.anniversaryDate - Date.now()) / (24 * 60 * 60 * 1000),
      );
      const spouseId = marriage.spouse1Id === playerId ? marriage.spouse2Id : marriage.spouse1Id;

      stat.marriageAnniversaries = [
        {
          spouseId,
          daysUntil: daysUntilAnniversary,
        },
      ];
    }

    // 统计历史婚姻
    let totalMarriages = 0;
    const marriageHistory: Marriage[] = [];

    this.marriages.forEach((m) => {
      if (m.spouse1Id === playerId || m.spouse2Id === playerId) {
        totalMarriages++;
        if (m.status !== 'active') {
          marriageHistory.push(m);
        }
      }
    });

    stat.totalMarriages = totalMarriages;
    stat.marriageHistory = marriageHistory;
  }

  /**
   * 获取婚姻统计
   */
  getMarriageStats(playerId: string): MarriageStats | undefined {
    return this.stats.get(playerId);
  }

  /**
   * 获取婚姻历史
   */
  getMarriageHistory(playerId: string): Marriage[] {
    const history: Marriage[] = [];

    this.marriages.forEach((marriage) => {
      if ((marriage.spouse1Id === playerId || marriage.spouse2Id === playerId) && marriage.status !== 'active') {
        history.push(marriage);
      }
    });

    return history;
  }

  /**
   * 清除所有数据
   */
  clear(): void {
    this.proposals.clear();
    this.marriages.clear();
    this.playerMarriages.clear();
    this.privateSpaces.clear();
    this.stats.clear();
  }
}

export default MarriageSystem;
