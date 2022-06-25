import { useFuse, useSortableData, useSoulSummonerContract, useSummonerInfo } from 'hooks'
import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import styled from 'styled-components'
// import useFarms from 'hooks/useFarm'
// import useFarms from 'hooks/useZapperFarms'

import { RowBetween } from '../../../components/Row'
// import { formattedNum, formattedPercent } from '../../../utils'
import { Card, CardHeader, DoubleLogo, Paper, Search } from '../components'
import InputGroup from './InputGroup'
import { Helmet } from 'react-helmet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { formatNumber, formatPercent } from 'functions'
import { usePositions, useSoulFarms } from 'features/mines/hooks'
import { POOLS } from 'constants/farms'
import { useActiveWeb3React } from 'services/web3'
import { useSoulPrice } from 'hooks/getPrices'

export const FixedHeightRow = styled(RowBetween)`
    height: 24px;
`

export function useFarms() {
    return useSoulFarms(useSoulSummonerContract())
  }



export default function Yield(): JSX.Element {
    const { i18n } = useLingui()
    // const query = useFarms()
    
    const farms = useFarms()
    // const farms = query?.farms
    const positions = usePositions()
    // const position = positions.find((position) => position.id === pool.id)

    // const userFarms = query?.userFarms
    const { chainId } = useActiveWeb3React()
    const summonerInfo = useSummonerInfo()
    const soulPrice = useSoulPrice()
    
    const map = (pool) => {
  
    pool.owner = 'SoulSwap'
    pool.balance = 0
  
    const pair = POOLS[chainId || 250][pool.lpToken]
  
  //   const secondsPerHour = 60 * 60
  
    function getRewards() {
      const rewardPerSecond =
        ((pool.allocPoint / Number(summonerInfo.totalAllocPoint)) * Number(summonerInfo.soulPerSecond)) / 1e18
  
      const defaultReward = {
        token: 'SOUL',
        icon: '/images/token/soul.png',
        rewardPerSecond,
        rewardPerDay: rewardPerSecond * 86400,
        rewardPrice: soulPrice,
      }
  
      const defaultRewards = [defaultReward]
  
      return defaultRewards
    }
  
    const rewards = getRewards()
  
    // function getTvl(pool) {
    //   // const pair = POOLS[chainId][pool.id]
    //   let lpPrice = 0
    //   let decimals = 18
    //   if (pool.lpToken == SOUL_ADDRESS[chainId]) {
    //     lpPrice = soulPrice
    //     decimals = pair.token0?.decimals
    //   } else if (pool.lpToken.toLowerCase() 
    //     == WNATIVE[chainId].address.toLowerCase()) {
    //     lpPrice = ftmPrice
    //   } else {
    //     lpPrice = 0
    //   }
      
    //   return Number(pool.totalLp / 10 ** decimals) * lpPrice
    // }
  
    // const tvl = getTvl(pool)
    const tvl = pool.pair?.token1
    ? Number(pool?.pairPrice) * Number(pool.lpBalance) / 1e18
    : Number(soulPrice) * Number(pool.lpBalance) / 1e18
  
    // const rewardPerSec =
    //   ((pool.allocPoint / Number(summonerInfo.totalAllocPoint)) * Number(summonerInfo.soulPerSecond)) / 1e18
  
    // const rewardPrice = soulPrice
  
    // const roiPerSecond =
    //   farms.reduce((previousValue, currentValue) => {
    //     return previousValue + rewardPerSec * rewardPrice
    //   }, 0) / Number(tvl)
  
    // const roiPerSecond = Number(tvl)
    // const roiPerHour = roiPerSecond * 60 * 60
    // const roiPerDay = roiPerHour * 24
    // const roiPerMonth = roiPerDay * 30
    // const roiPerYear = roiPerDay * 365
  
    const position = positions.find((position) => position.id === pool.id)
  
    return {
      ...pool,
      ...position,
      pair: {
        ...pair,
        decimals: 18,
      },
      // roiPerSecond,
      // roiPerHour,
      // roiPerDay,
      // roiPerMonth,
      // roiPerYear,
      rewards,
      tvl,
      // secondsPerHour,
    }
  }
    // Search Setup
    const options = { keys: ['symbol', 'name', 'pairAddress'], threshold: 0.4 }
    const { result, search, term } = useFuse({
        data: farms && farms.length > 0 ? farms : [],
        options
    })
    const flattenSearchResults = result.map((a: { item: any }) => (a.item ? a.item : a))
    // Sorting Setup
    const { items, requestSort, sortConfig } = useSortableData(flattenSearchResults)

    return (
        <>
            <Helmet>
                <title>{i18n._(t`Yield`)} | Soul</title>
                <meta name="description" content="Farm SOUL by staking LP (Liquidity Provider) tokens" />
            </Helmet>
            <div className="container max-w-2xl mx-auto">
                <Card
                    className="h-full bg-dark-900"
                    header={
                        <CardHeader className="flex justify-between items-center bg-dark-800">
                            <div className="flex w-full justify-between">
                                <div className="hidden md:flex items-center">
                                    {/* <BackButton defaultRoute="/pool" /> */}
                                    <div className="text-lg mr-2 whitespace-nowrap">{i18n._(t`Yield Instruments`)}</div>
                                </div>
                                <Search search={search} term={term} />
                            </div>
                        </CardHeader>
                    }
                >
                    {/* UserFarms */}
                    {positions && positions.length > 0 && (
                        <>
                            <div className="pb-4">
                                <div className="grid grid-cols-3 pb-4 px-4 text-sm  text-secondary">
                                    <div className="flex items-center">
                                        <div>{i18n._(t`Your Yields`)}</div>
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <div>{i18n._(t`Deposited`)}</div>
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <div>{i18n._(t`Claim`)}</div>
                                    </div>
                                </div>
                                <div className="flex-col space-y-2">
                                    {positions.map((farm: any, i: number) => {
                                        return <UserBalance key={farm.address + '_' + i} farm={farm} />
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                    {/* All Farms */}
                    <div className="grid grid-cols-3 pb-4 px-4 text-sm  text-secondary">
                        <div
                            className="flex items-center cursor-pointer hover:text-secondary"
                            onClick={() => requestSort('symbol')}
                        >
                            <div>{i18n._(t`Instruments`)}</div>
                            {sortConfig &&
                                sortConfig.key === 'symbol' &&
                                ((sortConfig.direction === 'ascending' && <ChevronUp size={12} />) ||
                                    (sortConfig.direction === 'descending' && <ChevronDown size={12} />))}
                        </div>
                        <div className="hover:text-secondary cursor-pointer" onClick={() => requestSort('tvl')}>
                            <div className="flex items-center justify-end">
                                <div>{i18n._(t`TVL`)}</div>
                                {sortConfig &&
                                    sortConfig.key === 'tvl' &&
                                    ((sortConfig.direction === 'ascending' && <ChevronUp size={12} />) ||
                                        (sortConfig.direction === 'descending' && <ChevronDown size={12} />))}
                            </div>
                        </div>
                        <div className="hover:text-secondary cursor-pointer" onClick={() => requestSort('roiPerYear')}>
                            <div className="flex items-center justify-end">
                                <div>{i18n._(t`APR`)}</div>
                                {sortConfig &&
                                    sortConfig.key === 'roiPerYear' &&
                                    ((sortConfig.direction === 'ascending' && <ChevronUp size={12} />) ||
                                        (sortConfig.direction === 'descending' && <ChevronDown size={12} />))}
                            </div>
                        </div>
                    </div>
                    <div className="flex-col space-y-2">
                        {items && items.length > 0 ? (
                            items.map((farm: any, i: number) => {
                                return <TokenBalance key={farm.address + '_' + i} farm={farm} />
                            })
                        ) : (
                            <>
                                {term ? (
                                    <div className="w-full text-center py-6">{i18n._(t`No Results`)}</div>
                                ) : (
                                    <div className="w-full text-center py-6">
                                        {i18n._(t`Fetching Instruments`)}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Card>
            </div>
        </>
    )
}

const TokenBalance = ({ farm }: any) => {
    const [expand, setExpand] = useState<boolean>(false)
    return (
        <>
            {farm.type === 'HLP' && (
                <Paper className="bg-dark-800">
                    <div
                        className="grid grid-cols-3 py-4 px-4 cursor-pointer select-none rounded text-sm"
                        onClick={() => setExpand(!expand)}
                    >
                        <div className="flex items-center">
                            <div className="mr-4">
                                <DoubleLogo
                                    a0={farm.liquidityPair.token0.id}
                                    a1={farm.liquidityPair.token1.id}
                                    size={32}
                                    margin={true}
                                />
                            </div>
                            <div className="hidden sm:block">
                                {farm && farm.isPair? farm.liquidityPair.token0.symbol + '-' + farm.liquidityPair.token1.symbol : farm.liquidityPair.token0.symbol}
                            </div>
                        </div>
                        <div className="flex justify-end items-center">
                            <div>
                                <div className="text-right">{formatNumber(farm.tvl, true)} </div>
                                <div className="text-secondary text-right">
                                    {formatNumber(farm.hlpBalance / 1e18, false)} {farm.isPair? "HLP" : farm.symbol}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end items-center">
                            <div className="text-right font-semibold text-xl">
                                {formatPercent(farm.roiPerYear * 100)}{' '}
                            </div>
                        </div>
                    </div>
                    {expand && (
                        <InputGroup
                            pid={farm.pid}
                            pairAddress={farm.pairAddress}
                            pairSymbol={farm.symbol}
                            token0Address={farm.liquidityPair.token0.id}
                            token1Address={farm.liquidityPair.token1.id}
                            type={farm.isPair? 'LP' : farm.symbol}
                        />
                    )}
                </Paper>
            )}
            {}
        </>
    )
}

const UserBalance = ({ farm }: any) => {
    const [expand, setExpand] = useState<boolean>(false)
    return (
        <>
            {farm.type === 'HLP' && (
                <Paper className="bg-dark-800">
                    <div
                        className="grid grid-cols-3 py-4 px-4 cursor-pointer select-none rounded text-sm"
                        onClick={() => setExpand(!expand)}
                    >
                        <div className="flex items-center">
                            <div className="mr-4">
                                <DoubleLogo
                                    a0={farm.liquidityPair.token0.id}
                                    a1={farm.liquidityPair.token1.id}
                                    size={26}
                                    margin={true}
                                />
                            </div>
                            <div className="hidden sm:block">
                                {farm && farm.isPair? farm.liquidityPair.token0.symbol + '-' + farm.liquidityPair.token1.symbol : farm.liquidityPair.token0.symbol}
                            </div>
                        </div>
                        <div className="flex justify-end items-center">
                            <div>
                                <div className="text-right">{formatNumber(farm.depositedUSD, true)} </div>
                                <div className="text-secondary text-right">
                                    {formatNumber(farm.depositedLP, false)} {farm.isPair? "HLP" : farm.symbol}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end items-center">
                            <div>
                                <div className="text-right">{formatNumber(farm.pendingSoul)} </div>
                                <div className="text-secondary text-right">SOUL</div>
                            </div>
                        </div>
                    </div>
                    {expand && (
                        <InputGroup
                            pid={farm.pid}
                            pairAddress={farm.pairAddress}
                            pairSymbol={farm.symbol}
                            token0Address={farm.liquidityPair.token0.id}
                            token1Address={farm.liquidityPair.token1.id}
                            type={farm.isPair? 'LP' : farm.symbol}
                        />
                    )}
                </Paper>
            )}
        </>
    )
}