/**
 * Payment System Types
 * ISC 链上购买和提现激活功能
 */

export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';
export type TransactionType = 'purchase' | 'withdrawal' | 'refund' | 'fee';
export type WithdrawalStatus = 'pending' | 'activated' | 'completed' | 'failed';

export interface PaymentOrder {
  id: string;
  userId: number;
  orderNo: string;
  type: TransactionType;
  amount: number; // ISC 数量
  usdtValue: number; // USDT 价值
  status: PaymentStatus;
  txHash?: string;
  fromAddress?: string;
  toAddress?: string;
  gasUsed?: number;
  gasFee?: number;
  createdAt: Date;
  confirmedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface WithdrawalRequest {
  id: string;
  userId: number;
  requestNo: string;
  amount: number; // ISC 数量
  usdtValue: number; // USDT 价值
  chainAddress: string;
  status: WithdrawalStatus;
  requiresActivation: boolean;
  activationOrderId?: string;
  txHash?: string;
  createdAt: Date;
  activatedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface WithdrawalActivation {
  id: string;
  userId: number;
  activationNo: string;
  requiredAmount: number; // 5 USDT
  requiredISC: number; // 50 ISC (基于 1 ISC = 0.1 USDT)
  status: PaymentStatus;
  txHash?: string;
  createdAt: Date;
  confirmedAt?: Date;
  expiresAt: Date;
  failureReason?: string;
}

export interface PaymentConfig {
  id: number;
  iscPrice: number; // ISC 对 USDT 的价格
  withdrawalActivationAmount: number; // 5 USDT
  minPurchaseAmount: number; // 最小购买金额 (ISC)
  maxPurchaseAmount: number; // 最大购买金额 (ISC)
  minWithdrawalAmount: number; // 最小提现金额 (ISC)
  maxWithdrawalAmount: number; // 最大提现金额 (ISC)
  gasMultiplier: number; // Gas 费用倍数
  confirmationBlocks: number; // 确认块数
  maxWithdrawalAddresses: number; // 最多绑定地址数 (3)
  updatedAt: Date;
}

export interface PlayerPaymentStats {
  userId: number;
  totalPurchased: number; // 总购买 ISC
  totalWithdrawn: number; // 总提现 ISC
  totalSpent: number; // 总消费 ISC
  totalGasPaid: number; // 总支付 Gas
  withdrawalActivated: boolean;
  activationDate?: Date;
  boundAddresses: string[];
  lastPurchaseDate?: Date;
  lastWithdrawalDate?: Date;
}

export interface TransactionRecord {
  id: string;
  userId: number;
  type: TransactionType;
  amount: number;
  balance: number;
  relatedOrderId?: string;
  description: string;
  createdAt: Date;
}

export interface PriceHistory {
  id: number;
  iscPrice: number; // ISC 对 USDT 的价格
  timestamp: Date;
}

export interface PaymentWebhookPayload {
  event: 'payment_confirmed' | 'payment_failed' | 'withdrawal_confirmed' | 'withdrawal_failed';
  orderId: string;
  userId: number;
  txHash: string;
  amount: number;
  status: string;
  timestamp: number;
  signature: string;
}

export interface RiskAssessment {
  userId: number;
  riskScore: number; // 0-100
  reasons: string[];
  requiresVerification: boolean;
  blockedUntil?: Date;
}

export interface KYCVerification {
  id: string;
  userId: number;
  realName: string;
  idType: 'passport' | 'id_card' | 'driver_license';
  idNumber: string;
  idImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  verifiedAt?: Date;
  expiresAt: Date;
  rejectionReason?: string;
}
