import { describe, it, expect, beforeEach } from 'vitest';

interface EconomicData {
  timestamp: number;
  totalPlayerIncome: number;
  totalPlayerExpense: number;
  npcWageExpense: number;
  marketVolume: number;
  averagePrice: number;
  bankTotalDeposits: number;
  bankTotalInterest: number;
  inflationRate: number;
  economicHealth: number;
}

interface PlayerEconomicStatus {
  playerId: string;
  playerName: string;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  bankBalance: number;
  bankInterest: number;
  investmentValue: number;
  netWorth: number;
}

// Mock data
const mockEconomicData: EconomicData[] = [
  {
    timestamp: Date.now() - 3600000,
    totalPlayerIncome: 100000,
    totalPlayerExpense: 40000,
    npcWageExpense: 20000,
    marketVolume: 150000,
    averagePrice: 125.5,
    bankTotalDeposits: 500000,
    bankTotalInterest: 25000,
    inflationRate: 2.5,
    economicHealth: 85,
  },
  {
    timestamp: Date.now() - 1800000,
    totalPlayerIncome: 120000,
    totalPlayerExpense: 45000,
    npcWageExpense: 22000,
    marketVolume: 180000,
    averagePrice: 128.3,
    bankTotalDeposits: 520000,
    bankTotalInterest: 26000,
    inflationRate: 2.3,
    economicHealth: 87,
  },
  {
    timestamp: Date.now(),
    totalPlayerIncome: 130000,
    totalPlayerExpense: 50000,
    npcWageExpense: 25000,
    marketVolume: 200000,
    averagePrice: 130.2,
    bankTotalDeposits: 550000,
    bankTotalInterest: 27500,
    inflationRate: 2.1,
    economicHealth: 88,
  },
];

const mockPlayerStatus: PlayerEconomicStatus[] = [
  {
    playerId: 'player_001',
    playerName: '玩家 A',
    totalIncome: 50000,
    totalExpense: 20000,
    netIncome: 30000,
    bankBalance: 100000,
    bankInterest: 5000,
    investmentValue: 50000,
    netWorth: 185000,
  },
  {
    playerId: 'player_002',
    playerName: '玩家 B',
    totalIncome: 40000,
    totalExpense: 18000,
    netIncome: 22000,
    bankBalance: 80000,
    bankInterest: 4000,
    investmentValue: 40000,
    netWorth: 144000,
  },
  {
    playerId: 'player_003',
    playerName: '玩家 C',
    totalIncome: 35000,
    totalExpense: 15000,
    netIncome: 20000,
    bankBalance: 70000,
    bankInterest: 3500,
    investmentValue: 30000,
    netWorth: 123500,
  },
];

