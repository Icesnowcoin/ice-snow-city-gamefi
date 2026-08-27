import { describe, it, expect, beforeEach } from 'vitest';
import {
  FinalTestManager,
  PerformanceTestRunner,
  SecurityTestRunner,
  LaunchChecklist,
  DisasterRecoveryManager,
  PostLaunchMonitoring,
  generateLaunchReport,
} from './launchPreparation';

describe('Launch Preparation and Final Testing', () => {
  describe('Final Test Manager', () => {
    let manager: FinalTestManager;

    beforeEach(() => {
      manager = new FinalTestManager();
    });

    it('should add test results', () => {
      manager.addTestResult('unit-tests', {
        name: 'test-1',
        status: 'passed',
        duration: 100,
      });

      const suite = manager.getTestSuite('unit-tests');
      expect(suite).toBeDefined();
      expect(suite!.totalTests).toBe(1);
      expect(suite!.passedTests).toBe(1);
    });

    it('should calculate pass rate', () => {
      manager.addTestResult('unit-tests', {
        name: 'test-1',
        status: 'passed',
        duration: 100,
      });
      manager.addTestResult('unit-tests', {
        name: 'test-2',
        status: 'failed',
        duration: 150,
      });

      const suite = manager.getTestSuite('unit-tests');
      expect(suite!.passRate).toBe(50);
    });

    it('should get overall statistics', () => {
      manager.addTestResult('unit-tests', {
        name: 'test-1',
        status: 'passed',
        duration: 100,
      });
      manager.addTestResult('integration-tests', {
        name: 'test-2',
        status: 'passed',
        duration: 200,
      });

      const stats = manager.getOverallStats();
      expect(stats.totalSuites).toBe(2);
      expect(stats.totalTests).toBe(2);
      expect(stats.passedTests).toBe(2);
      expect(stats.passRate).toBe(100);
    });

    it('should identify failed tests', () => {
      manager.addTestResult('unit-tests', {
        name: 'test-1',
        status: 'passed',
        duration: 100,
      });
      manager.addTestResult('unit-tests', {
        name: 'test-2',
        status: 'failed',
        duration: 150,
        message: 'Test failed',
      });

      const failed = manager.getFailedTests();
      expect(failed.length).toBe(1);
      expect(failed[0].test.name).toBe('test-2');
    });

    it('should determine if all tests passed', () => {
      manager.addTestResult('unit-tests', {
        name: 'test-1',
        status: 'passed',
        duration: 100,
      });

      expect(manager.allTestsPassed()).toBe(true);

      manager.addTestResult('unit-tests', {
        name: 'test-2',
        status: 'failed',
        duration: 150,
      });

      expect(manager.allTestsPassed()).toBe(false);
    });
  });

  describe('Performance Test Runner', () => {
    let runner: PerformanceTestRunner;

    beforeEach(() => {
      runner = new PerformanceTestRunner();
    });

    it('should run performance test', async () => {
      const result = await runner.runPerformanceTest('/api/users', 'GET', 100, 5);

      expect(result).toHaveProperty('endpoint');
      expect(result).toHaveProperty('avgResponseTime');
      expect(result).toHaveProperty('errorRate');
      expect(result.status).toMatch(/passed|failed/);
    });

    it('should track multiple tests', async () => {
      await runner.runPerformanceTest('/api/users', 'GET', 50, 5);
      await runner.runPerformanceTest('/api/products', 'GET', 50, 5);

      const results = runner.getResults();
      expect(results.length).toBe(2);
    });

    it('should calculate performance summary', async () => {
      await runner.runPerformanceTest('/api/users', 'GET', 50, 5);

      const summary = runner.getSummary();
      expect(summary.totalTests).toBe(1);
      expect(summary).toHaveProperty('avgResponseTime');
      expect(summary).toHaveProperty('maxResponseTime');
    });
  });

  describe('Security Test Runner', () => {
    let runner: SecurityTestRunner;

    beforeEach(() => {
      runner = new SecurityTestRunner();
    });

    it('should add security test results', () => {
      runner.addTestResult({
        name: 'SQL Injection Test',
        category: 'injection',
        status: 'passed',
        message: 'No SQL injection vulnerability found',
      });

      const results = runner.getResults();
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('SQL Injection Test');
    });

    it('should track security issues', () => {
      runner.addTestResult({
        name: 'Authentication Test',
        category: 'authentication',
        status: 'failed',
        message: 'Weak password policy',
        severity: 'high',
      });

      const summary = runner.getSummary();
      expect(summary.failedTests).toBe(1);
      expect(summary.highIssues).toBe(1);
    });

    it('should determine if security tests passed', () => {
      runner.addTestResult({
        name: 'Test 1',
        category: 'authentication',
        status: 'passed',
        message: 'OK',
      });

      expect(runner.passedSecurityTests()).toBe(true);

      runner.addTestResult({
        name: 'Test 2',
        category: 'injection',
        status: 'failed',
        message: 'Failed',
        severity: 'critical',
      });

      expect(runner.passedSecurityTests()).toBe(false);
    });
  });

  describe('Launch Checklist', () => {
    let checklist: LaunchChecklist;

    beforeEach(() => {
      checklist = new LaunchChecklist();
    });

    it('should add checklist items', () => {
      checklist.addItem({
        id: 'item-1',
        name: 'Database migration',
        category: 'deployment',
        status: 'pending',
      });

      const items = checklist.getChecklist();
      expect(items.length).toBe(1);
    });

    it('should update item status', () => {
      checklist.addItem({
        id: 'item-1',
        name: 'Database migration',
        category: 'deployment',
        status: 'pending',
      });

      const updated = checklist.updateItemStatus('item-1', 'completed', 'Migration successful');
      expect(updated).toBe(true);

      const items = checklist.getChecklist();
      expect(items[0].status).toBe('completed');
    });

    it('should calculate completion rate', () => {
      checklist.addItem({
        id: 'item-1',
        name: 'Item 1',
        category: 'functionality',
        status: 'completed',
      });
      checklist.addItem({
        id: 'item-2',
        name: 'Item 2',
        category: 'functionality',
        status: 'pending',
      });

      const stats = checklist.getStats();
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.completionRate).toBe(50);
    });

    it('should determine if ready to launch', () => {
      checklist.addItem({
        id: 'item-1',
        name: 'Item 1',
        category: 'functionality',
        status: 'completed',
      });

      expect(checklist.canLaunch()).toBe(true);

      checklist.addItem({
        id: 'item-2',
        name: 'Item 2',
        category: 'functionality',
        status: 'failed',
      });

      expect(checklist.canLaunch()).toBe(false);
    });

    it('should get incomplete items', () => {
      checklist.addItem({
        id: 'item-1',
        name: 'Item 1',
        category: 'functionality',
        status: 'completed',
      });
      checklist.addItem({
        id: 'item-2',
        name: 'Item 2',
        category: 'functionality',
        status: 'pending',
      });

      const incomplete = checklist.getIncompleteItems();
      expect(incomplete.length).toBe(1);
      expect(incomplete[0].id).toBe('item-2');
    });
  });

  describe('Disaster Recovery Manager', () => {
    let manager: DisasterRecoveryManager;

    beforeEach(() => {
      manager = new DisasterRecoveryManager();
    });

    it('should add recovery plan', () => {
      manager.addPlan({
        name: 'Database Failure',
        description: 'Recovery plan for database failure',
        rto: 30,
        rpo: 5,
        steps: ['Stop services', 'Restore from backup', 'Verify data', 'Restart services'],
        contacts: ['admin@example.com'],
      });

      const plan = manager.getPlan('Database Failure');
      expect(plan).toBeDefined();
      expect(plan!.rto).toBe(30);
    });

    it('should execute recovery plan', () => {
      manager.addPlan({
        name: 'Database Failure',
        description: 'Recovery plan for database failure',
        rto: 30,
        rpo: 5,
        steps: ['Stop services', 'Restore from backup'],
        contacts: ['admin@example.com'],
      });

      const result = manager.executeRecoveryPlan('Database Failure');
      expect(result.success).toBe(true);
    });

    it('should handle non-existent plan', () => {
      const result = manager.executeRecoveryPlan('Non-existent Plan');
      expect(result.success).toBe(false);
    });

    it('should get all plans', () => {
      manager.addPlan({
        name: 'Plan 1',
        description: 'First plan',
        rto: 30,
        rpo: 5,
        steps: [],
        contacts: [],
      });
      manager.addPlan({
        name: 'Plan 2',
        description: 'Second plan',
        rto: 60,
        rpo: 10,
        steps: [],
        contacts: [],
      });

      const plans = manager.getAllPlans();
      expect(plans.length).toBe(2);
    });
  });

  describe('Post Launch Monitoring', () => {
    let monitoring: PostLaunchMonitoring;

    beforeEach(() => {
      monitoring = new PostLaunchMonitoring();
    });

    it('should record alerts', () => {
      monitoring.recordAlert({
        severity: 'high',
        message: 'High CPU usage',
        metric: 'cpu',
        value: 95,
        threshold: 80,
      });

      const alerts = monitoring.getAlerts();
      expect(alerts.length).toBe(1);
    });

    it('should filter alerts by severity', () => {
      monitoring.recordAlert({
        severity: 'critical',
        message: 'Service down',
      });
      monitoring.recordAlert({
        severity: 'low',
        message: 'Low disk space',
      });

      const critical = monitoring.getAlerts('critical');
      expect(critical.length).toBe(1);
    });

    it('should record metrics', () => {
      monitoring.recordMetric('response_time', 100);
      monitoring.recordMetric('response_time', 150);
      monitoring.recordMetric('response_time', 120);

      const stats = monitoring.getMetricStats('response_time');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(3);
      expect(stats!.avg).toBe(123.33333333333333);
      expect(stats!.min).toBe(100);
      expect(stats!.max).toBe(150);
    });

    it('should get monitoring summary', () => {
      monitoring.recordAlert({
        severity: 'critical',
        message: 'Critical issue',
      });
      monitoring.recordMetric('cpu', 85);

      const summary = monitoring.getSummary();
      expect(summary.totalAlerts).toBe(1);
      expect(summary.criticalAlerts).toBe(1);
      expect(summary.metricsTracked).toBe(1);
    });
  });

  describe('Launch Report Generation', () => {
    it('should generate launch report', () => {
      const testManager = new FinalTestManager();
      const performanceRunner = new PerformanceTestRunner();
      const securityRunner = new SecurityTestRunner();
      const checklist = new LaunchChecklist();
      const monitoring = new PostLaunchMonitoring();

      testManager.addTestResult('unit-tests', {
        name: 'test-1',
        status: 'passed',
        duration: 100,
      });

      checklist.addItem({
        id: 'item-1',
        name: 'Item 1',
        category: 'functionality',
        status: 'completed',
      });

      const report = generateLaunchReport(
        testManager,
        performanceRunner,
        securityRunner,
        checklist,
        monitoring
      );

      expect(report).toContain('上线报告');
      expect(report).toContain('功能测试');
      expect(report).toContain('性能测试');
      expect(report).toContain('安全测试');
      expect(report).toContain('上线检查清单');
    });
  });

  describe('Launch Preparation Integration', () => {
    it('should complete full launch preparation', async () => {
      // Setup managers
      const testManager = new FinalTestManager();
      const performanceRunner = new PerformanceTestRunner();
      const securityRunner = new SecurityTestRunner();
      const checklist = new LaunchChecklist();
      const disasterRecovery = new DisasterRecoveryManager();
      const monitoring = new PostLaunchMonitoring();

      // Add tests
      testManager.addTestResult('unit-tests', {
        name: 'test-1',
        status: 'passed',
        duration: 100,
      });

      // Add performance tests
      await performanceRunner.runPerformanceTest('/api/users', 'GET', 50, 5);

      // Add security tests
      securityRunner.addTestResult({
        name: 'Authentication',
        category: 'authentication',
        status: 'passed',
        message: 'OK',
      });

      // Add checklist items
      checklist.addItem({
        id: 'item-1',
        name: 'Database migration',
        category: 'deployment',
        status: 'completed',
      });

      // Add disaster recovery plan
      disasterRecovery.addPlan({
        name: 'Database Failure',
        description: 'Recovery plan',
        rto: 30,
        rpo: 5,
        steps: ['Restore from backup'],
        contacts: ['admin@example.com'],
      });

      // Add monitoring
      monitoring.recordAlert({
        severity: 'low',
        message: 'Test alert',
      });

      // Verify all components
      expect(testManager.allTestsPassed()).toBe(true);
      expect(securityRunner.passedSecurityTests()).toBe(true);
      expect(checklist.canLaunch()).toBe(true);
      expect(disasterRecovery.getPlan('Database Failure')).toBeDefined();
      expect(monitoring.getSummary().totalAlerts).toBe(1);
    });
  });
});
