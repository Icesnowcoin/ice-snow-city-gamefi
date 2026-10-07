export type Language = "zh" | "en";

export interface ContractParamConfig {
  paramName: string;
  paramValue: string;
  description: string | null;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface ContractEventLog {
  id: number;
  eventName: string;
  txHash: string | null;
  blockNumber: number | null;
  fromAddress: string | null;
  toAddress: string | null;
  amount: string | null;
  params: string | null;
  status: "success" | "failed" | "pending";
  createdAt: Date;
}

export interface TreasuryTx {
  id: number;
  txType: "deposit" | "withdraw";
  amount: string;
  txHash: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  description: string | null;
  createdAt: Date;
}
