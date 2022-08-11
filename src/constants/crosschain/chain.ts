import { ChainKey, CoinKey } from "features/crosschain/constants";

export declare enum ChainType {
    EVM = "EVM",
    Solana = "SOLANA"
}
export interface _Chain {
    key: ChainKey;
    chainType: ChainType;
    name: string;
    coin: CoinKey;
    id: number;
    mainnet: boolean;
    logoURI?: string;
    faucetUrls?: string[];
}
