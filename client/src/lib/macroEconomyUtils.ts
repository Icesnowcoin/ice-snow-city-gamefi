export const ISC_MINT_DISTRIBUTION = {
  burn: 0.01,
  treasury: 0.69,
  marketing: 0.3,
} as const;

export const ISC_MARKETPLACE_COMMISSION = 0.1;

export interface MintDistribution {
  total: number;
  burned: number;
  treasury: number;
  marketing: number;
}

export interface MacroEconomyPeriod {
  period: string;
  minted: number;
  burned: number;
  treasuryInflow: number;
  marketingInflow: number;
  marketplaceVolume: number;
  marketplaceCommission: number;
  circulatingSupply: number;
}

export interface MacroEconomySnapshot {
  totalMinted: number;
  totalBurned: number;
  totalTreasuryInflow: number;
  totalMarketingInflow: number;
  totalMarketplaceVolume: number;
  totalMarketplaceCommission: number;
  circulatingSupply: number;
  inflationRate: number;
}

export function splitMintAmount(total: number): MintDistribution {
  const safeTotal = Math.max(0, total);
  return {
    total: safeTotal,
    burned: safeTotal * ISC_MINT_DISTRIBUTION.burn,
    treasury: safeTotal * ISC_MINT_DISTRIBUTION.treasury,
    marketing: safeTotal * ISC_MINT_DISTRIBUTION.marketing,
  };
}

export function calculateMarketplaceCommission(volume: number): number {
  return Math.max(0, volume) * ISC_MARKETPLACE_COMMISSION;
}

export function calculateInflationRate(previousSupply: number, currentSupply: number): number {
  const safePrevious = Math.max(0, previousSupply);
  if (safePrevious === 0) return 0;
  return ((currentSupply - safePrevious) / safePrevious) * 100;
}

export function calculateCirculatingSupply(
  initialSupply: number,
  minted: number,
  burned: number,
  locked: number = 0,
): number {
  return Math.max(0, Math.max(0, initialSupply) + Math.max(0, minted) - Math.max(0, burned) - Math.max(0, locked));
}

export function buildMacroEconomySnapshot(
  periods: MacroEconomyPeriod[],
  initialSupply: number,
): MacroEconomySnapshot {
  const totals = periods.reduce(
    (accumulator, period) => ({
      totalMinted: accumulator.totalMinted + Math.max(0, period.minted),
      totalBurned: accumulator.totalBurned + Math.max(0, period.burned),
      totalTreasuryInflow: accumulator.totalTreasuryInflow + Math.max(0, period.treasuryInflow),
      totalMarketingInflow: accumulator.totalMarketingInflow + Math.max(0, period.marketingInflow),
      totalMarketplaceVolume: accumulator.totalMarketplaceVolume + Math.max(0, period.marketplaceVolume),
      totalMarketplaceCommission: accumulator.totalMarketplaceCommission + Math.max(0, period.marketplaceCommission),
    }),
    {
      totalMinted: 0,
      totalBurned: 0,
      totalTreasuryInflow: 0,
      totalMarketingInflow: 0,
      totalMarketplaceVolume: 0,
      totalMarketplaceCommission: 0,
    },
  );
  const circulatingSupply = calculateCirculatingSupply(initialSupply, totals.totalMinted, totals.totalBurned);

  return {
    ...totals,
    circulatingSupply,
    inflationRate: calculateInflationRate(initialSupply, circulatingSupply),
  };
}

export function normalizeMacroPeriods(periods: MacroEconomyPeriod[]): MacroEconomyPeriod[] {
  return periods.map((period) => ({
    ...period,
    minted: Math.max(0, period.minted),
    burned: Math.max(0, period.burned),
    treasuryInflow: Math.max(0, period.treasuryInflow),
    marketingInflow: Math.max(0, period.marketingInflow),
    marketplaceVolume: Math.max(0, period.marketplaceVolume),
    marketplaceCommission: Math.max(0, period.marketplaceCommission || calculateMarketplaceCommission(period.marketplaceVolume)),
    circulatingSupply: Math.max(0, period.circulatingSupply),
  }));
}
