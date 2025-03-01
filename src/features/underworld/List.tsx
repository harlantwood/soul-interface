import Typography from 'components/Typography'
import React, { useEffect, useState } from 'react'

import { Underworld } from './Key'
import { Row } from './Row'
import { FantomMarkets, AvalancheMarkets } from './Markets'
import { Button } from 'components/Button'
import NavLink from 'components/NavLink'
import { useActiveWeb3React } from 'services/web3'
import { ChainId } from 'sdk'
import { getChainColorCode } from 'constants/chains'
// import ExternalLink from 'components/ExternalLink'
// import { ArrowLeftIcon, ArrowRightIcon, XIcon } from '@heroicons/react/outline'
// import Header from 'components/Header'

export const List = () => {

  const { chainId } = useActiveWeb3React()
  
  const ftmList = FantomMarkets.map((market) => (
    <Row
    key={market.id}
    lpToken={market.lpAddress}
    assetAddress={market.assetAddress}
    pair={market}
    />
    ))
 
  const avaxList = AvalancheMarkets.map((market) => (
    <Row
    key={market.id}
    lpToken={market.lpAddress}
    assetAddress={market.assetAddress}
    pair={market}
    />
    ))
    
    // const borrowList = UnderworldMarkets.map((farm) => (
    //   <Row
    //     key={farm.pid}
    //     pid={farm.pid}
    //     lpToken={farm.lpAddress}
    //     // assetAddress={farm.assetAddress}
    //     farm={farm}
    //   />
    // ))

  return (
    <>
      <div className="flex ml-2 mr-2 mb-4 gap-1 items-center justify-center">
        <Button variant="bordered" color={getChainColorCode(chainId)} size="lg">
          <NavLink href={'/summoner'}>
            <a className="block text-md md:text-xl text-white text-bold p-0 -m-3 text-md transition duration-150 ease-in-out rounded-md hover:bg-dark-300">
            <span> Farm </span>
            </a>
          </NavLink>
        </Button>
        <Button variant="bordered" color={getChainColorCode(chainId)} size="lg">
          <NavLink href={'/soul/dashboard'}>
            <a className="block text-md md:text-xl text-white text-bold p-0 -m-3 text-md transition duration-150 ease-in-out rounded-md hover:bg-dark-300">
            <span> Data </span>
            </a>
          </NavLink>
        </Button>
        <Button variant="bordered" color={getChainColorCode(chainId)} size="lg">
          <NavLink href={'/bonds'}>
            <a className="block text-md md:text-xl text-white text-bold p-0 -m-3 text-md transition duration-150 ease-in-out rounded-md hover:bg-dark-300">
            <span> Bond </span>
            </a>
          </NavLink>
        </Button>
        <Button variant="bordered" color={getChainColorCode(chainId)} size="lg" className={[ChainId.AVALANCHE, ChainId.FANTOM].includes(chainId) ? '' : 'hidden'}>
          <NavLink href={'/autostake'}>
            <a className="block text-md md:text-xl text-white text-bold p-0 -m-3 text-md transition duration-150 ease-in-out rounded-md hover:bg-dark-300">
            <span> Vault </span>
            </a>
          </NavLink>
        </Button>
      </div>
     <Typography className={`text-2xl rounded bg-dark-1000 mb-3 mt-6 border border-${getChainColorCode(chainId)} p-3 font-bold text-center`}>
        Lending Markets
      </Typography>
        <Underworld />
        <>{chainId == ChainId.FANTOM ? ftmList : avaxList}</>
     {/* <Typography className="text-2xl mb-12 mt-6 border border-dark-600 hover:border-blue p-3 font-bold text-center">
       Borrow Markets
      </Typography>
        <Farms />
        <>{borrowList}</> */}
    </>
  )
}

export default List