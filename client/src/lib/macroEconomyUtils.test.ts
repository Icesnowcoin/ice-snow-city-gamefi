import { describe, expect, it } from 'vitest';
import {
  buildMacroEconomySnapshot,
  calculateCirculatingSupply,
  calculateInflationRate,
  calculateMarketplaceCommission,
  normalizeMacroPeriods,
  splitMintAmount,
} from './macroEconomyUtils';

describe('macroEconomyUtils', () => {
  it('splits NFT mint consumption into burn, treasury and marketing buckets', () => {
    expect(splitMintAmount(1000)).toEqual({ total: 1000, burned: 10, treasury: 690, marketing: 300 });
    expect(splitMintAmount(-20).total).toBe(0);
  });

  it('calculates the 10% marketplace commission and supply changes', () => {
    expect(calculateMarketplaceCommission(2500)).toBe(250);
    expect(calculateCirculatingSupply(10000, 800, 100, 500)).toBe(10200);
    expect(calculateInflationRate(10000, 10200)).toBe(2);
  });

  it('aggregates macro periods and keeps the mint distribution visible', () => {
    const snapshot = buildMacroEconomySnapshot([
      { period: '2026-06', minted: 1000, burned: 10, treasuryInflow: 690, marketingInflow: 300, marketplaceVolume: 5000, marketplaceCommission: 500, circulatingSupply: 10990 },
      { period: '2026-07', minted: 2000, burned: 20, treasuryInflow: 1380, marketingInflow: 600, marketplaceVolume: 7000, marketplaceCommission: 700, circulatingSupply: 12970 },
    ], 10000);
    expect(snapshot).toMatchObject({
      totalMinted: 3000,
      totalBurned: 30,
      totalTreasuryInflow: 2070,
      totalMarketingInflow: 900,
      totalMarketplaceVolume: 12000,
      totalMarketplaceCommission: 1200,
      circulatingSupply: 12970,
    });
    expect(snapshot.inflationRate).toBeCloseTo(29.7, 5);
  });

  it('normalizes negative values and derives missing commission values', () => {
    const [normalized] = normalizeMacroPeriods([{
      period: '2026-08', minted: -1, burned: -2, treasuryInflow: -3, marketingInflow: -4,
      marketplaceVolume: 1200, marketplaceCommission: 0, circulatingSupply: -10,
    }]);
    expect(normalized).toMatchObject({ minted: 0, burned: 0, treasuryInflow: 0, marketingInflow: 0, marketplaceCommission: 120 });
  });
});
