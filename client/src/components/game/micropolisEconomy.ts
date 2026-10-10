export const ISC_TO_CITY_FUNDS_RATE = 1000;
export const CITY_FUNDS_TO_ISC_RATE = 1000;
export const CITY_REVENUE_SETTLEMENT_THRESHOLD = 1000;

export type CityEconomyLedger = {
  iscBalance: number;
  cityFunds: number;
  pendingIsc: number;
  revenueCarry: number;
};

export function convertIscToCityFunds(iscBalance: number, amount: number, rate = ISC_TO_CITY_FUNDS_RATE) {
  const safeBalance = Math.max(0, Math.floor(iscBalance));
  const safeAmount = Math.max(0, Math.floor(amount));
  const safeRate = Math.max(1, Math.floor(rate));
  if (safeAmount < 1) return { success: false, iscBalance: safeBalance, cityFunds: 0, message: '请输入至少 1 ISC。' };
  if (safeBalance < safeAmount) return { success: false, iscBalance: safeBalance, cityFunds: 0, message: 'ISC 余额不足，无法注入城市资金。' };
  return {
    success: true,
    iscBalance: safeBalance - safeAmount,
    cityFunds: safeAmount * safeRate,
    message: `已注入 ${safeAmount} ISC，城市资金增加 $${(safeAmount * safeRate).toLocaleString('zh-CN')}。`,
  };
}

export function settleCityRevenueToIsc(
  fundsDelta: number,
  carry = 0,
  rate = CITY_FUNDS_TO_ISC_RATE,
) {
  const safeDelta = Math.max(0, Math.floor(fundsDelta));
  const safeCarry = Math.max(0, Math.floor(carry));
  const safeRate = Math.max(1, Math.floor(rate));
  const total = safeCarry + safeDelta;
  const earned = Math.floor(total / safeRate);
  return { earned, carry: total % safeRate };
}

export function claimPendingIsc(ledger: CityEconomyLedger) {
  const claim = Math.max(0, Math.floor(ledger.pendingIsc));
  return {
    ...ledger,
    iscBalance: Math.max(0, Math.floor(ledger.iscBalance)) + claim,
    pendingIsc: 0,
  };
}
