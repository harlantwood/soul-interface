import { NETWORK_ICON, NETWORK_LABEL } from 'config/networks'
import NetworkModel from 'modals/NetworkModal'
import { useActiveWeb3React } from 'services/web3'
import { useNetworkModalToggle } from 'state/application/hooks'
import Image from 'next/image'
import React from 'react'

function Web3Network(): JSX.Element | null {
  const { chainId } = useActiveWeb3React()
  const toggleNetworkModal = useNetworkModalToggle()

  if (!chainId) return null

  return (
    <div
    className="flex items-center rounded border-2 border-dark-800 hover:border-dark-700 bg-dark-1000 hover:bg-dark-900 whitespace-nowrap text-md justify-center font-bold cursor-pointer select-none pointer-events-auto"
    onClick={() => toggleNetworkModal()}
    >
      <div className="grid items-center grid-flow-col items-center justify-center bg-dark-1000 h-[36px] w-[36px] text-sm rounded pointer-events-auto auto-cols-max text-secondary">
        <Image src={NETWORK_ICON[chainId]} alt="Switch Network" className="rounded-md" width="22px" height="22px" />
      </div>
      <NetworkModel />
      {/* { NETWORK_LABEL[chainId] } */}
    </div>
  )
}

export default Web3Network