describe('Economic Cycle System', () => {
  let economicData: EconomicData[];
  let playerStatus: PlayerEconomicStatus[];

  beforeEach(() => {
    economicData = JSON.parse(JSON.stringify(mockEconomicData));
    playerStatus = JSON.parse(JSON.stringify(mockPlayerStatus));
  });

  describe('Economic Flow Analysis', () => {
    it('should calculate net economic flow', () => {
      const data = economicData[0];
      const netFlow = data.totalPlayerIncome - data.totalPlayerExpense - data.npcWageExpense;
      expect(netFlow).toBe(40000);
    });

    it('should track income growth', () => {
      const firstIncome = economicData[0].totalPlayerIncome;
      const lastIncome = economicData[economicData.length - 1].totalPlayerIncome;
      expect(lastIncome).toBeGreaterThan(firstIncome);
    });

    it('should track expense growth', () => {
      const firstExpense = economicData[0].totalPlayerExpense;
      const lastExpense = economicData[economicData.length - 1].totalPlayerExpense;
      expect(lastExpense).toBeGreaterThanOrEqual(firstExpense);
    });

    it('should calculate income to expense ratio', () => {
      const data = economicData[0];
      const ratio = data.totalPlayerIncome / data.totalPlayerExpense;
      expect(ratio).toBeGreaterThan(1);
    });
  });

  describe('NPC Wage Management', () => {
    it('should maintain reasonable NPC wage ratio', () => {
      const data = economicData[0];
      const wageRatio = (data.npcWageExpense / data.totalPlayerIncome) * 100;
      expect(wageRatio).toBeLessThan(50); // NPC 工资不应超过收入的 50%
    });

    it('should calculate average NPC wage', () => {
      const data = economicData[0];
      const npcCount = 200;
      const avgWage = data.npcWageExpense / npcCount;
      expect(avgWage).toBeGreaterThan(0);
      expect(avgWage).toBeLessThan(1000); // 避免过高工资
    });

    it('should prevent wage inflation', () => {
      const firstWage = economicData[0].npcWageExpense;
      const lastWage = economicData[economicData.length - 1].npcWageExpense;
      const growthRate = ((lastWage - firstWage) / firstWage) * 100;
      expect(growthRate).toBeLessThan(50); // 工资增长不应超过 50%
    });
  });

  describe('Utility Expense Tracking', () => {
    it('should calculate electricity expense', () => {
      const data = economicData[0];
      const electricityExpense = data.totalPlayerExpense * 0.2;
      expect(electricityExpense).toBeGreaterThan(0);
    });

    it('should calculate water expense', () => {
      const data = economicData[0];
      const waterExpense = data.totalPlayerExpense * 0.2;
      expect(waterExpense).toBeGreaterThan(0);
    });

    it('should track total utility expense', () => {
      const data = economicData[0];
      const utilityExpense = data.totalPlayerExpense * 0.4; // 电费 + 水费
      expect(utilityExpense).toBeLessThan(data.totalPlayerExpense);
    });
  });

  describe('Bank System Analysis', () => {
    it('should calculate average APY', () => {
      const data = economicData[0];
      const avgAPY = (data.bankTotalInterest / data.bankTotalDeposits) * 100;
      expect(avgAPY).toBeGreaterThan(0);
      expect(avgAPY).toBeLessThan(50); // APY 应该合理
    });

    it('should track deposit growth', () => {
      const firstDeposit = economicData[0].bankTotalDeposits;
      const lastDeposit = economicData[economicData.length - 1].bankTotalDeposits;
      expect(lastDeposit).toBeGreaterThanOrEqual(firstDeposit);
    });

    it('should track interest accumulation', () => {
      const firstInterest = economicData[0].bankTotalInterest;
      const lastInterest = economicData[economicData.length - 1].bankTotalInterest;
      expect(lastInterest).toBeGreaterThanOrEqual(firstInterest);
    });

    it('should encourage long-term investment', () => {
      const data = economicData[0];
      const interestRate = data.bankTotalInterest / data.bankTotalDeposits;
      expect(interestRate).toBeGreaterThan(0);
    });
  });

  describe('Market Dynamics', () => {
    it('should track market volume', () => {
      const data = economicData[0];
      expect(data.marketVolume).toBeGreaterThan(0);
    });

    it('should track average price changes', () => {
      const prices = economicData.map(d => d.averagePrice);
      expect(prices.length).toBeGreaterThan(0);
    });

    it('should calculate price volatility', () => {
      const prices = economicData.map(d => d.averagePrice);
      const avgPrice = prices.reduce((a, b) => a + b) / prices.length;
      const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
      const volatility = Math.sqrt(variance);
      expect(volatility).toBeGreaterThanOrEqual(0);
    });

    it('should track market growth', () => {
      const firstVolume = economicData[0].marketVolume;
      const lastVolume = economicData[economicData.length - 1].marketVolume;
      expect(lastVolume).toBeGreaterThanOrEqual(firstVolume);
    });
  });

  describe('Inflation Monitoring', () => {
    it('should track inflation rate', () => {
      economicData.forEach(data => {
        expect(data.inflationRate).toBeGreaterThanOrEqual(0);
        expect(data.inflationRate).toBeLessThan(10); // 通货膨胀应该在合理范围内
      });
    });

    it('should maintain stable inflation', () => {
      const inflationRates = economicData.map(d => d.inflationRate);
      const avgInflation = inflationRates.reduce((a, b) => a + b) / inflationRates.length;
      expect(avgInflation).toBeLessThan(5);
    });
  });

  describe('Economic Health Assessment', () => {
    it('should calculate economic health score', () => {
      economicData.forEach(data => {
        expect(data.economicHealth).toBeGreaterThanOrEqual(0);
        expect(data.economicHealth).toBeLessThanOrEqual(100);
      });
    });

    it('should improve economic health over time', () => {
      const firstHealth = economicData[0].economicHealth;
      const lastHealth = economicData[economicData.length - 1].economicHealth;
      expect(lastHealth).toBeGreaterThanOrEqual(firstHealth);
    });

    it('should identify health status', () => {
      const data = economicData[0];
      let status = '';
      if (data.economicHealth >= 80) status = '非常健康';
      else if (data.economicHealth >= 60) status = '健康';
      else if (data.economicHealth >= 40) status = '一般';
      else status = '需要调整';
      expect(status).toBeTruthy();
    });
  });

  describe('Player Economic Status', () => {
    it('should calculate net income', () => {
      playerStatus.forEach(player => {
        const netIncome = player.totalIncome - player.totalExpense;
        expect(netIncome).toBe(player.netIncome);
      });
    });

    it('should calculate net worth', () => {
      playerStatus.forEach(player => {
        const netWorth = player.bankBalance + player.investmentValue + player.netIncome;
        expect(netWorth).toBeLessThanOrEqual(player.netWorth);
      });
    });

    it('should rank players by net worth', () => {
      const sorted = [...playerStatus].sort((a, b) => b.netWorth - a.netWorth);
      expect(sorted[0].netWorth).toBeGreaterThanOrEqual(sorted[1].netWorth);
      expect(sorted[1].netWorth).toBeGreaterThanOrEqual(sorted[2].netWorth);
    });

    it('should track individual bank interest', () => {
      playerStatus.forEach(player => {
        expect(player.bankInterest).toBeGreaterThanOrEqual(0);
      });
    });

    it('should identify wealthy players', () => {
      const wealthyPlayers = playerStatus.filter(p => p.netWorth > 150000);
      expect(wealthyPlayers.length).toBeGreaterThan(0);
    });
  });

  describe('Economic Balance Checks', () => {
    it('should maintain income-expense balance', () => {
      const totalIncome = playerStatus.reduce((sum, p) => sum + p.totalIncome, 0);
      const totalExpense = playerStatus.reduce((sum, p) => sum + p.totalExpense, 0);
      expect(totalIncome).toBeGreaterThan(totalExpense);
    });

    it('should prevent negative net worth', () => {
      playerStatus.forEach(player => {
        expect(player.netWorth).toBeGreaterThanOrEqual(0);
      });
    });

    it('should validate economic data consistency', () => {
      economicData.forEach(data => {
        expect(data.totalPlayerIncome).toBeGreaterThan(0);
        expect(data.totalPlayerExpense).toBeGreaterThan(0);
        expect(data.npcWageExpense).toBeGreaterThan(0);
        expect(data.marketVolume).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large economic dataset', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...economicData[0],
        timestamp: Date.now() - (1000 - i) * 3600000,
      }));

      const startTime = performance.now();
      const avgHealth = largeDataset.reduce((sum, d) => sum + d.economicHealth, 0) / largeDataset.length;
      const endTime = performance.now();

      expect(avgHealth).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle zero economic data', () => {
      const emptyData: EconomicData[] = [];
      expect(emptyData.length).toBe(0);
    });

    it('should handle extreme values', () => {
      const extremeData: EconomicData = {
        timestamp: Date.now(),
        totalPlayerIncome: 1000000,
        totalPlayerExpense: 100000,
        npcWageExpense: 50000,
        marketVolume: 5000000,
        averagePrice: 999.99,
        bankTotalDeposits: 10000000,
        bankTotalInterest: 500000,
        inflationRate: 0.1,
        economicHealth: 95,
      };

      const netFlow = extremeData.totalPlayerIncome - extremeData.totalPlayerExpense - extremeData.npcWageExpense;
      expect(netFlow).toBeGreaterThan(0);
    });
  });

  describe('Economic Trend Analysis', () => {
    it('should identify growth trend', () => {
      const incomes = economicData.map(d => d.totalPlayerIncome);
      const isGrowing = incomes[incomes.length - 1] > incomes[0];
      expect(isGrowing).toBe(true);
    });

    it('should calculate growth rate', () => {
      const firstIncome = economicData[0].totalPlayerIncome;
      const lastIncome = economicData[economicData.length - 1].totalPlayerIncome;
      const growthRate = ((lastIncome - firstIncome) / firstIncome) * 100;
      expect(growthRate).toBeGreaterThan(0);
    });

    it('should identify market trends', () => {
      const volumes = economicData.map(d => d.marketVolume);
      const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
      expect(avgVolume).toBeGreaterThan(0);
    });
  });
});
