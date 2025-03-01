import { ChevronDownIcon } from '@heroicons/react/solid'
import chains from 'soulswap-chain'
import { ChainId } from 'sdk'
import { FundSource } from 'packages/hooks'
import { Type } from 'soulswap-currency'

import React, { FC, useCallback, useMemo, useState } from 'react'

import { NetworkSelectorOverlay } from './NetworkSelectorOverlay'
import { classNames } from 'functions/styling'
import { NetworkIcon } from 'components/Icons/NetworkIcon'
import { TokenSelectorProps } from './TokenSelector'
import { Web3Input } from 'components/Web3Input'

export interface CurrencyInputProps
  extends Pick<
    TokenSelectorProps,
    'onAddToken' | 'onRemoveToken' | 'onSelect' | 'tokenMap' | 'chainId' | 'customTokenMap'
  > {
  value: string
  disabled?: boolean
  onChange(value: string): void
  currency: Type | undefined
  usdPctChange?: number
  disableMaxButton?: boolean
  className?: string
  fundSource?: FundSource
  loading?: boolean
  includeNative?: boolean
}

interface CurrencyInputWithNetworkSelectorProps extends CurrencyInputProps {
  onNetworkSelect(chainId: ChainId): void
  className?: string
}

export const CurrencyInputWithNetworkSelector: FC<CurrencyInputWithNetworkSelectorProps> = ({
  onNetworkSelect,
  disabled,
  value,
  onChange,
  currency,
  onSelect,
  onAddToken,
  onRemoveToken,
  chainId,
  tokenMap,
  customTokenMap,
  disableMaxButton = false,
  usdPctChange,
  className,
  fundSource = FundSource.WALLET,
  loading,
}) => {
  const [networkSelectorOpen, setNetworkSelectorOpen] = useState(false)

  const handleClose = useCallback(() => {
    setNetworkSelectorOpen(false)
  }, [])

  return useMemo(
    () => (
      <div className={classNames('flex flex-col p-3', className)}>
        <div className="flex flex-row justify-between">
          <button
            type="button"
            className="text-slate-400 hover:text-slate-300 relative flex items-center gap-1 py-1 text-xs font-medium"
            onClick={(e) => {
              setNetworkSelectorOpen(true)
              e.stopPropagation()
            }}
          >
            <NetworkIcon chainId={chainId} width="16px" height="16px" className="mr-1" />
            {chains[chainId].name} <ChevronDownIcon width={16} height={16} />
          </button>
        </div>
        <Web3Input.Currency
          disabled={disabled}
          currency={currency}
          onSelect={onSelect}
          chainId={chainId}
          fundSource={fundSource}
          disableMaxButton={disableMaxButton}
          customTokenMap={customTokenMap}
          onAddToken={onAddToken}
          onRemoveToken={onRemoveToken}
          tokenMap={tokenMap}
          onChange={onChange}
          value={value}
          usdPctChange={usdPctChange}
          loading={loading}
        />
        <NetworkSelectorOverlay
          open={networkSelectorOpen}
          onClose={handleClose}
          onSelect={onNetworkSelect}
          selected={chainId}
        />
      </div>
    ),
    [
      chainId,
      className,
      currency,
      customTokenMap,
      disableMaxButton,
      disabled,
      fundSource,
      handleClose,
      loading,
      networkSelectorOpen,
      onAddToken,
      onChange,
      onNetworkSelect,
      onRemoveToken,
      onSelect,
      tokenMap,
      usdPctChange,
      value,
    ]
  )
}
