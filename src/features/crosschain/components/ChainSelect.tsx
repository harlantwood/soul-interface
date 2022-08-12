import React from 'react'
import { Avatar, Select } from 'antd'

import { Chain, ChainKey, getChainByKey } from '../types'
// import { useRouter } from 'next/router'

interface ChainSelectProps {
  availableChains: Array<Chain>
  selectedChain?: ChainKey
  onChangeSelectedChain: Function
  disabled?: boolean
}

const ChainSelect = ({
  availableChains,
  selectedChain,
  onChangeSelectedChain,
  disabled = false,
}: ChainSelectProps) => {
  const chain = selectedChain ? getChainByKey(selectedChain) : undefined
  
  // const router = useRouter()
  // const positionFixed = router.pathname.includes('showcase')
  
  return (
    <>
      {chain ? (
        <Avatar size="small" src={chain.logoURI} alt={chain.name}>
          {chain.name[0]}
        </Avatar>
      ) : (
        ''
      )}

      <Select
        style={{ width: 200, position: 'relative' }}
        disabled={disabled}
        placeholder="Select Chain"
        value={selectedChain}
        onChange={(v: ChainKey) => onChangeSelectedChain(v)}
        dropdownStyle={{ 
            minWidth: 300, 
            position: 
              // positionFixed ? 'fixed' 
              // : 
              'relative' }}
        bordered={false}
        optionLabelProp="data-label">
        <Select.OptGroup label="Supported Chains">
          {availableChains.map((chain) => (
            <Select.Option key={chain.key} value={chain.key} data-label={chain.name}>
              <div className="option-item">
                <span role="img" aria-label={chain.name}>
                  <Avatar
                    size="small"
                    src={chain.logoURI}
                    alt={chain.key}
                    style={{ marginRight: 10 }}>
                    {chain.name[0]}
                  </Avatar>
                </span>
                <span className="overflow-hidden text-overflow p-[5px]">{chain.name}</span>
              </div>
            </Select.Option>
          ))}
        </Select.OptGroup>
      </Select>
    </>
  )
}

export default ChainSelect