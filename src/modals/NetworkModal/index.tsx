import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { ChainId } from 'sdk'
import HeadlessUiModal from 'components/Modal/HeadlessUIModal'
import Typography from 'components/Typography'
import { NETWORK_ICON, NETWORK_LABEL } from 'config/networks'
import { classNames } from 'functions'
import { useActiveWeb3React } from 'services/web3'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import cookie from 'cookie-cutter'
import Image from 'next/image'
import React, { FC } from 'react'

export const SUPPORTED_NETWORKS: {
  [chainId in ChainId]?: {
    chainId: string
    chainName: string
    nativeCurrency: {
      name: string
      symbol: string
      decimals: number
    }
    rpcUrls: string[]
    blockExplorerUrls: string[]
  }
} = {
  [ChainId.ETHEREUM]: {
    chainId: '0x1',
    chainName: 'Ethereum',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.infura.io/v3'],
    blockExplorerUrls: ['https://etherscan.com'],
  },
  [ChainId.TELOS]: {
    chainId: '0x28',
    chainName: 'Telos',
    nativeCurrency: {
      name: 'Telos',
      symbol: 'TLOS',
      decimals: 18,
    },
    rpcUrls: ['https://rpc1.us.telos.net/evm'],
    blockExplorerUrls: ['https://rpc1.us.telos.net/v2/explore'],
  },
  [ChainId.FANTOM]: {
    chainId: '0xfa',
    chainName: 'Fantom',
    nativeCurrency: {
      name: 'Fantom',
      symbol: 'FTM',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.ankr.com/fantom', 'https://rpcapi.fantom.network', 'https://rpc.ftm.tools'],
    blockExplorerUrls: ['https://ftmscan.com'],
  },
  [ChainId.BSC]: {
    chainId: '0x38',
    chainName: 'Binance Smart Chain',
    nativeCurrency: {
      name: 'Binance',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
  },
  [ChainId.MATIC]: {
    chainId: '0x89',
    chainName: 'Matic',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://polygon-rpc.com'], // ['https://matic-mainnet.chainstacklabs.com/'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  // [ChainId.HECO]: {
  //   chainId: '0x80',
  //   chainName: 'Heco',
  //   nativeCurrency: {
  //     name: 'Heco Token',
  //     symbol: 'HT',
  //     decimals: 18,
  //   },
  //   rpcUrls: ['https://http-mainnet.hecochain.com'],
  //   blockExplorerUrls: ['https://hecoinfo.com'],
  // },
  // [ChainId.XDAI]: {
  //   chainId: '0x64',
  //   chainName: 'xDai',
  //   nativeCurrency: {
  //     name: 'xDai Token',
  //     symbol: 'xDai',
  //     decimals: 18,
  //   },
  //   rpcUrls: ['https://rpc.xdaichain.com'],
  //   blockExplorerUrls: ['https://blockscout.com/poa/xdai'],
  // },
  // [ChainId.HARMONY]: {
  //   chainId: '0x63564C40',
  //   chainName: 'Harmony',
  //   nativeCurrency: {
  //     name: 'One Token',
  //     symbol: 'ONE',
  //     decimals: 18,
  //   },
  //   rpcUrls: [
  //     'https://api.harmony.one',
  //     'https://s1.api.harmony.one',
  //     'https://s2.api.harmony.one',
  //     'https://s3.api.harmony.one',
  //   ],
  //   blockExplorerUrls: ['https://explorer.harmony.one/'],
  // },
  [ChainId.AVALANCHE]: {
    chainId: '0xA86A',
    chainName: 'Avalanche Mainnet C-Chain',
    nativeCurrency: {
      name: 'Avalanche Token',
      symbol: 'AVAX',
      decimals: 18,
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io'],
  },
  // [ChainId.OKEX]: {
  //   chainId: '0x42',
  //   chainName: 'OKEx',
  //   nativeCurrency: {
  //     name: 'OKEx Token',
  //     symbol: 'OKT',
  //     decimals: 18,
  //   },
  //   rpcUrls: ['https://exchainrpc.okex.org'],
  //   blockExplorerUrls: ['https://www.oklink.com/okexchain'],
  // },
  // [ChainId.ARBITRUM]: {
  //   chainId: '0xA4B1',
  //   chainName: 'Arbitrum',
  //   nativeCurrency: {
  //     name: 'Ethereum',
  //     symbol: 'ETH',
  //     decimals: 18,
  //   },
  //   rpcUrls: ['https://arb1.arbitrum.io/rpc'],
  //   blockExplorerUrls: ['https://arbiscan.io'],
  // },
  // [ChainId.CELO]: {
  //   chainId: '0xA4EC',
  //   chainName: 'Celo',
  //   nativeCurrency: {
  //     name: 'Celo',
  //     symbol: 'CELO',
  //     decimals: 18,
  //   },
  //   rpcUrls: ['https://forno.celo.org'],
  //   blockExplorerUrls: ['https://explorer.celo.org'],
  // },
  [ChainId.MOONRIVER]: {
    chainId: '0x505',
    chainName: 'Moonriver',
    nativeCurrency: {
      name: 'Moonriver',
      symbol: 'MOVR',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.moonriver.moonbeam.network'],
    blockExplorerUrls: ['https://moonriver.moonscan.io'],
  },
  // [ChainId.FUSE]: {
  //   chainId: '0x7A',
  //   chainName: 'Fuse',
  //   nativeCurrency: {
  //     name: 'Fuse',
  //     symbol: 'FUSE',
  //     decimals: 18,
  //   },
  //   rpcUrls: ['https://rpc.fuse.io'],
  //   blockExplorerUrls: ['https://explorer.fuse.io'],
  // },
  // [ChainId.PALM]: {
  //   chainId: '0x2A15C308D',
  //   chainName: 'Palm',
  //   nativeCurrency: {
  //     name: 'Palm',
  //     symbol: 'PALM',
  //     decimals: 18,
  //   },
  //   rpcUrls: ['https://palm-mainnet.infura.io/v3/da5fbfafcca14b109e2665290681e267'],
  //   blockExplorerUrls: ['https://explorer.palm.io'],
  // },
}

const NetworkModal: FC = () => {
  const { i18n } = useLingui()
  const { chainId, library, account } = useActiveWeb3React()
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModal = useNetworkModalToggle()

  if (!chainId) return null

  return (
    <HeadlessUiModal.Controlled 
    isOpen={networkModalOpen}
    chainId={chainId}
    onDismiss={toggleNetworkModal}>
      <div className="flex flex-col gap-4">
        {/* <HeadlessUiModal.Header header={i18n._(t`Select Network`)} onClose={toggleNetworkModal} /> */}
        <div className="grid grid-flow-row-dense grid-cols-1 p-8 gap-3 overflow-y-auto w-full">
          {[
            ChainId.ETHEREUM,
            ChainId.FANTOM,
            // ChainId.TELOS,
            ChainId.BSC,
            ChainId.AVALANCHE,
            ChainId.MATIC,
            // ChainId.ARBITRUM,
            ChainId.MOONRIVER,
          ].map((key: ChainId, i: number) => {
            if (chainId === key) {
              return (
                <div
                  key={i}
                  className
                    = {
                      classNames(
                        "bg-[rgba(0,0,0,0.2)] focus:outline-none flex items-center gap-4 w-full px-4 py-3 rounded border cursor-default", 
                        chainId == ChainId.FANTOM
                        ? 'border-ftmBlue'
                        : chainId == ChainId.ETHEREUM
                          ? 'border-blue'
                          : chainId == ChainId.BSC
                            ? 'border-binanceGold'
                              : chainId == ChainId.AVALANCHE
                              ? 'border-avaxRed'
                              : chainId == ChainId.MATIC ? 'border-maticPurple'
                                // : chainId == ChainId.ARBITRUM
                                // ? 'border-arbitrumBlue'
                                  : chainId == ChainId.MOONRIVER
                                  ? 'border-moonriverTeal'
                                    : 'border-purple'
                      )}
                >
                  <Image
                    src={NETWORK_ICON[key]}
                    alt="Switch Network"
                    className="rounded-2xl"
                    width="32px"
                    height="32px"
                  />
                  <Typography weight={700} className="text-high-emphesis">
                    {NETWORK_LABEL[key]}
                  </Typography>
                </div>
              )
            }
            return (
              <button
                key={i}
                onClick={async () => {
                  console.debug(`Switching to chain ${key}`, SUPPORTED_NETWORKS[key])
                  toggleNetworkModal()
                  const params = SUPPORTED_NETWORKS[key]
                  cookie.set('chainId', key, params)

                  try {
                    await library?.send('wallet_switchEthereumChain', [{ chainId: `0x${key.toString(16)}` }, account])
                  } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask.
                    // @ts-ignore TYPE NEEDS FIXING
                    if (switchError.code === 4902) {
                      try {
                        await library?.send('wallet_addEthereumChain', [params, account])
                      } catch (addError) {
                        // handle "add" error
                        console.error(`Add chain error ${addError}`)
                      }
                    }
                    console.error(`Switch chain error ${switchError}`)
                    // handle other "switch" errors
                  }
                }}
                className={classNames(
                  'bg-[rgba(0,0,0,0.2)] focus:outline-none flex items-center gap-4 w-full px-4 py-3 rounded border border-dark-700',
                  key == ChainId.FANTOM
                  ? 'hover:border-ftmBlue'
                  : key == ChainId.ETHEREUM
                    ? 'hover:border-blue'
                    : key == ChainId.BSC
                      ? 'hover:border-yellow'
                        : key == ChainId.AVALANCHE
                        ? 'hover:border-red'
                          // : key == ChainId.ARBITRUM
                          // ? 'hover:border-arbitrumBlue'
                            : key == ChainId.MOONRIVER
                            ? 'hover:border-moonriverTeal'
                              : 'hover:border-purple'
                )}
              >
                <Image src={NETWORK_ICON[key]} alt="Switch Network" className="rounded-md" width="32px" height="32px" />
                <Typography weight={700} className="text-high-emphesis">
                  {NETWORK_LABEL[key]}
                </Typography>
              </button>
            )
          })}
        </div>
      </div>
    </HeadlessUiModal.Controlled>
  )
}

export default NetworkModal