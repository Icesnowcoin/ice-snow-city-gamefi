import { describe, it, expect } from 'vitest';
import {
  createPerformanceSnapshot,
  calculateImprovement,
  generatePerformanceReport,
  exportReportAsJSON,
  exportReportAsCSV,
  exportReportAsHTML,
} from '@/lib/performanceReportGenerator';

describe('Performance Report Generator', () => {
  const mockMetricsBefore = {
    totalRequests: 100,
    cachedRequests: 10,
    batchedRequests: 0,
    avgNetworkTime: 100,
    totalNetworkTime: 10000,
    renderCount: 50,
    avgRenderTime: 20,
    totalRenderTime: 1000,
    cacheHitRate: 10,
    estimatedMemoryUsage: 50,
  };

  const mockMetricsAfter = {
    totalRequests: 30,
    cachedRequests: 24,
    batchedRequests: 6,
    avgNetworkTime: 20,
    totalNetworkTime: 600,
    renderCount: 20,
    avgRenderTime: 10,
    totalRenderTime: 200,
    cacheHitRate: 80,
    estimatedMemoryUsage: 30,
  };

  describe('createPerformanceSnapshot', () => {
    it('should create a performance snapshot from metrics', () => {
      const snapshot = createPerformanceSnapshot(mockMetricsBefore);

      expect(snapshot.totalRequests).toBe(100);
      expect(snapshot.cachedRequests).toBe(10);
      expect(snapshot.avgNetworkTime).toBe(100);
      expect(snapshot.timestamp).toBeDefined();
    });

    it('should handle missing metrics gracefully', () => {
      const snapshot = createPerformanceSnapshot({});

      expect(snapshot.totalRequests).toBe(0);
      expect(snapshot.cachedRequests).toBe(0);
      expect(snapshot.avgNetworkTime).toBe(0);
    });
  });

  describe('calculateImprovement', () => {
    it('should calculate improvement metrics correctly', () => {
      const before = createPerformanceSnapshot(mockMetricsBefore);
      const after = createPerformanceSnapshot(mockMetricsAfter);

      const improvement = calculateImprovement(before, after);

      expect(improvement.requestsReduction).toBe(70);
      expect(improvement.requestsReductionPercent).toBe(70);
      expect(improvement.networkTimeReduction).toBe(9400);
      expect(improvement.cacheHitRateImprovement).toBe(70);
    });

    it('should handle zero before metrics', () => {
      const before = createPerformanceSnapshot({});
      const after = createPerformanceSnapshot(mockMetricsAfter);

      const improvement = calculateImprovement(before, after);

      expect(improvement.requestsReductionPercent).toBe(0);
      expect(improvement.networkTimeReductionPercent).toBe(0);
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate a comprehensive performance report', () => {
      const before = createPerformanceSnapshot(mockMetricsBefore);
      const after = createPerformanceSnapshot(mockMetricsAfter);

      const report = generatePerformanceReport(before, after, 'Test Report');

      expect(report.title).toBe('Test Report');
      expect(report.timestamp).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.details).toBeDefined();
    });

    it('should generate recommendations based on improvement', () => {
      const before = createPerformanceSnapshot(mockMetricsBefore);
      const after = createPerformanceSnapshot(mockMetricsAfter);

      const report = generatePerformanceReport(before, after);

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some((r) => r.includes('✅'))).toBe(true);
    });

    it('should calculate summary metrics correctly', () => {
      const before = createPerformanceSnapshot(mockMetricsBefore);
      const after = createPerformanceSnapshot(mockMetricsAfter);

      const report = generatePerformanceReport(before, after);

      expect(report.summary.networkCallsReduction).toBe(70);
      expect(report.summary.cacheHitRate).toBe(80);
      expect(report.summary.renderTimeImprovement).toBeGreaterThan(0);
    });
  });

  describe('Report Export Formats', () => {
    let report: any;

    beforeEach(() => {
      const before = createPerformanceSnapshot(mockMetricsBefore);
      const after = createPerformanceSnapshot(mockMetricsAfter);
      report = generatePerformanceReport(before, after);
    });

    it('should export report as JSON', () => {
      const json = exportReportAsJSON(report);

      expect(typeof json).toBe('string');
      expect(json).toContain('title');
      expect(json).toContain('metrics');

      // Verify it's valid JSON
      const parsed = JSON.parse(json);
      expect(parsed.title).toBe(report.title);
    });

    it('should export report as CSV', () => {
      const csv = exportReportAsCSV(report);

      expect(typeof csv).toBe('string');
      expect(csv).toContain('Metric');
      expect(csv).toContain('Before');
      expect(csv).toContain('After');
      expect(csv).toContain('Total Requests');
    });

    it('should export report as HTML', () => {
      const html = exportReportAsHTML(report);

      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain(report.title);
      expect(html).toContain('Performance Optimization Report');
      expect(html).toContain('Recommendations');
    });

    it('should include metrics in HTML export', () => {
      const html = exportReportAsHTML(report);

      expect(html).toContain('Total Requests');
      expect(html).toContain('Avg Network Time');
      expect(html).toContain('Cache Hit Rate');
    });
  });

  describe('Performance Report Accuracy', () => {
    it('should accurately reflect significant optimization', () => {
      const before = createPerformanceSnapshot({
        totalRequests: 1000,
        cachedRequests: 50,
        batchedRequests: 0,
        avgNetworkTime: 500,
        totalNetworkTime: 500000,
        renderCount: 100,
        avgRenderTime: 50,
        totalRenderTime: 5000,
        cacheHitRate: 5,
        estimatedMemoryUsage: 100,
      });

      const after = createPerformanceSnapshot({
        totalRequests: 100,
        cachedRequests: 80,
        batchedRequests: 20,
        avgNetworkTime: 50,
        totalNetworkTime: 5000,
        renderCount: 30,
        avgRenderTime: 15,
        totalRenderTime: 450,
        cacheHitRate: 80,
        estimatedMemoryUsage: 40,
      });

      const report = generatePerformanceReport(before, after);

      expect(report.summary.networkCallsReduction).toBe(90);
      expect(report.summary.cacheHitRate).toBe(80);
      expect(report.summary.renderTimeImprovement).toBeGreaterThan(80);
      expect(report.recommendations.some((r) => r.includes('Excellent'))).toBe(true);
    });

    it('should identify areas needing improvement', () => {
      const before = createPerformanceSnapshot({
        totalRequests: 100,
        cachedRequests: 50,
        batchedRequests: 20,
        avgNetworkTime: 50,
        totalNetworkTime: 5000,
        renderCount: 20,
        avgRenderTime: 15,
        totalRenderTime: 300,
        cacheHitRate: 50,
        estimatedMemoryUsage: 40,
      });

      const after = createPerformanceSnapshot({
        totalRequests: 95,
        cachedRequests: 50,
        batchedRequests: 20,
        avgNetworkTime: 48,
        totalNetworkTime: 4560,
        renderCount: 20,
        avgRenderTime: 15,
        totalRenderTime: 300,
        cacheHitRate: 52,
        estimatedMemoryUsage: 45,
      });

      const report = generatePerformanceReport(before, after);

      expect(report.recommendations.some((r) => r.includes('⚠️'))).toBe(true);
    });
  });

  describe('Report Details Formatting', () => {
    it('should format report details with proper structure', () => {
      const before = createPerformanceSnapshot(mockMetricsBefore);
      const after = createPerformanceSnapshot(mockMetricsAfter);

      const report = generatePerformanceReport(before, after);

      expect(report.details).toContain('PERFORMANCE OPTIMIZATION REPORT');
      expect(report.details).toContain('NETWORK METRICS');
      expect(report.details).toContain('RENDERING METRICS');
      expect(report.details).toContain('CACHE METRICS');
      expect(report.details).toContain('MEMORY METRICS');
    });

    it('should include percentage improvements in details', () => {
      const before = createPerformanceSnapshot(mockMetricsBefore);
      const after = createPerformanceSnapshot(mockMetricsAfter);

      const report = generatePerformanceReport(before, after);

      expect(report.details).toContain('%');
      expect(report.details).toContain('reduction');
      expect(report.details).toContain('improvement');
    });
  });
});
