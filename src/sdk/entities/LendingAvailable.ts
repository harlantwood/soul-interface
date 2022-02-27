import { BaseProvider, TransactionReceipt } from "@ethersproject/providers";
import { ChainId } from "sdk";

export declare function totalLendingAvailable(tokenAddress: string, chainId?: ChainId, provider?: BaseProvider): Promise<TransactionReceipt>;
