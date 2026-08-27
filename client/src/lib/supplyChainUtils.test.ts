import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SUPPLY_CHAIN,
  calculateJobPayout,
  calculateUtilityBill,
  getCareerProgress,
  getNodeStatus,
  getNodeUtilization,
  summarizeSupplyChain,
} from './supplyChainUtils';

describe('supplyChainUtils', () => {
  it('calculates utilization and warns on high or blocked capacity', () => {
    expect(getNodeUtilization({ capacity: 100, currentOutput: 75 })).toBe(75);
    expect(getNodeStatus({ capacity: 100, currentOutput: 95, status: 'active' })).toBe('warning');
    expect(getNodeStatus({ capacity: 100, currentOutput: 20, status: 'offline' })).toBe('offline');
  });

  it('summarizes active flows and identifies the busiest node', () => {
    const summary = summarizeSupplyChain(DEFAULT_SUPPLY_CHAIN);
    expect(summary.activeNodes).toBeGreaterThan(0);
    expect(summary.warningNodes).toBeGreaterThan(0);
    expect(summary.flowingEdges).toBe(5);
    expect(summary.totalVolume).toBe(330);
    expect(summary.bottleneckNodeId).toBe('greenhouse-1');
  });

  it('progresses careers from civilian to entrepreneur', () => {
    expect(getCareerProgress(0)).toMatchObject({ tier: '平民', nextTier: '熟练工', progress: 0 });
    expect(getCareerProgress(900)).toMatchObject({ tier: '熟练工', nextTier: '经营者' });
    expect(getCareerProgress(5000)).toMatchObject({ tier: '企业家', progress: 100 });
  });

  it('calculates wages after utility bills without returning negative ISC', () => {
    expect(calculateUtilityBill({ electricity: 10, water: 5, gas: 2 })).toBe(31);
    expect(calculateJobPayout(80, 8, 31)).toBe(609);
    expect(calculateJobPayout(10, 1, 100)).toBe(0);
  });
});
