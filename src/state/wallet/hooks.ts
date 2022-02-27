import { Interface } from '@ethersproject/abi'
import { Currency, 
  CurrencyAmount, 
  JSBI, 
  NATIVE,
  totalLendingAvailable,
  Token, 
  TokenAmount} from 'sdk'
import ERC20_ABI from 'constants/abis/erc20.json'
import { isAddress } from 'functions/validate'
import { useAllTokens } from 'hooks/Tokens'
import { useMulticall2Contract } from 'hooks/useContract'
import { useActiveWeb3React } from 'services/web3'
import { useMultipleContractSingleData, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TokenInfo } from '@uniswap/token-lists'
import { TokenBalancesMap } from './types'
import { utils } from 'ethers'
import { getProviderOrSigner } from 'functions'
import { getPegCurrency } from 'constants/index'

/**
 * Returns a map of the given addresses to their eventually consistent ETH balances.
 */
export function 
useETHBalances(uncheckedAddresses?: (string | undefined)[]): {
  [address: string]: CurrencyAmount<Currency> | undefined
} {
  const { chainId } = useActiveWeb3React()
  const multicallContract = useMulticall2Contract()

  const addresses: string[] = useMemo(
    () =>
      uncheckedAddresses
        ? uncheckedAddresses
            .map(isAddress)
            .filter((a): a is string => a !== false)
            .sort()
        : [],
    [uncheckedAddresses]
  )

  const results = useSingleContractMultipleData(
    multicallContract,
    'getEthBalance',
    addresses.map((address) => [address])
  )

  return useMemo(
    () =>
      addresses.reduce<{ [address: string]: CurrencyAmount<Currency> }>((memo, address, i) => {
        const value = results?.[i]?.result?.[0]
        if (value && chainId)
          memo[address] = CurrencyAmount.fromRawAmount(NATIVE[250], JSBI.BigInt(value.toString()))
        return memo
      }, {}),
    [addresses, chainId, results]
  )
}

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[]
): { data: TokenBalancesMap; loading: boolean } {
  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false) ?? [],
    [tokens]
  )

  const validatedTokenAddresses = useMemo(() => validatedTokens.map((vt) => vt.address), [validatedTokens])
  const ERC20Interface = new Interface(ERC20_ABI)
  const balances = useMultipleContractSingleData(
    validatedTokenAddresses,
    ERC20Interface,
    'balanceOf',
    [address],
    undefined,
    100_000
  )

  const anyLoading: boolean = useMemo(() => balances.some((callState) => callState.loading), [balances])

  return useMemo(
    () => ({
      data:
        address && validatedTokens.length > 0
          ? validatedTokens.reduce<TokenBalancesMap>((memo, token, i) => {
              const value = balances?.[i]?.result?.[0]
              const amount = value ? JSBI.BigInt(value.toString()) : undefined
              if (amount) {
                memo[token.address] = CurrencyAmount.fromRawAmount(token, amount)
              }
              return memo
            }, {})
          : {},
      loading: anyLoading,
    }),
    [address, validatedTokens, anyLoading, balances]
  )
}

export const serializeBalancesMap = (mapping: Record<string, CurrencyAmount<Token>>): string => {
  return Object.entries(mapping)
    .map(([address, currencyAmount]) => currencyAmount.serialize())
    .join()
}

export function useTokenBalances(address?: string, tokens?: (Token | undefined)[]): TokenBalancesMap {
  return useTokenBalancesWithLoadingIndicator(address, tokens).data
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): CurrencyAmount<Token> | undefined {
  const tokenBalances = useTokenBalances(account, [token])
  if (!token) return undefined
  return tokenBalances[token.address]
}

export function useCurrencyBalances(
  account?: string,
  currencies?: (Currency | undefined)[]
): (CurrencyAmount<Currency> | undefined)[] {
  const tokens = useMemo(
    () => currencies?.filter((currency): currency is Token => currency?.isToken ?? false) ?? [],
    [currencies]
  )

  const tokenBalances = useTokenBalances(account, tokens)
  const containsETH: boolean = useMemo(() => currencies?.some((currency) => currency?.isNative) ?? false, [currencies])
  const ethBalance = useETHBalances(containsETH ? [account] : [])

  return useMemo(
    () =>
      currencies?.map((currency) => {
        if (!account || !currency) return undefined
        if (currency?.isToken) return tokenBalances[currency.address]
        if (currency?.isNative) return ethBalance[account]
        return undefined
      }) ?? [],
    [account, currencies, ethBalance, tokenBalances]
  )
}

export function useCurrencyBalance(account?: string, currency?: Currency): CurrencyAmount<Currency> | undefined {
  return useCurrencyBalances(account, [currency])[0]
}

// mimics useAllBalances
export function useAllTokenBalances(): TokenBalancesMap {
  const { account } = useActiveWeb3React()
  const allTokens = useAllTokens()
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens])
  return useTokenBalances(account ?? undefined, allTokensArray)
}

export function useAllTokenBalancesWithLoadingIndicator() {
  const { account } = useActiveWeb3React()
  const allTokens = useAllTokens()
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens])
  return useTokenBalancesWithLoadingIndicator(account ?? undefined, allTokensArray)
}

export function useBorrowable(currency: Currency | undefined): CurrencyAmount<Token | Currency> | undefined {
  const { library, chainId, account } = useActiveWeb3React()
  const provider: any = getProviderOrSigner(library!)
  const [balance, setBalance] = useState<CurrencyAmount<Token | Currency> | undefined>(undefined)

  // const updateBorrowableBalance = useCallback(async () => {
  //   const pegCurrency = getPegCurrency(chainId)
  //   if (chainId && currency && account && pegCurrency) {
  //     const bip = await borrowableInPeg(account, chainId, provider)

  //     if (bip) {
  //       const borrowableInPeg = new TokenAmount(pegCurrency, bip)

  //       const wrapped = wrappedCurrency(currency, chainId)

  //       if (wrapped) {
  //         const borrowableInTarget = await valueInPeg2token(borrowableInPeg, wrapped, chainId, provider)
  //         if (borrowableInTarget) {
  //           const result =
  //             currency.name == 'Ether'
  //               // ? CurrencyAmount.ether(borrowableInTarget.toString())
  //               ? CurrencyAmount.ether(borrowableInTarget.toString())
  //               : new TokenAmount(wrapped, borrowableInTarget.toString())

  //           setBalance(result)
  //         } else {
  //           setBalance(undefined)
  //         }
  //       } else {
  //         setBalance(undefined)
  //       }
  //     }
  //   }
  // }, [currency, setBalance])

  useEffect(() => {
    // updateBorrowableBalance()
  }, [currency, ]) // updateBorrowableBalance
  return balance
}

// get the total amount of liquidity / lending that is available for a given token
export function useLendingAvailable(
  chainId: number | undefined,
  token: TokenInfo | undefined,
  provider: any
): CurrencyAmount<Token> | undefined {
  const [lendingAvailable, setLendingAvailable] = useState<CurrencyAmount<Token> | undefined>()

  const getLendingAvailable = async () => {
    if (!chainId || !token) return
    const tokenToken = new Token(chainId, token.address, token.decimals)
    const result = ((await totalLendingAvailable(token.address, chainId, provider)) ?? utils.parseUnits('0')).toString()

    setLendingAvailable(new TokenAmount(tokenToken, result))
  }

  useEffect(() => {
    if (chainId && token && provider) {
      getLendingAvailable()
    }
  }, [token?.symbol])

  return lendingAvailable
}