/**
 * 钱包授权系统类型定义
 */

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | 'ledger' | 'trezor' | 'phantom' | 'solflare';

export type TransactionType = 'deposit' | 'withdrawal' | 'purchase' | 'transfer';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export interface WalletConnection {
  id: number;
  userId: number;
  walletType: WalletType;
  walletAddress: string;
  chainId: number;
  isConnected: boolean;
  isPrimary: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface WalletAuthorization {
  id: number;
  userId: number;
  walletId: number;
  transactionType: TransactionType;
  amount: string;
  iscAmount: string;
  gasFee: string;
  status: TransactionStatus;
  txHash: string | null;
  errorMessage: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
  expiresAt: Date;
}

export interface GameBalance {
  userId: number;
  iscBalance: string;
  totalDeposited: string;
  totalWithdrawn: string;
  totalSpent: string;
  lastUpdatedAt: Date;
}

export interface DepositRequest {
  id: number;
  userId: number;
  walletId: number;
  amount: string;
  iscAmount: string;
  gasFee: string;
  status: TransactionStatus;
  txHash: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
}

export interface WithdrawalRequest {
  id: number;
  userId: number;
  walletId: number;
  iscAmount: string;
  amount: string;
  gasFee: string;
  status: TransactionStatus;
  txHash: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
}

export interface PurchaseTransaction {
  id: number;
  userId: number;
  itemType: 'land' | 'house' | 'item' | 'facility';
  itemId: number;
  iscCost: string;
  gasFee: string;
  walletId: number | null;
  status: TransactionStatus;
  txHash: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
}

export interface WalletAuthorizationRequest {
  walletType: WalletType;
  transactionType: TransactionType;
  amount: string;
  iscAmount: string;
  gasFee: string;
  chainId: number;
  contractAddress: string;
  recipientAddress: string;
  data?: Record<string, any>;
}

export interface WalletAuthorizationResponse {
  success: boolean;
  txHash?: string;
  error?: string;
  message?: string;
}

export interface GameScoreTransaction {
  id: number;
  userId: number;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'reward' | 'penalty' | 'transfer';
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
  relatedId: number | null;
  createdAt: Date;
}

export interface WalletConfig {
  id: number;
  walletType: WalletType;
  isEnabled: boolean;
  chainId: number;
  rpcUrl: string;
  contractAddress: string;
  minDepositAmount: string;
  maxDepositAmount: string;
  minWithdrawalAmount: string;
  maxWithdrawalAmount: string;
  depositFeePercent: number;
  withdrawalFeePercent: number;
}

export interface GasFeeEstimate {
  walletType: WalletType;
  transactionType: TransactionType;
  estimatedGas: string;
  gasPrice: string;
  totalGasFee: string;
  currency: 'USDT' | 'BNB' | 'ETH';
}
