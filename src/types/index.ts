import { Currency, PoolState, TradeType, TridentTrade, Trade as LegacyTrade  } from 'sdk'

export * from './AddressMap'

export enum Field {
  INPUT = "INPUT",
  OUTPUT = "OUTPUT",
  PRICE = "PRICE",
}

export type TradeUnion =
  | TridentTrade<Currency, Currency, TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT>
  | LegacyTrade<Currency, Currency, TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT>

export type PoolWithStateExists<T> = {
  state: PoolState.EXISTS
  pool: T
}

export type PoolWithStateLoading = {
  state: PoolState.LOADING
  pool?: undefined
}

export type PoolWithStateNotExists = {
  state: PoolState.NOT_EXISTS
  pool?: undefined
}

export type PoolWithStateInvalid = {
  state: PoolState.INVALID
  pool?: undefined
}

export type PoolWithState<T> =
  | PoolWithStateExists<T>
  | PoolWithStateLoading
  | PoolWithStateNotExists
  | PoolWithStateInvalid

export declare type Handler = "soulswap" | "soulswap_stoplimit" | "uniswap" | "uniswap_stoplimit" | "quickswap" | "quickswap_stoplimit" | "spiritswap" | "spiritswap_stoplimit" | "spookyswap" | "spookyswap_stoplimit" | "bombswap" | "polydex" | "cafeswap" | "pancakeswap" | "pancakeswap_stoplimit" | "traderjoe" | "traderjoe_stoplimit" | "defyswap" | "pangolin" | "pangolin_stoplimit";
