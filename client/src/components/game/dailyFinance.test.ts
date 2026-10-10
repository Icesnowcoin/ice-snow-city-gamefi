import { describe, expect, it } from 'vitest';
import { GAME_TIME_UNITS_PER_DAY, createDailyFinanceLedger, createDailyFinanceReport, getGameDay, trimDailyFinanceReports } from './dailyFinance';

describe('daily city finance reports', () => {
  it('converts game time into a stable in-game day', () => {
    expect(GAME_TIME_UNITS_PER_DAY).toBe(4320);
    expect(getGameDay(0)).toBe(0);
    expect(getGameDay(GAME_TIME_UNITS_PER_DAY - 1)).toBe(0);
    expect(getGameDay(GAME_TIME_UNITS_PER_DAY)).toBe(1);
  });

  it('closes a ledger with city and ISC net changes', () => {
    const ledger = { ...createDailyFinanceLedger(3, 100000, 4), cityRevenue: 4500, cityExpenses: 1200, iscClaimed: 3, iscSpent: 2, operatingCycles: 8 };
    expect(createDailyFinanceReport(ledger, 103300, 5, 123)).toMatchObject({
      day: 3, cityRevenue: 4500, cityExpenses: 1200, iscClaimed: 3, iscSpent: 2, operatingCycles: 8,
      closingCityFunds: 103300, closingIscBalance: 5, netCityFunds: 3300, netIsc: 1, generatedAt: 123,
    });
  });

  it('keeps the latest 30 reports', () => {
    const reports = Array.from({ length: 31 }, (_, index) => createDailyFinanceReport(createDailyFinanceLedger(index, 0, 0), 0, 0, index));
    expect(trimDailyFinanceReports(reports)).toHaveLength(30);
    expect(trimDailyFinanceReports(reports)[0].day).toBe(0);
  });
});
