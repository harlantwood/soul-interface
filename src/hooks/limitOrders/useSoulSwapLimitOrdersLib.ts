import { useMemo } from "react";
import { ChainId, GelatoLimitOrders as SoulSwapLimitOrders } from "soulswap-limit-orders-lib";
import { useWeb3 } from "hooks/useWeb3";

export default function useGelatoLimitOrdersLib():
  | SoulSwapLimitOrders
  | undefined {
  const { chainId, library, handler } = useWeb3();

  return useMemo(() => {
    try {
      return chainId && library
        ? new SoulSwapLimitOrders(chainId as ChainId, library?.getSigner())
        : undefined;
    } catch (error: any) {
      console.error(`Could not instantiate LimitOrders: ${error.message}`);
      return undefined;
    }
  }, [chainId, library, handler]);
}
