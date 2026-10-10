// GameHub advances one unit every 100 ms: 4,320 units = 432 seconds = 7.2 minutes.
export const GAME_TIME_UNITS_PER_DAY = 4320;
export const MAX_DAILY_FINANCE_REPORTS = 30;

export type DailyFinanceLedger = {
  day: number;
  openingCityFunds: number;
  openingIscBalance: number;
  cityRevenue: number;
  cityExpenses: number;
  iscClaimed: number;
  iscSpent: number;
  operatingCycles: number;
};

export type DailyFinanceReport = DailyFinanceLedger & {
  closingCityFunds: number;
  closingIscBalance: number;
  netCityFunds: number;
  netIsc: number;
  generatedAt: number;
};

export function getGameDay(gameTime: number) {
  return Math.max(0, Math.floor(Math.max(0, gameTime) / GAME_TIME_UNITS_PER_DAY));
}

export function createDailyFinanceLedger(day: number, cityFunds: number, iscBalance: number): DailyFinanceLedger {
  return {
    day: Math.max(0, Math.floor(day)),
    openingCityFunds: Math.max(0, Math.floor(cityFunds)),
    openingIscBalance: Math.max(0, Math.floor(iscBalance)),
    cityRevenue: 0,
    cityExpenses: 0,
    iscClaimed: 0,
    iscSpent: 0,
    operatingCycles: 0,
  };
}

export function createDailyFinanceReport(ledger: DailyFinanceLedger, closingCityFunds: number, closingIscBalance: number, generatedAt = Date.now()): DailyFinanceReport {
  const closingFunds = Math.max(0, Math.floor(closingCityFunds));
  const closingIsc = Math.max(0, Math.floor(closingIscBalance));
  return {
    ...ledger,
    closingCityFunds: closingFunds,
    closingIscBalance: closingIsc,
    netCityFunds: closingFunds - ledger.openingCityFunds,
    netIsc: closingIsc - ledger.openingIscBalance,
    generatedAt,
  };
}

export function trimDailyFinanceReports(reports: DailyFinanceReport[]) {
  return reports.slice(0, MAX_DAILY_FINANCE_REPORTS);
}
