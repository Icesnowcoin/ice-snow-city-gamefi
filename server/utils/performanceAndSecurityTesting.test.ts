import { describe, it, expect, beforeEach } from 'vitest';
import {
  PerformanceTestManager,
  StressTestManager,
  SecurityCheckManager,
  LaunchReadinessChecker,
  createPerformanceTestManager,
  createStressTestManager,
  createSecurityCheckManager,
  createLaunchReadinessChecker,
} from './performanceAndSecurityTesting';

describe('Performance and Security Testing', () => {
  describe('Performance Test Manager', () => {
    let manager: PerformanceTestManager;

    beforeEach(() => {
      manager = createPerformanceTestManager();
    });

    it('should record response times', () => {
      manager.recordResponseTime(100, true);
      manager.recordResponseTime(150, true);
      manager.recordResponseTime(200, false);

      const metrics = manager.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should calculate average response time', () => {
      manager.recordResponseTime(100, true);
      manager.recordResponseTime(200, true);
      manager.recordResponseTime(300, true);

      const metrics = manager.getMetrics();
      expect(metrics.avgResponseTime).toBe(200);
    });

    it('should calculate success rate', () => {
      manager.recordResponseTime(100, true);
      manager.recordResponseTime(150, true);
      manager.recordResponseTime(200, false);

      const metrics = manager.getMetrics();
      expect(metrics.successRate).toBeCloseTo(66.67, 1);
    });

    it('should calculate error rate', () => {
      manager.recordResponseTime(100, true);
      manager.recordResponseTime(150, true);
      manager.recordResponseTime(200, false);

      const metrics = manager.getMetrics();
      expect(metrics.errorRate).toBeCloseTo(33.33, 1);
    });

    it('should reset metrics', () => {
      manager.recordResponseTime(100, true);
      manager.reset();

      const metrics = manager.getMetrics();
      expect(metrics.avgResponseTime).toBe(0);
    });
  });

  describe('Stress Test Manager', () => {
    let manager: StressTestManager;

    beforeEach(() => {
      manager = createStressTestManager();
    });

    it('should run stress test', async () => {
      const result = await manager.runStressTest(10, 5000, 10);
      expect(result).toBeDefined();
      expect(result.concurrentUsers).toBe(10);
    });

    it('should track successful requests', async () => {
      const result = await manager.runStressTest(5, 5000, 5);
      expect(result.successfulRequests).toBeGreaterThan(0);
    });

    it('should track failed requests', async () => {
      const result = await manager.runStressTest(5, 5000, 5);
      expect(result.failedRequests).toBeGreaterThanOrEqual(0);
    });

    it('should calculate response times', async () => {
      const result = await manager.runStressTest(5, 5000, 5);
      expect(result.avgResponseTime).toBeGreaterThan(0);
      expect(result.maxResponseTime).toBeGreaterThanOrEqual(result.avgResponseTime);
      expect(result.minResponseTime).toBeLessThanOrEqual(result.avgResponseTime);
    });

    it('should store test results', async () => {
      await manager.runStressTest(5, 5000, 5);
      const results = manager.getResults();
      expect(results.length).toBe(1);
    });

    it('should get last result', async () => {
      await manager.runStressTest(5, 5000, 5);
      const lastResult = manager.getLastResult();
      expect(lastResult).toBeDefined();
    });
  });

  describe('Security Check Manager', () => {
    let manager: SecurityCheckManager;

    beforeEach(() => {
      manager = createSecurityCheckManager();
    });

    it('should run security checks', async () => {
      const result = await manager.runSecurityChecks();
      expect(result).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(result.score).toBeDefined();
    });

    it('should have all checks', async () => {
      const result = await manager.runSecurityChecks();
      expect(result.checks.length).toBe(10);
    });

    it('should pass all checks', async () => {
      const result = await manager.runSecurityChecks();
      expect(result.passed).toBe(true);
    });

    it('should calculate security score', async () => {
      const result = await manager.runSecurityChecks();
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should include SSL/TLS check', async () => {
      const result = await manager.runSecurityChecks();
      const sslCheck = result.checks.find((c) => c.name.includes('SSL'));
      expect(sslCheck).toBeDefined();
    });

    it('should include authentication check', async () => {
      const result = await manager.runSecurityChecks();
      const authCheck = result.checks.find((c) => c.name.includes('Authentication'));
      expect(authCheck).toBeDefined();
    });
  });

  describe('Launch Readiness Checker', () => {
    let checker: LaunchReadinessChecker;

    beforeEach(() => {
      checker = createLaunchReadinessChecker();
    });

    it('should check launch readiness', async () => {
      const result = await checker.checkLaunchReadiness();
      expect(result).toBeDefined();
      expect(result.ready).toBeDefined();
      expect(result.items).toBeDefined();
    });

    it('should have all readiness items', async () => {
      const result = await checker.checkLaunchReadiness();
      expect(result.items.length).toBe(8);
    });

    it('should indicate ready status', async () => {
      const result = await checker.checkLaunchReadiness();
      expect(result.ready).toBe(true);
    });

    it('should include code review check', async () => {
      const result = await checker.checkLaunchReadiness();
      const codeReview = result.items.find((i) => i.name === 'Code Review');
      expect(codeReview).toBeDefined();
    });

    it('should include testing check', async () => {
      const result = await checker.checkLaunchReadiness();
      const testing = result.items.find((i) => i.name === 'Testing');
      expect(testing).toBeDefined();
    });

    it('should include security check', async () => {
      const result = await checker.checkLaunchReadiness();
      const security = result.items.find((i) => i.name === 'Security');
      expect(security).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should run complete testing workflow', async () => {
      const perfManager = createPerformanceTestManager();
      const stressManager = createStressTestManager();
      const securityManager = createSecurityCheckManager();
      const launchChecker = createLaunchReadinessChecker();

      // Performance test
      perfManager.recordResponseTime(100, true);
      const perfMetrics = perfManager.getMetrics();
      expect(perfMetrics).toBeDefined();

      // Stress test
      const stressResult = await stressManager.runStressTest(5, 5000, 5);
      expect(stressResult).toBeDefined();

      // Security check
      const securityResult = await securityManager.runSecurityChecks();
      expect(securityResult.passed).toBe(true);

      // Launch readiness
      const launchResult = await launchChecker.checkLaunchReadiness();
      expect(launchResult.ready).toBe(true);
    });

    it('should validate performance requirements', async () => {
      const manager = createPerformanceTestManager();

      // Simulate requests with acceptable response times
      for (let i = 0; i < 100; i++) {
        const responseTime = Math.random() * 200 + 50; // 50-250ms
        manager.recordResponseTime(responseTime, true);
      }

      const metrics = manager.getMetrics();
      expect(metrics.avgResponseTime).toBeLessThan(300);
      expect(metrics.successRate).toBeGreaterThan(90);
    });

    it('should validate security requirements', async () => {
      const manager = createSecurityCheckManager();
      const result = await manager.runSecurityChecks();

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.checks.every((c) => c.status === 'pass')).toBe(true);
    });
  });
});
