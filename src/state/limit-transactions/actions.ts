import { Order } from "soulswap-limit-orders-lib";
import { createAction } from "@reduxjs/toolkit";

export interface SerializableTransactionReceipt {
  to: string;
  from: string;
  contractAddress: string;
  transactionIndex: number;
  blockHash: string;
  transactionHash: string;
  blockNumber: number;
  status?: number;
}

export type TransactionType = "submission" | "cancellation" | "approval";

export const addTransaction = createAction<{
  chainId: number;
  hash: string;
  from: string;
  type: TransactionType;
  order?: Order;
  approval?: { tokenAddress: string; spender: string };
  summary?: string;
}>("transactions/addTransaction");
export const clearAllTransactions = createAction<{ chainId: number }>(
  "transactions/clearAllTransactions"
);
export const finalizeTransaction = createAction<{
  chainId: number;
  hash: string;
  receipt: SerializableTransactionReceipt;
}>("transactions/finalizeTransaction");
export const checkedTransaction = createAction<{
  chainId: number;
  hash: string;
  blockNumber: number;
}>("transactions/checkedTransaction");
