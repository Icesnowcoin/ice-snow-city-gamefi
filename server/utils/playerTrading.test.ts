import { describe, it, expect, beforeEach } from 'vitest';
import PlayerTradingSystem from './playerTrading';

describe('Player Trading System', () => {
  let trading: PlayerTradingSystem;

  beforeEach(() => {
    trading = new PlayerTradingSystem();
  });

  describe('Offer Management', () => {
    it('should create offer', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      const offer = trading.createOffer('player1', sellerItems, buyerItems);
      expect(offer.sellerId).toBe('player1');
      expect(offer.status).toBe('pending');
      expect(offer.sellerItems.length).toBe(1);
    });

    it('should get offer', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      const created = trading.createOffer('player1', sellerItems, buyerItems);
      const retrieved = trading.getOffer(created.offerId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.sellerId).toBe('player1');
    });

    it('should get player offers', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      trading.createOffer('player1', sellerItems, buyerItems);
      const offers = trading.getPlayerOffers('player1');
      expect(offers.length).toBe(1);
    });
  });

  describe('Offer Acceptance', () => {
    it('should accept offer', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      const offer = trading.createOffer('player1', sellerItems, buyerItems);
      const accepted = trading.acceptOffer(offer.offerId, 'player2');
      expect(accepted).toBe(true);

      const updated = trading.getOffer(offer.offerId);
      expect(updated?.status).toBe('accepted');
      expect(updated?.buyerId).toBe('player2');
    });

    it('should not accept non-pending offer', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      const offer = trading.createOffer('player1', sellerItems, buyerItems);
      trading.acceptOffer(offer.offerId, 'player2');
      const accepted2 = trading.acceptOffer(offer.offerId, 'player3');
      expect(accepted2).toBe(false);
    });
  });

  describe('Offer Completion', () => {
    it('should complete offer', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      const offer = trading.createOffer('player1', sellerItems, buyerItems);
      trading.acceptOffer(offer.offerId, 'player2');
      const completed = trading.completeOffer(offer.offerId);
      expect(completed).toBe(true);

      const updated = trading.getOffer(offer.offerId);
      expect(updated?.status).toBe('completed');
    });
  });

  describe('Offer Cancellation', () => {
    it('should cancel offer', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      const offer = trading.createOffer('player1', sellerItems, buyerItems);
      const cancelled = trading.cancelOffer(offer.offerId, 'player1', 'Changed my mind');
      expect(cancelled).toBe(true);

      const updated = trading.getOffer(offer.offerId);
      expect(updated?.status).toBe('cancelled');
      expect(updated?.cancelReason).toBe('Changed my mind');
    });
  });

  describe('Trading History', () => {
    it('should track trade history', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      const offer = trading.createOffer('player1', sellerItems, buyerItems);
      trading.acceptOffer(offer.offerId, 'player2');
      trading.completeOffer(offer.offerId);

      const history = trading.getTradeHistory('player1');
      expect(history.length).toBe(1);
      expect(history[0].sellerId).toBe('player1');
    });
  });

  describe('Trading Statistics', () => {
    it('should calculate trade stats', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      const offer = trading.createOffer('player1', sellerItems, buyerItems);
      trading.acceptOffer(offer.offerId, 'player2');
      trading.completeOffer(offer.offerId);

      const stats = trading.getTradeStats('player1');
      expect(stats).toBeDefined();
      expect(stats?.completedTrades).toBe(1);
      expect(stats?.totalItemsSold).toBeGreaterThan(0);
      expect(stats?.totalValueSold).toBeGreaterThan(0);
    });
  });

  describe('Rating System', () => {
    it('should rate offer', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      const offer = trading.createOffer('player1', sellerItems, buyerItems);
      trading.acceptOffer(offer.offerId, 'player2');
      trading.completeOffer(offer.offerId);

      const rated = trading.rateOffer(offer.offerId, 'player2', 5, 'Great seller!');
      expect(rated).toBe(true);

      const stats = trading.getTradeStats('player1');
      expect(stats).toBeDefined();
      // Rating is recorded in history, stats may not immediately reflect it
      expect(stats?.completedTrades).toBe(1);
    });
  });

  describe('Leaderboards', () => {
    it('should get trade leaderboard', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      const offer = trading.createOffer('player1', sellerItems, buyerItems);
      trading.acceptOffer(offer.offerId, 'player2');
      trading.completeOffer(offer.offerId);

      const leaderboard = trading.getTradeLeaderboard(10);
      expect(leaderboard.length).toBeGreaterThan(0);
      expect(leaderboard[0].completedTrades).toBeGreaterThan(0);
    });

    it('should get top rated players', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      const offer = trading.createOffer('player1', sellerItems, buyerItems);
      trading.acceptOffer(offer.offerId, 'player2');
      trading.completeOffer(offer.offerId);
      trading.rateOffer(offer.offerId, 'player2', 5);

      const topRated = trading.getTopRatedPlayers(10);
      expect(topRated.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup expired offers', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      trading.createOffer('player1', sellerItems, buyerItems, -1); // Expired
      const cleaned = trading.cleanupExpiredOffers();
      expect(cleaned).toBe(1);
    });

    it('should clear all data', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      trading.createOffer('player1', sellerItems, buyerItems);
      trading.clear();

      const offers = trading.getPlayerOffers('player1');
      expect(offers.length).toBe(0);
    });
  });

  describe('Pending Offers', () => {
    it('should get pending offers', () => {
      const sellerItems = [
        {
          itemId: 'item1',
          itemName: 'Gold Coin',
          quantity: 100,
          unitPrice: 1,
          totalPrice: 100,
        },
      ];

      const buyerItems = [
        {
          itemId: 'item2',
          itemName: 'Silver Coin',
          quantity: 50,
          unitPrice: 2,
          totalPrice: 100,
        },
      ];

      trading.createOffer('player1', sellerItems, buyerItems);
      const pending = trading.getPendingOffers();
      expect(pending.length).toBe(1);
    });
  });
});
