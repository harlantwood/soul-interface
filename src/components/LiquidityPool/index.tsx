import { CurrencyLogo } from 'components/CurrencyLogo'
import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { bridgeNetworks } from 'utils/bridge/bridge'
import { thousandBit } from 'utils/tools'

// import TokenLogo from '../TokenLogo'

// import config from '../../config'


export const LiquidityView = styled.div`
  ${({theme}) => theme.flexSC};
  flex-wrap: wrap;
  border: solid 0.5px ${({ theme }) => theme.tipBorder};
  background-color: ${({ theme }) => theme.tipBg};
  border-radius: 0.5625rem;
  padding: 8px 16px;
  color: ${({ theme }) => theme.tipColor};
  font-size: 12px;
  white-space:nowrap;
  .item {
    ${({theme}) => theme.flexBC};
    margin-right: 10px;
    margin-left: 10px;
    color: ${({ theme }) => theme.tipColor};
    .label {
      ${({theme}) => theme.flexSC};
    }
    .cont {
      margin-left: 10px;
      font-size: 12px;
    }
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    .item {
      width: 100%;
      margin-top:5px;
    }
  `};
  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 8px 12px;
  `};
`

interface LiquidityPoolProps {
  curChain: any
  destChain: any
  isUnderlying: any
  isDestUnderlying: any
  isViewAll?: any
}

export default function LiquidityPool ({
  curChain,
  destChain,
  isUnderlying,
  isDestUnderlying,
  isViewAll
}: LiquidityPoolProps) {

  const { t } = useTranslation()

  // console.log(destChain)
  return (
    <>
      <LiquidityView>
        {t('pool') + ': '}
        {
          curChain && (isUnderlying || isViewAll) ? (
            <div className='item'>
              <span className="label">
                <CurrencyLogo 
                    currency={bridgeNetworks.getCurChainInfo(curChain.chain).networkLogo ?? bridgeNetworks.getCurChainInfo(curChain.chain)?.symbol} 
                    size={'1rem'} 
                    style={{marginRight: '5px'}}
                />
                {/* <TokenLogo symbol={bridgeNetworks.getCurChainInfo(curChain.chain).networkLogo ?? bridgeNetworks.getCurChainInfo(curChain.chain)?.symbol} size={'1rem'} style={{marginRight: '5px'}}></TokenLogo> */}
                {bridgeNetworks.getCurChainInfo(curChain.chain).name}:
              </span>
              <span className='cont'>{curChain.ts ? thousandBit(curChain.ts, 2) : '0.00'}</span>
            </div>
          ) : ''
        }
        {
          destChain && (isDestUnderlying || isViewAll) ? (
            <div className='item'>
              <span className="label">
                {/* <TokenLogo symbol={bridgeNetworks.getCurChainInfo(destChain.chain).networkLogo ?? bridgeNetworks.getCurChainInfo(destChain.chain)?.symbol} size={'1rem'} style={{marginRight: '5px'}}></TokenLogo> */}
                {/* <TokenLogo symbol={bridgeNetworks.getCurChainInfo(destChain.chain).networkLogo ?? bridgeNetworks.getCurChainInfo(destChain.chain)?.symbol} size={'1rem'} style={{marginRight: '5px'}}></TokenLogo> */}
                {bridgeNetworks.getCurChainInfo(destChain.chain).name}:
              </span>
              <span className='cont'>{destChain.ts ? thousandBit(destChain.ts, 2) : '0.00'}</span>
            </div>
          ) : ''
        }
      </LiquidityView>
    </>
  )
}