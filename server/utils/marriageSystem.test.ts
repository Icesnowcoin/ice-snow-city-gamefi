import { describe, it, expect, beforeEach } from 'vitest';
import MarriageSystem from './marriageSystem';

describe('Marriage System', () => {
  let marriage: MarriageSystem;

  beforeEach(() => {
    marriage = new MarriageSystem();
  });

  describe('Proposal Management', () => {
    it('should create proposal', () => {
      const proposal = marriage.createProposal('player1', 'player2', 'Will you marry me?');
      expect(proposal.proposerId).toBe('player1');
      expect(proposal.proposeeId).toBe('player2');
      expect(proposal.status).toBe('pending');
    });

    it('should get proposal', () => {
      const created = marriage.createProposal('player1', 'player2');
      const retrieved = marriage.getProposal(created.proposalId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.proposerId).toBe('player1');
    });

    it('should get pending proposals', () => {
      marriage.createProposal('player1', 'player2');
      marriage.createProposal('player3', 'player2');
      const pending = marriage.getPendingProposals('player2');
      expect(pending.length).toBe(2);
    });
  });

  describe('Proposal Response', () => {
    it('should accept proposal', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      const result = marriage.acceptProposal(proposal.proposalId);
      expect(result).toBeDefined();
      expect(result?.spouse1Id).toBe('player1');
      expect(result?.spouse2Id).toBe('player2');
    });

    it('should reject proposal', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      const rejected = marriage.rejectProposal(proposal.proposalId);
      expect(rejected).toBe(true);

      const updated = marriage.getProposal(proposal.proposalId);
      expect(updated?.status).toBe('rejected');
    });
  });

  describe('Marriage Management', () => {
    it('should get player marriage', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      const playerMarriage = marriage.getPlayerMarriage('player1');
      expect(playerMarriage).toBeDefined();
      expect(playerMarriage?.status).toBe('active');
    });

    it('should get spouse id', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      const spouseId = marriage.getSpouseId('player1');
      expect(spouseId).toBe('player2');
    });

    it('should divorce', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      const divorced = marriage.divorce('player1');
      expect(divorced).toBe(true);

      const playerMarriage = marriage.getPlayerMarriage('player1');
      expect(playerMarriage).toBeUndefined();
    });
  });

  describe('Children Management', () => {
    it('should add child', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      const added = marriage.addChild('player1', 'child1');
      expect(added).toBe(true);
    });

    it('should get children', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      marriage.addChild('player1', 'child1');
      marriage.addChild('player1', 'child2');

      const children = marriage.getChildren('player1');
      expect(children.length).toBe(2);
    });
  });

  describe('Private Space Management', () => {
    it('should get player private space', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      const space = marriage.getPlayerPrivateSpace('player1');
      expect(space).toBeDefined();
      expect(space?.accessList).toContain('player1');
      expect(space?.accessList).toContain('player2');
    });

    it('should check access permission', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      const space = marriage.getPlayerPrivateSpace('player1');
      if (!space) throw new Error('Space not found');

      const canAccess = marriage.canAccessPrivateSpace('player1', space.spaceId);
      expect(canAccess).toBe(true);

      const cannotAccess = marriage.canAccessPrivateSpace('player3', space.spaceId);
      expect(cannotAccess).toBe(false);
    });

    it('should add furniture to private space', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      const space = marriage.getPlayerPrivateSpace('player1');
      if (!space) throw new Error('Space not found');

      const added = marriage.addFurniture(space.spaceId, 'player1', 'sofa1', 'Sofa', 10, 20);
      expect(added).toBe(true);

      const updated = marriage.getPrivateSpace(space.spaceId);
      expect(updated?.furniture.length).toBe(1);
    });

    it('should add photo to private space', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      const space = marriage.getPlayerPrivateSpace('player1');
      if (!space) throw new Error('Space not found');

      const added = marriage.addPhoto(space.spaceId, 'player1', 'https://example.com/photo.jpg');
      expect(added).toBe(true);

      const updated = marriage.getPrivateSpace(space.spaceId);
      expect(updated?.photos.length).toBe(1);
    });
  });

  describe('Marriage Statistics', () => {
    it('should get marriage stats', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      const stats = marriage.getMarriageStats('player1');
      expect(stats).toBeDefined();
      expect(stats?.currentMarriage).toBeDefined();
      expect(stats?.totalMarriages).toBe(1);
    });

    it('should track marriage history', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);
      marriage.divorce('player1');

      const history = marriage.getMarriageHistory('player1');
      expect(history.length).toBe(1);
      expect(history[0].status).toBe('divorced');
    });
  });

  describe('Marriage Constraints', () => {
    it('should not allow marriage if already married', () => {
      const proposal1 = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal1.proposalId);

      expect(() => {
        marriage.createProposal('player1', 'player3');
      }).toThrow();
    });

    it('should not allow accepting expired proposal', () => {
      const proposal = marriage.createProposal('player1', 'player2', '', -1); // Expired
      const result = marriage.acceptProposal(proposal.proposalId);
      expect(result).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should clear all data', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      marriage.clear();

      const playerMarriage = marriage.getPlayerMarriage('player1');
      expect(playerMarriage).toBeUndefined();
    });
  });

  describe('Multiple Marriages', () => {
    it('should handle multiple marriages for same player', () => {
      // First marriage
      const proposal1 = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal1.proposalId);
      marriage.divorce('player1');

      // Second marriage
      const proposal2 = marriage.createProposal('player1', 'player3');
      marriage.acceptProposal(proposal2.proposalId);

      const history = marriage.getMarriageHistory('player1');
      expect(history.length).toBe(1);

      const currentMarriage = marriage.getPlayerMarriage('player1');
      expect(currentMarriage?.spouse2Id).toBe('player3');
    });
  });

  describe('Spouse Information', () => {
    it('should get spouse information correctly', () => {
      const proposal = marriage.createProposal('player1', 'player2');
      marriage.acceptProposal(proposal.proposalId);

      const spouse1 = marriage.getSpouseId('player1');
      const spouse2 = marriage.getSpouseId('player2');

      expect(spouse1).toBe('player2');
      expect(spouse2).toBe('player1');
    });
  });
});
