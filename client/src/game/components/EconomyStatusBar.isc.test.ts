import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockchainBalanceService, BlockchainRefreshResult } from '../economy/BlockchainBalanceService';

describe('BlockchainBalanceService - ISC Refresh', () => {
  let service: BlockchainBalanceService;

  beforeEach(() => {
    service = new BlockchainBalanceService();
  });

  it('should initialize with default address', () => {
    expect(service.getAddress()).toBeDefined();
    expect(service.getAddress()).toMatch(/^0x[a-f0-9]{40}$/i);
  });

  it('should initialize with zero balance', () => {
    expect(service.getCurrentBalance()).toBe(0);
  });

  it('should set custom address', () => {
    const customAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    service.setAddress(customAddress);
    expect(service.getAddress()).toBe(customAddress);
  });

  it('should refresh ISC balance successfully', async () => {
    const result = await service.refreshISCBalance();

    expect(result.success).toBe(true);
    expect(result.balance).toBeDefined();
    expect(result.balance).toBeGreaterThanOrEqual(0);
    expect(result.balance).toBeLessThanOrEqual(10000);
    expect(result.timestamp).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('should update current balance after refresh', async () => {
    const result = await service.refreshISCBalance();

    expect(result.success).toBe(true);
    expect(service.getCurrentBalance()).toBe(result.balance);
  });

  it('should record refresh history', async () => {
    const result1 = await service.refreshISCBalance();
    const result2 = await service.refreshISCBalance();

    const history = service.getRefreshHistory();
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[history.length - 1].success).toBe(true);
  });

  it('should get last refresh result', async () => {
    const result = await service.refreshISCBalance();

    const lastResult = service.getLastRefreshResult();
    expect(lastResult).toBeDefined();
    expect(lastResult?.success).toBe(true);
    expect(lastResult?.balance).toBe(result.balance);
  });

  it('should clear refresh history', async () => {
    await service.refreshISCBalance();
    await service.refreshISCBalance();

    let history = service.getRefreshHistory();
    expect(history.length).toBeGreaterThan(0);

    service.clearRefreshHistory();
    history = service.getRefreshHistory();
    expect(history.length).toBe(0);
  });

  it('should handle multiple consecutive refreshes', async () => {
    const results: BlockchainRefreshResult[] = [];

    for (let i = 0; i < 3; i++) {
      const result = await service.refreshISCBalance();
      results.push(result);
    }

    expect(results.length).toBe(3);
    expect(results.every(r => r.success)).toBe(true);

    const history = service.getRefreshHistory();
    expect(history.length).toBeGreaterThanOrEqual(3);
  });

  it('should maintain balance consistency', async () => {
    const result1 = await service.refreshISCBalance();
    const balance1 = service.getCurrentBalance();

    const result2 = await service.refreshISCBalance();
    const balance2 = service.getCurrentBalance();

    expect(balance1).toBe(result1.balance);
    expect(balance2).toBe(result2.balance);
  });

  it('should limit refresh history size', async () => {
    // Simulate many refreshes
    for (let i = 0; i < 150; i++) {
      await service.refreshISCBalance();
    }

    const history = service.getRefreshHistory();
    // Should be limited to 100 (maxHistorySize)
    expect(history.length).toBeLessThanOrEqual(100);
  });

  it('should return valid timestamp for each refresh', async () => {
    const result = await service.refreshISCBalance();

    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('should handle rapid consecutive calls', async () => {
    const promises = Array(5).fill(null).map(() => service.refreshISCBalance());
    const results = await Promise.all(promises);

    expect(results.length).toBe(5);
    expect(results.every(r => r.success)).toBe(true);
  });
});
