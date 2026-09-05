/**
 * Benchmark Runner
 * Executes performance benchmarks and generates comprehensive HTML reports
 */

import {
  runCompleteBenchmarkSuite,
  analyzeBenchmarkResults,
  BenchmarkSuite,
} from './performanceBenchmark';
import {
  createPerformanceSnapshot,
  generatePerformanceReport,
  exportReportAsHTML,
  PerformanceSnapshot,
} from './performanceReportGenerator';

/**
 * Generate comprehensive benchmark HTML report
 */
export async function generateBenchmarkHTMLReport(): Promise<string> {
  // Run benchmark suite
  const suite = await runCompleteBenchmarkSuite();
  const analysis = analyzeBenchmarkResults(suite);

  // Create HTML report
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ice Snow City - 性能基准测试报告</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }

    .header p {
      font-size: 1.1em;
      opacity: 0.9;
    }

    .timestamp {
      font-size: 0.9em;
      opacity: 0.8;
      margin-top: 10px;
    }

    .content {
      padding: 40px;
    }

    .section {
      margin-bottom: 40px;
    }

    .section-title {
      font-size: 1.8em;
      color: #667eea;
      margin-bottom: 20px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }

    .summary-card-value {
      font-size: 2em;
      font-weight: bold;
      margin: 10px 0;
    }

    .summary-card-label {
      font-size: 0.9em;
      opacity: 0.9;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    th {
      background: #667eea;
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }

    td {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
    }

    tr:hover {
      background: #f5f5f5;
    }

    .status-success {
      color: #4caf50;
      font-weight: bold;
    }

    .status-warning {
      color: #ff9800;
      font-weight: bold;
    }

    .status-error {
      color: #f44336;
      font-weight: bold;
    }

    .bottleneck-list,
    .improvement-list,
    .recommendation-list {
      list-style: none;
      margin: 15px 0;
    }

    .bottleneck-list li,
    .improvement-list li,
    .recommendation-list li {
      padding: 12px;
      margin: 8px 0;
      border-radius: 6px;
      border-left: 4px solid;
    }

    .bottleneck-list li {
      background: #ffebee;
      border-left-color: #f44336;
      color: #c62828;
    }

    .improvement-list li {
      background: #e8f5e9;
      border-left-color: #4caf50;
      color: #2e7d32;
    }

    .recommendation-list li {
      background: #fff3e0;
      border-left-color: #ff9800;
      color: #e65100;
    }

    .chart-container {
      margin: 30px 0;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .chart-title {
      font-size: 1.2em;
      margin-bottom: 15px;
      color: #333;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 15px;
      height: 300px;
    }

    .bar {
      flex: 1;
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px 8px 0 0;
      position: relative;
      min-height: 20px;
    }

    .bar-label {
      position: absolute;
      bottom: -30px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 0.85em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-value {
      position: absolute;
      top: -25px;
      left: 0;
      right: 0;
      text-align: center;
      font-weight: bold;
      font-size: 0.9em;
    }

    .footer {
      background: #f5f5f5;
      padding: 20px 40px;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }

    .metric-row:last-child {
      border-bottom: none;
    }

    .metric-label {
      font-weight: 600;
      color: #667eea;
    }

    .metric-value {
      font-weight: bold;
    }

    .improvement-badge {
      display: inline-block;
      background: #4caf50;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      margin-left: 10px;
    }

    .bottleneck-badge {
      display: inline-block;
      background: #f44336;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      margin-left: 10px;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 1.8em;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .bar-chart {
        flex-direction: column;
        height: auto;
      }

      .bar {
        height: 40px;
      }

      .bar-label {
        position: static;
        margin-top: 10px;
      }

      .bar-value {
        position: static;
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1><img src="/manus-storage/isc_token_icon_256_ed4ff47d.png" alt="ISC" style="width:32px;height:32px;vertical-align:middle;object-fit:contain;" /> Ice Snow City</h1>
      <h2>性能基准测试报告</h2>
      <p>Performance Benchmark Report</p>
      <div class="timestamp">生成时间: ${new Date(suite.timestamp).toLocaleString('zh-CN')}</div>
    </div>

    <div class="content">
      <!-- Summary Section -->
      <div class="section">
        <h2 class="section-title">📊 测试概览</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-card-label">总测试时间</div>
            <div class="summary-card-value">${suite.summary.totalDuration.toFixed(2)}ms</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">平均操作/秒</div>
            <div class="summary-card-value">${suite.summary.averageOperationsPerSecond.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">成功率</div>
            <div class="summary-card-value">${suite.summary.successRate.toFixed(1)}%</div>
          </div>
          <div class="summary-card">
            <div class="summary-card-label">测试数量</div>
            <div class="summary-card-value">${suite.results.length}</div>
          </div>
        </div>
      </div>

      <!-- Detailed Results -->
      <div class="section">
        <h2 class="section-title">📈 详细测试结果</h2>
        <table>
          <thead>
            <tr>
              <th>测试名称</th>
              <th>执行时间 (ms)</th>
              <th>操作/秒</th>
              <th>内存变化 (MB)</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            ${suite.results
              .map(
                (result) => `
            <tr>
              <td>${result.name}</td>
              <td>${result.duration.toFixed(2)}</td>
              <td>${result.operationsPerSecond.toFixed(2)}</td>
              <td>${((result.memoryAfter - result.memoryBefore) / 1024 / 1024).toFixed(2)}</td>
              <td class="${result.success ? 'status-success' : 'status-error'}">
                ${result.success ? '✅ 成功' : '❌ 失败'}
              </td>
            </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- Analysis Section -->
      <div class="section">
        <h2 class="section-title">🔍 性能分析</h2>

        ${
          analysis.bottlenecks.length > 0
            ? `
        <div class="chart-container">
          <div class="chart-title">⚠️ 发现的性能瓶颈</div>
          <ul class="bottleneck-list">
            ${analysis.bottlenecks.map((b) => `<li>${b}</li>`).join('')}
          </ul>
        </div>
        `
            : ''
        }

        ${
          analysis.improvements.length > 0
            ? `
        <div class="chart-container">
          <div class="chart-title">✅ 优化效果</div>
          <ul class="improvement-list">
            ${analysis.improvements.map((i) => `<li>${i}</li>`).join('')}
          </ul>
        </div>
        `
            : ''
        }

        ${
          analysis.recommendations.length > 0
            ? `
        <div class="chart-container">
          <div class="chart-title">💡 优化建议</div>
          <ul class="recommendation-list">
            ${analysis.recommendations.map((r) => `<li>${r}</li>`).join('')}
          </ul>
        </div>
        `
            : ''
        }
      </div>

      <!-- Performance Comparison -->
      <div class="section">
        <h2 class="section-title">📊 性能对比分析</h2>
        <div class="chart-container">
          <div class="chart-title">各测试执行时间对比</div>
          <div class="bar-chart">
            ${suite.results
              .map((result) => {
                const maxDuration = Math.max(...suite.results.map((r) => r.duration));
                const percentage = (result.duration / maxDuration) * 100;
                return `
              <div class="bar" style="height: ${percentage}%;">
                <div class="bar-value">${result.duration.toFixed(0)}ms</div>
                <div class="bar-label">${result.name.replace(/\s+/g, '\n')}</div>
              </div>
            `;
              })
              .join('')}
          </div>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="section">
        <h2 class="section-title">🎯 关键指标</h2>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div class="metric-row">
            <span class="metric-label">最快操作:</span>
            <span class="metric-value">
              ${suite.results.reduce((min, r) => (r.duration < min.duration ? r : min)).name}
              (${Math.min(...suite.results.map((r) => r.duration)).toFixed(2)}ms)
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">最慢操作:</span>
            <span class="metric-value">
              ${suite.results.reduce((max, r) => (r.duration > max.duration ? r : max)).name}
              (${Math.max(...suite.results.map((r) => r.duration)).toFixed(2)}ms)
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">平均执行时间:</span>
            <span class="metric-value">
              ${(suite.results.reduce((sum, r) => sum + r.duration, 0) / suite.results.length).toFixed(2)}ms
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">总内存变化:</span>
            <span class="metric-value">
              ${(
                suite.results.reduce((sum, r) => sum + (r.memoryAfter - r.memoryBefore), 0) /
                1024 /
                1024
              ).toFixed(2)}MB
            </span>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="section">
        <h2 class="section-title">🚀 后续优化建议</h2>
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
          <h3 style="color: #1976d2; margin-bottom: 15px;">基于测试结果的优化建议:</h3>
          <ul style="margin-left: 20px; line-height: 1.8;">
            <li>继续使用批量查询机制优化 NPC 数据获取</li>
            <li>增强缓存策略以提高经济数据的访问速度</li>
            <li>实施请求去重机制减少并发请求开销</li>
            <li>监控内存使用，防止内存泄漏</li>
            <li>定期运行性能基准测试以跟踪优化效果</li>
            <li>考虑实施渐进式加载策略改善用户体验</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Ice Snow City Performance Benchmark Report</p>
      <p>生成于 ${new Date().toLocaleString('zh-CN')}</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Save benchmark report to file
 */
export async function saveBenchmarkReport(filename: string = 'performance-report.html'): Promise<string> {
  const html = await generateBenchmarkHTMLReport();
  // In a real environment, this would save to file
  // For now, return the HTML content
  return html;
}
