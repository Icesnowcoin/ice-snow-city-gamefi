import http from 'http';
import https from 'https';

interface TestResult {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
}

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
}

class PerformanceTester {
  private baseUrl: string;
  private results: TestResult[] = [];
  private concurrency: number = 10;
  private requestsPerEndpoint: number = 100;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async runTests(): Promise<PerformanceMetrics[]> {
    const endpoints = [
      { path: '/api/trpc/system.health', method: 'GET' },
      { path: '/api/trpc/secretKey.list', method: 'GET' },
      { path: '/api/trpc/contractParams.list', method: 'GET' },
      { path: '/api/trpc/treasury.getBalance', method: 'GET' },
      { path: '/api/trpc/auditLog.query', method: 'POST' },
    ];

    console.log(`Starting performance tests...`);
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Endpoints: ${endpoints.length}`);
    console.log(`Requests per endpoint: ${this.requestsPerEndpoint}`);
    console.log(`Concurrency: ${this.concurrency}\n`);

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint.path, endpoint.method);
    }

    return this.calculateMetrics();
  }

  private async testEndpoint(path: string, method: string): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < this.requestsPerEndpoint; i++) {
      if (promises.length >= this.concurrency) {
        await Promise.race(promises);
        promises.splice(0, 1);
      }

      const promise = this.makeRequest(path, method);
      promises.push(promise);
    }

    await Promise.all(promises);
  }

  private makeRequest(path: string, method: string): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = new URL(path, this.baseUrl);
      const protocol = url.protocol === 'https:' ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PerformanceTester/1.0',
        },
      };

      const req = protocol.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          this.results.push({
            endpoint: path,
            method: method,
            statusCode: res.statusCode || 0,
            responseTime: responseTime,
            timestamp: new Date(),
          });
          resolve();
        });
      });

      req.on('error', () => {
        const responseTime = Date.now() - startTime;
        this.results.push({
          endpoint: path,
          method: method,
          statusCode: 0,
          responseTime: responseTime,
          timestamp: new Date(),
        });
        resolve();
      });

      req.setTimeout(30000, () => {
        req.destroy();
        resolve();
      });

      req.end();
    });
  }

  private calculateMetrics(): PerformanceMetrics[] {
    const grouped = new Map<string, TestResult[]>();

    for (const result of this.results) {
      const key = `${result.method} ${result.endpoint}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(result);
    }

    const metrics: PerformanceMetrics[] = [];

    for (const [key, results] of grouped.entries()) {
      const [method, endpoint] = key.split(' ');
      const responseTimes = results.map((r) => r.responseTime).sort((a, b) => a - b);
      const successCount = results.filter((r) => r.statusCode >= 200 && r.statusCode < 300).length;

      metrics.push({
        endpoint: endpoint,
        method: method,
        avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        minResponseTime: responseTimes[0],
        maxResponseTime: responseTimes[responseTimes.length - 1],
        p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
        p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
        successRate: successCount / results.length,
        totalRequests: results.length,
        failedRequests: results.length - successCount,
      });
    }

    return metrics;
  }

  printResults(metrics: PerformanceMetrics[]): void {
    console.log('\n=== Performance Test Results ===\n');

    for (const metric of metrics) {
      console.log(`${metric.method} ${metric.endpoint}`);
      console.log(`  Average Response Time: ${metric.avgResponseTime.toFixed(2)}ms`);
      console.log(`  Min Response Time: ${metric.minResponseTime}ms`);
      console.log(`  Max Response Time: ${metric.maxResponseTime}ms`);
      console.log(`  P95 Response Time: ${metric.p95ResponseTime.toFixed(2)}ms`);
      console.log(`  P99 Response Time: ${metric.p99ResponseTime.toFixed(2)}ms`);
      console.log(`  Success Rate: ${(metric.successRate * 100).toFixed(2)}%`);
      console.log(`  Total Requests: ${metric.totalRequests}`);
      console.log(`  Failed Requests: ${metric.failedRequests}`);
      console.log();
    }

    // 总体统计
    const avgResponseTime =
      metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length;
    const avgSuccessRate =
      metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;

    console.log('=== Overall Statistics ===');
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Average Success Rate: ${(avgSuccessRate * 100).toFixed(2)}%`);
    console.log(`Total Requests: ${this.results.length}`);
  }

  exportResults(metrics: PerformanceMetrics[], filename: string): void {
    const fs = require('fs');
    const data = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      metrics: metrics,
      summary: {
        totalRequests: this.results.length,
        avgResponseTime:
          metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length,
        avgSuccessRate:
          metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length,
      },
    };

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`\nResults exported to ${filename}`);
  }
}

// 主函数
async function main() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const tester = new PerformanceTester(baseUrl);

  try {
    const metrics = await tester.runTests();
    tester.printResults(metrics);
    tester.exportResults(metrics, 'performance-results.json');
  } catch (error) {
    console.error('Performance test failed:', error);
    process.exit(1);
  }
}

main();
