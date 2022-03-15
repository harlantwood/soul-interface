import { useMemo } from "react";
import ISoulSwapPairABI from "constants/abis/soulswap/ISoulSwapPair.json";
import { Interface } from "@ethersproject/abi";
import { useMultipleContractSingleData } from "state/multicall/hooks";
import { Currency, CurrencyAmount } from "sdk";
import { Handler } from "types";
// import { Pair } from "entities/pair";
import { useWeb3 } from "hooks/useWeb3";
import { isEthereumChain } from "soulswap-limit-orders-lib/dist/utils";
import { Pair } from "entities/Pair";

const PAIR_INTERFACE = new Interface(ISoulSwapPairABI);

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function usePairs(
  currencies: [Currency | undefined, Currency | undefined][],
  handler?: Handler
): [PairState, Pair | null][] {
  const { chainId } = useWeb3();

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        currencyA?.wrapped,
        currencyB?.wrapped,
      ]),
    [currencies]
  );

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA && tokenB && !tokenA.equals(tokenB)
          ? Pair.getAddress(tokenA, tokenB, handler)
          : undefined;
      }),
    [tokens, handler]
  );

  const results = useMultipleContractSingleData(
    pairAddresses,
    PAIR_INTERFACE,
    "getReserves",
    undefined,
    {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      blocksPerFetch: isEthereumChain(chainId!) ? 5 : 60,
    }
  );

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result;
      const tokenA = tokens[i][0];
      const tokenB = tokens[i][1];

      if (loading) return [PairState.LOADING, null];
      if (!tokenA || !tokenB || tokenA.equals(tokenB))
        return [PairState.INVALID, null];
      if (!reserves) return [PairState.NOT_EXISTS, null];
      const { reserve0, reserve1 } = reserves;
      const [token0, token1] = tokenA.sortsBefore(tokenB)
        ? [tokenA, tokenB]
        : [tokenB, tokenA];
      return [
        PairState.EXISTS,
        new Pair(
          CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
          CurrencyAmount.fromRawAmount(token1, reserve1.toString()),
          handler
        ),
      ];
    });
  }, [results, tokens, handler]);
}

export function usePair(
  tokenA?: Currency,
  tokenB?: Currency
): [PairState, Pair | null] {
  const inputs: [[Currency | undefined, Currency | undefined]] = useMemo(
    () => [[tokenA, tokenB]],
    [tokenA, tokenB]
  );
  return usePairs(inputs)[0];
}
