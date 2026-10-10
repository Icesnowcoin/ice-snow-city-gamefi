import { describe, expect, it } from 'vitest';
import { claimPendingIsc, convertIscToCityFunds, settleCityRevenueToIsc } from './micropolisEconomy';

describe('Micropolis ↔ ISC economy adapter', () => {
  it('converts ISC into city funds without touching the wallet on failure', () => {
    expect(convertIscToCityFunds(3, 2)).toMatchObject({ success: true, iscBalance: 1, cityFunds: 2000 });
    expect(convertIscToCityFunds(1, 2)).toMatchObject({ success: false, iscBalance: 1, cityFunds: 0 });
  });

  it('settles only positive Micropolis revenue and carries sub-ISC value forward', () => {
    expect(settleCityRevenueToIsc(2500)).toEqual({ earned: 2, carry: 500 });
    expect(settleCityRevenueToIsc(600, 500)).toEqual({ earned: 1, carry: 100 });
    expect(settleCityRevenueToIsc(-500, 100)).toEqual({ earned: 0, carry: 100 });
  });

  it('claims city revenue into the same in-game ISC balance used by operations', () => {
    expect(claimPendingIsc({ iscBalance: 4, cityFunds: 20_000, pendingIsc: 3, revenueCarry: 250 })).toEqual({
      iscBalance: 7,
      cityFunds: 20_000,
      pendingIsc: 0,
      revenueCarry: 250,
    });
  });
});
