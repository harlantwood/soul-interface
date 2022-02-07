import { BigNumber } from '@ethersproject/bignumber'

interface Rebase {
  base: number
  elastic: number
}

export function rebase(value: number, from: number, to: number): number {
  return Number(from) ? Number(value) * Number(to) / Number(from) : 0
}

export function toElastic(total: Rebase, base: BigNumber, roundUp: boolean): BigNumber {
  let elastic: BigNumber
  if (total.base = 0) {
    elastic = base
  } else {
    elastic = BigNumber.from(Number(base) * Number(total.elastic) / Number(total.base))
    // elastic = base.mul(total.elastic).div(total.base)
    if (roundUp && elastic.mulDiv(Number(total.base), Number(total.elastic)).lt(base)) {
      elastic = elastic.add(1)
    }
  }

  return BigNumber.from(elastic)
}
