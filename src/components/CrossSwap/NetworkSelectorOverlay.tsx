import { CheckIcon } from '@heroicons/react/outline'
import chains from 'soulswap-chain'
import  { ChainId } from 'sdk'
import { useIsSmScreen } from 'packages/hooks'
import React, { FC, useCallback, useRef } from 'react'
import { SlideIn } from 'components/Animated/SlideIn'
import { NetworkIcon } from 'components/Icons/NetworkIcon'
import Typography from 'components/Typography'
import { classNames } from 'functions/styling'
import { Overlay } from 'components/Overlay'

interface NetworkSelectorOverlay {
  open: boolean
  onClose(): void
  onSelect(network: ChainId): void
  selected: ChainId
  className?: string
  networks?: ChainId[]
}

export const NetworkSelectorOverlay: FC<NetworkSelectorOverlay> = ({
  networks = [1, 250, 43114],
  open,
  onClose,
  onSelect,
  selected,
}) => {
  const isSmallScreen = useIsSmScreen()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelect = useCallback(
    (chainId: ChainId) => {
      onSelect(chainId)
      onClose()
    },
    [onClose, onSelect]
  )

  return (
    <SlideIn>
      <SlideIn.FromLeft show={open} onClose={onClose} afterEnter={() => !isSmallScreen && inputRef.current?.focus()}>
        <Overlay.Content className="bg-slate-800 !pb-0 !px-0">
          <Overlay.Header onClose={onClose} title="Select Network" />
          {networks.map((chainId) => (
            <Typography
              as="button"
              onClick={() => handleSelect(chainId)}
              key={chainId}
              variant="sm"
              className={classNames(
                selected === chainId
                  ? 'text-slate-200 !font-medium hover:text-white'
                  : 'text-slate-400 hover:text-white',
                'flex w-full items-center gap-1.5 cursor-pointer pr-3 pl-1.5 group hover:bg-blue py-1'
              )}
            >
              {selected === chainId ? (
                <div className="flex items-center justify-center w-8 h-8">
                  <CheckIcon width={24} height={24} className="group-hover:text-white text-blue" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-8 h-8">
                  <NetworkIcon type="naked" chainId={chainId} width={24} height={24} />
                </div>
              )}
              {chains[chainId].name}
            </Typography>
          ))}
        </Overlay.Content>
      </SlideIn.FromLeft>
    </SlideIn>
  )
}
