import { describe, expect, it } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

let isolatedUserCounter = 0;
function createIsolatedUserId(): number {
  return 1_000_000_000 + (Date.now() % 500_000) * 1_000 + (process.pid % 1_000) + isolatedUserCounter++;
}

function createAuthContext(userId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: 'https', headers: {} } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };
}

describe('Share Statistics E2E Tests', () => {
  describe('Complete Share Workflow', () => {
    it('should complete full share recording workflow', async () => {
      const userId = createIsolatedUserId();
      const ctx = createAuthContext(userId);
      const caller = appRouter.createCaller(ctx);

      // Step 1: Record initial share
      const recordResult1 = await caller.shareStatistics.recordShare({
        platform: 'twitter',
        amount: '1000',
      });
      expect(recordResult1.success).toBe(true);

      // Step 2: Record multiple shares to different platforms
      const platforms = ['telegram', 'clipboard', 'download'] as const;
      for (const platform of platforms) {
        const result = await caller.shareStatistics.recordShare({
          platform,
          amount: '500',
        });
        expect(result.success).toBe(true);
      }

      // Step 3: Get summary statistics
      const summary = await caller.shareStatistics.getSummary();
      expect(summary.totalShares).toBe(4);
      expect(summary.uniquePlatforms).toBe(4);

      // Step 4: Get platform breakdown
      const breakdown = await caller.shareStatistics.getCountByPlatform();
      expect(breakdown.twitter).toBe(1);
      expect(breakdown.telegram).toBe(1);
      expect(breakdown.clipboard).toBe(1);
      expect(breakdown.download).toBe(1);
    });

    it('should handle concurrent share recordings', async () => {
      const userId = createIsolatedUserId();
      const ctx = createAuthContext(userId);
      const caller = appRouter.createCaller(ctx);

      // Record shares concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          caller.shareStatistics.recordShare({
            platform: 'twitter',
            amount: '100',
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results.every((r) => r.success)).toBe(true);

      // Verify all were recorded
      const summary = await caller.shareStatistics.getSummary();
      expect(summary.totalShares).toBe(10);
    });

    it('should track share statistics over time', async () => {
      const userId = createIsolatedUserId();
      const ctx = createAuthContext(userId);
      const caller = appRouter.createCaller(ctx);

      // Day 1: Record shares
      for (let i = 0; i < 5; i++) {
        await caller.shareStatistics.recordShare({
          platform: 'twitter',
          amount: '100',
        });
      }

      let summary = await caller.shareStatistics.getSummary();
      expect(summary.totalShares).toBe(5);

      // Day 2: Record more shares
      for (let i = 0; i < 3; i++) {
        await caller.shareStatistics.recordShare({
          platform: 'telegram',
          amount: '100',
        });
      }

      summary = await caller.shareStatistics.getSummary();
      expect(summary.totalShares).toBe(8);

      // Verify breakdown
      const breakdown = await caller.shareStatistics.getCountByPlatform();
      expect(breakdown.twitter).toBe(5);
      expect(breakdown.telegram).toBe(3);
    });
  });

  describe('Share Statistics Dashboard Integration', () => {
    it('should provide data for dashboard visualization', { timeout: 15000 }, async () => {
      const userId = createIsolatedUserId();
      const ctx = createAuthContext(userId);
      const caller = appRouter.createCaller(ctx);

      // Record diverse shares
      const shareData = [
        { platform: 'twitter' as const, count: 15 },
        { platform: 'telegram' as const, count: 10 },
        { platform: 'clipboard' as const, count: 8 },
        { platform: 'download' as const, count: 5 },
      ];

      for (const { platform, count } of shareData) {
        for (let i = 0; i < count; i++) {
          await caller.shareStatistics.recordShare({
            platform,
            amount: '100',
          });
        }
      }

      // Get summary for dashboard
      const summary = await caller.shareStatistics.getSummary();
      expect(summary.totalShares).toBe(38);
      expect(summary.uniquePlatforms).toBe(4);

      // Get breakdown for pie chart
      const breakdown = await caller.shareStatistics.getCountByPlatform();
      expect(breakdown.twitter).toBe(15);
      expect(breakdown.telegram).toBe(10);
      expect(breakdown.clipboard).toBe(8);
      expect(breakdown.download).toBe(5);

      // Verify percentages
      const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
      expect(total).toBe(38);
    });

    it('should handle empty statistics gracefully', async () => {
      const userId = createIsolatedUserId();
      const ctx = createAuthContext(userId);
      const caller = appRouter.createCaller(ctx);

      // Get summary without any shares
      const summary = await caller.shareStatistics.getSummary();
      expect(summary.totalShares).toBe(0);
      expect(summary.uniquePlatforms).toBe(0);

      // Get breakdown without any shares
      const breakdown = await caller.shareStatistics.getCountByPlatform();
      expect(breakdown.twitter).toBe(0);
      expect(breakdown.telegram).toBe(0);
      expect(breakdown.clipboard).toBe(0);
      expect(breakdown.download).toBe(0);
    });
  });

  describe('Share Menu Integration', () => {
    it('should record share from menu interactions', async () => {
      const userId = createIsolatedUserId();
      const ctx = createAuthContext(userId);
      const caller = appRouter.createCaller(ctx);

      // Simulate share menu interactions
      const platforms = ['twitter', 'telegram', 'clipboard', 'download'] as const;

      for (const platform of platforms) {
        const result = await caller.shareStatistics.recordShare({
          platform,
          amount: '1000',
          transactionType: 'transaction',
        });
        expect(result.success).toBe(true);
      }

      // Verify all recorded
      const summary = await caller.shareStatistics.getSummary();
      expect(summary.totalShares).toBe(4);
    });

    it('should handle rapid successive shares', async () => {
      const userId = createIsolatedUserId();
      const ctx = createAuthContext(userId);
      const caller = appRouter.createCaller(ctx);

      // Simulate rapid clicking on share buttons
      const results = [];
      for (let i = 0; i < 20; i++) {
        const platform = ['twitter', 'telegram', 'clipboard', 'download'][
          i % 4
        ] as const;
        results.push(
          caller.shareStatistics.recordShare({
            platform,
            amount: '100',
          })
        );
      }

      await Promise.all(results);

      const summary = await caller.shareStatistics.getSummary();
      expect(summary.totalShares).toBe(20);

      const breakdown = await caller.shareStatistics.getCountByPlatform();
      expect(breakdown.twitter).toBe(5);
      expect(breakdown.telegram).toBe(5);
      expect(breakdown.clipboard).toBe(5);
      expect(breakdown.download).toBe(5);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid platform gracefully', async () => {
      const userId = createIsolatedUserId();
      const ctx = createAuthContext(userId);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.shareStatistics.recordShare({
          platform: 'invalid' as any,
          amount: '100',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should handle missing amount gracefully', async () => {
      const userId = createIsolatedUserId();
      const ctx = createAuthContext(userId);
      const caller = appRouter.createCaller(ctx);

      // Should still record even without amount
      const result = await caller.shareStatistics.recordShare({
        platform: 'twitter',
        amount: '',
      });
      expect(result.success).toBe(true);
    });

    it('should maintain data consistency across operations', async () => {
      const userId = createIsolatedUserId();
      const ctx = createAuthContext(userId);
      const caller = appRouter.createCaller(ctx);

      // Record initial shares
      for (let i = 0; i < 5; i++) {
        await caller.shareStatistics.recordShare({
          platform: 'twitter',
          amount: '100',
        });
      }

      // Get multiple summaries
      const summary1 = await caller.shareStatistics.getSummary();
      const summary2 = await caller.shareStatistics.getSummary();

      // Should be consistent
      expect(summary1.totalShares).toBe(summary2.totalShares);
      expect(summary1.uniquePlatforms).toBe(summary2.uniquePlatforms);
    });
  });

  describe('User Isolation', () => {
    it('should isolate data between different users', async () => {
      const user1Id = Math.floor(Math.random() * 100000) + 11000;
      const user2Id = Math.floor(Math.random() * 100000) + 12000;

      const ctx1 = createAuthContext(user1Id);
      const ctx2 = createAuthContext(user2Id);

      const caller1 = appRouter.createCaller(ctx1);
      const caller2 = appRouter.createCaller(ctx2);

      // User 1 records shares
      for (let i = 0; i < 5; i++) {
        await caller1.shareStatistics.recordShare({
          platform: 'twitter',
          amount: '100',
        });
      }

      // User 2 records different shares
      for (let i = 0; i < 3; i++) {
        await caller2.shareStatistics.recordShare({
          platform: 'telegram',
          amount: '100',
        });
      }

      // Verify isolation
      const summary1 = await caller1.shareStatistics.getSummary();
      const summary2 = await caller2.shareStatistics.getSummary();

      expect(summary1.totalShares).toBe(5);
      expect(summary2.totalShares).toBe(3);

      const breakdown1 = await caller1.shareStatistics.getCountByPlatform();
      const breakdown2 = await caller2.shareStatistics.getCountByPlatform();

      expect(breakdown1.twitter).toBe(5);
      expect(breakdown1.telegram).toBe(0);
      expect(breakdown2.twitter).toBe(0);
      expect(breakdown2.telegram).toBe(3);
    });
  });
});
