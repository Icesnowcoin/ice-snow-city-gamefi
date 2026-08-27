import { describe, it, expect, beforeEach } from 'vitest';
import {
  ISCContractManager,
  ISC_CONTRACT_CONFIG,
  getISCContractManager,
} from './iscContractIntegration';

describe('ISC Contract Integration', () => {
  let manager: ISCContractManager;

  beforeEach(() => {
    manager = new ISCContractManager();
  });

  describe('Contract Configuration', () => {
    it('should have correct contract address', () => {
      expect(ISC_CONTRACT_CONFIG.address).toBe('0x11229a3f976566FA8a3ba462C432122f3B8876f6');
    });

    it('should have correct decimals', () => {
      expect(ISC_CONTRACT_CONFIG.decimals).toBe(18);
    });

    it('should have correct symbol', () => {
      expect(ISC_CONTRACT_CONFIG.symbol).toBe('ISC');
    });

    it('should have ERC20 ABI', () => {
      expect(ISC_CONTRACT_CONFIG.abi.length).toBeGreaterThan(0);
      expect(ISC_CONTRACT_CONFIG.abi).toContain('function balanceOf(address owner) view returns (uint256)');
    });
  });

  describe('Balance Formatting', () => {
    it('should format balance correctly', () => {
      // 1 ISC = 10^18 wei
      const balance = manager['formatBalance']('1000000000000000000');
      expect(balance).toBe('1');
    });

    it('should format fractional balance', () => {
      // 0.5 ISC = 5 * 10^17 wei
      const balance = manager['formatBalance']('500000000000000000');
      expect(balance).toBe('0.5');
    });

    it('should format small balance', () => {
      // 0.001 ISC = 10^15 wei
      const balance = manager['formatBalance']('1000000000000000');
      expect(balance).toBe('0.001');
    });

    it('should handle zero balance', () => {
      const balance = manager['formatBalance']('0');
      expect(balance).toBe('0');
    });

    it('should handle large balance', () => {
      // 1,000,000 ISC
      const balance = manager['formatBalance']('1000000000000000000000000');
      expect(balance).toBe('1000000');
    });
  });

  describe('Balance Parsing', () => {
    it('should parse balance correctly', () => {
      const parsed = manager['parseBalance']('1');
      expect(parsed).toBe('1000000000000000000');
    });

    it('should parse fractional balance', () => {
      const parsed = manager['parseBalance']('0.5');
      expect(parsed).toBe('500000000000000000');
    });

    it('should parse small balance', () => {
      const parsed = manager['parseBalance']('0.001');
      expect(parsed).toBe('1000000000000000');
    });

    it('should handle zero balance', () => {
      const parsed = manager['parseBalance']('0');
      expect(parsed).toBe('0');
    });
  });

  describe('Player Balance Management', () => {
    it('should track player balances', () => {
      const balance = {
        playerId: 'player1',
        address: '0x1234567890123456789012345678901234567890',
        balance: '1000000000000000000',
        balanceFormatted: '1',
        lastUpdated: Date.now(),
      };

      // Simulate balance update
      manager['playerBalances'].set('player1', balance);

      const allBalances = manager.getAllPlayerBalances();
      expect(allBalances.length).toBe(1);
      expect(allBalances[0].playerId).toBe('player1');
    });

    it('should get all player balances', () => {
      const balance1 = {
        playerId: 'player1',
        address: '0x1111111111111111111111111111111111111111',
        balance: '1000000000000000000',
        balanceFormatted: '1',
        lastUpdated: Date.now(),
      };

      const balance2 = {
        playerId: 'player2',
        address: '0x2222222222222222222222222222222222222222',
        balance: '2000000000000000000',
        balanceFormatted: '2',
        lastUpdated: Date.now(),
      };

      manager['playerBalances'].set('player1', balance1);
      manager['playerBalances'].set('player2', balance2);

      const allBalances = manager.getAllPlayerBalances();
      expect(allBalances.length).toBe(2);
    });
  });

  describe('Transfer Record Management', () => {
    it('should track transfer records', () => {
      const record = {
        id: 'transfer_1',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amount: '1000000000000000000',
        amountFormatted: '1',
        transactionHash: '0xabc123',
        blockNumber: 12345,
        timestamp: Date.now(),
        type: 'transfer' as const,
      };

      manager['transferRecords'].push(record);

      const records = manager.getTransferRecords();
      expect(records.length).toBe(1);
      expect(records[0].id).toBe('transfer_1');
    });

    it('should filter transfer records by from address', () => {
      const record1 = {
        id: 'transfer_1',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amount: '1000000000000000000',
        amountFormatted: '1',
        transactionHash: '0xabc123',
        blockNumber: 12345,
        timestamp: Date.now(),
        type: 'transfer' as const,
      };

      const record2 = {
        id: 'transfer_2',
        from: '0x3333333333333333333333333333333333333333',
        to: '0x2222222222222222222222222222222222222222',
        amount: '2000000000000000000',
        amountFormatted: '2',
        transactionHash: '0xdef456',
        blockNumber: 12346,
        timestamp: Date.now(),
        type: 'transfer' as const,
      };

      manager['transferRecords'].push(record1);
      manager['transferRecords'].push(record2);

      const filtered = manager.getTransferRecords({
        from: '0x1111111111111111111111111111111111111111',
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('transfer_1');
    });

    it('should filter transfer records by type', () => {
      const record1 = {
        id: 'transfer_1',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amount: '1000000000000000000',
        amountFormatted: '1',
        transactionHash: '0xabc123',
        blockNumber: 12345,
        timestamp: Date.now(),
        type: 'deposit' as const,
      };

      const record2 = {
        id: 'transfer_2',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amount: '2000000000000000000',
        amountFormatted: '2',
        transactionHash: '0xdef456',
        blockNumber: 12346,
        timestamp: Date.now(),
        type: 'withdrawal' as const,
      };

      manager['transferRecords'].push(record1);
      manager['transferRecords'].push(record2);

      const deposits = manager.getTransferRecords({ type: 'deposit' });
      expect(deposits.length).toBe(1);
      expect(deposits[0].type).toBe('deposit');
    });
  });

  describe('Player Transfer Statistics', () => {
    it('should calculate total received', () => {
      const record1 = {
        id: 'transfer_1',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amount: '1000000000000000000',
        amountFormatted: '1',
        transactionHash: '0xabc123',
        blockNumber: 12345,
        timestamp: Date.now(),
        type: 'transfer' as const,
      };

      const record2 = {
        id: 'transfer_2',
        from: '0x3333333333333333333333333333333333333333',
        to: '0x2222222222222222222222222222222222222222',
        amount: '2000000000000000000',
        amountFormatted: '2',
        transactionHash: '0xdef456',
        blockNumber: 12346,
        timestamp: Date.now(),
        type: 'transfer' as const,
      };

      manager['transferRecords'].push(record1);
      manager['transferRecords'].push(record2);

      const stats = manager.getPlayerTransferStats(
        'player2',
        '0x2222222222222222222222222222222222222222'
      );

      expect(stats.totalReceived).toBe('3');
      expect(stats.transactionCount).toBe(2);
    });

    it('should calculate total sent', () => {
      const record = {
        id: 'transfer_1',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amount: '1000000000000000000',
        amountFormatted: '1',
        transactionHash: '0xabc123',
        blockNumber: 12345,
        timestamp: Date.now(),
        type: 'transfer' as const,
      };

      manager['transferRecords'].push(record);

      const stats = manager.getPlayerTransferStats(
        'player1',
        '0x1111111111111111111111111111111111111111'
      );

      expect(stats.totalSent).toBe('1');
    });
  });

  describe('Statistics', () => {
    it('should calculate statistics', () => {
      const balance1 = {
        playerId: 'player1',
        address: '0x1111111111111111111111111111111111111111',
        balance: '1000000000000000000',
        balanceFormatted: '1',
        lastUpdated: Date.now(),
      };

      const balance2 = {
        playerId: 'player2',
        address: '0x2222222222222222222222222222222222222222',
        balance: '3000000000000000000',
        balanceFormatted: '3',
        lastUpdated: Date.now(),
      };

      manager['playerBalances'].set('player1', balance1);
      manager['playerBalances'].set('player2', balance2);

      const record = {
        id: 'transfer_1',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amount: '1000000000000000000',
        amountFormatted: '1',
        transactionHash: '0xabc123',
        blockNumber: 12345,
        timestamp: Date.now(),
        type: 'transfer' as const,
      };

      manager['transferRecords'].push(record);

      const stats = manager.getStatistics();

      expect(stats.totalPlayers).toBe(2);
      expect(stats.totalTransactions).toBe(1);
      expect(stats.totalTransferred).toBe('1');
      expect(stats.averageBalance).toBe('2');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const manager1 = getISCContractManager();
      const manager2 = getISCContractManager();

      expect(manager1).toBe(manager2);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      const balance = {
        playerId: 'player1',
        address: '0x1111111111111111111111111111111111111111',
        balance: '1000000000000000000',
        balanceFormatted: '1',
        lastUpdated: Date.now(),
      };

      manager['playerBalances'].set('player1', balance);
      manager.clearCache();

      const allBalances = manager.getAllPlayerBalances();
      expect(allBalances.length).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow', () => {
      // Add player balance
      const balance = {
        playerId: 'player1',
        address: '0x1111111111111111111111111111111111111111',
        balance: '5000000000000000000',
        balanceFormatted: '5',
        lastUpdated: Date.now(),
      };

      manager['playerBalances'].set('player1', balance);

      // Add transfer record
      const record = {
        id: 'transfer_1',
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amount: '1000000000000000000',
        amountFormatted: '1',
        transactionHash: '0xabc123',
        blockNumber: 12345,
        timestamp: Date.now(),
        type: 'transfer' as const,
      };

      manager['transferRecords'].push(record);

      // Get statistics
      const stats = manager.getStatistics();
      expect(stats.totalPlayers).toBe(1);
      expect(stats.totalTransactions).toBe(1);

      // Get transfer stats
      const transferStats = manager.getPlayerTransferStats(
        'player1',
        '0x1111111111111111111111111111111111111111'
      );
      expect(transferStats.totalSent).toBe('1');
    });
  });
});
