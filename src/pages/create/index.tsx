import { defaultAbiCoder } from '@ethersproject/abi'
import { AddressZero } from '@ethersproject/constants'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { CHAINLINK_ORACLE_ADDRESS, Currency, UNDERWORLD_ADDRESS } from 'sdk'
import { Button } from 'components/Button'
import Card from 'components/Card'
import Container from 'components/Container'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { CHAINLINK_PRICE_FEED_MAP } from 'config/oracles/chainlink'
import { Feature } from 'enums'
import { e10 } from 'functions/math'
import NetworkGuard from 'guards/Network'
import { useCoffinBoxContract } from 'hooks/useContract'
import Layout from 'layouts/Underworld'
import { useActiveWeb3React } from 'services/web3'
import { Field } from 'state/create/actions'
import { useCreateActionHandlers, useDerivedCreateInfo } from 'state/create/hook'
import { useTransactionAdder } from 'state/transactions/hooks'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

export type ChainlinkToken = {
  symbol: string
  name: string
  address: string
  decimals: number
}

export default function Create() {
  const { chainId } = useActiveWeb3React()

  const coffinBoxContract = useCoffinBoxContract()

  const addTransaction = useTransactionAdder()

  const router = useRouter()

  // const { independentField, typedValue } = useCreateState()
  const { onSwitchTokens, onCurrencySelection, onUserInput } = useCreateActionHandlers()

  const { currencies, inputError } = useDerivedCreateInfo()

  const handleCollateralSelect = useCallback(
    (collateralCurrency) => {
      onCurrencySelection(Field.COLLATERAL, collateralCurrency)
    },
    [onCurrencySelection]
  )

  const handleAssetSelect = useCallback(
    (assetCurrency) => {
      onCurrencySelection(Field.ASSET, assetCurrency)
    },
    [onCurrencySelection]
  )

  const both = Boolean(currencies[Field.COLLATERAL] && currencies[Field.ASSET])

  const getOracleData = useCallback(
    async (asset: Currency, collateral: Currency) => {
      const oracleData = ''

      const mapping = CHAINLINK_PRICE_FEED_MAP[chainId]

      for (const address in mapping) {
        mapping[address].address = address
      }

      let multiply = AddressZero
      let divide = AddressZero

      const multiplyMatches = Object.values(mapping).filter(
        (m) => m.from === asset.wrapped.address && m.to === collateral.wrapped.address
      )

      let decimals = 0

      if (multiplyMatches.length) {
        const match = multiplyMatches[0]
        multiply = match.address!
        decimals = 18 + match.decimals - match.toDecimals + match.fromDecimals
      } else {
        const divideMatches = Object.values(mapping).filter(
          (m) => m.from === collateral.wrapped.address && m.to === asset.wrapped.address
        )
        if (divideMatches.length) {
          const match = divideMatches[0]
          divide = match.address!
          decimals = 36 - match.decimals - match.toDecimals + match.fromDecimals
        } else {
          const mapFrom = Object.values(mapping).filter((m) => m.from === asset.wrapped.address)
          const mapTo = Object.values(mapping).filter((m) => m.from === collateral.wrapped.address)
          const match = mapFrom
            .map((mfrom) => ({
              mfrom: mfrom,
              mto: mapTo.filter((mto) => mfrom.to === mto.to),
            }))
            .filter((path) => path.mto.length)
          if (match.length) {
            multiply = match[0].mfrom.address!
            divide = match[0].mto[0].address!
            decimals = 18 + match[0].mfrom.decimals - match[0].mto[0].decimals - collateral.decimals + asset.decimals
          } else {
            return ''
          }
        }
      }

      return defaultAbiCoder.encode(['address', 'address', 'uint256'], [multiply, divide, e10(decimals)])
    },
    [chainId]
  )

  const handleCreate = async () => {
    try {
      if (!both) return

      const oracleData = await getOracleData(currencies[Field.ASSET], currencies[Field.COLLATERAL])

      if (!oracleData) {
        console.log('No path')
        return
      }

      // if (!(chainId in CHAINLINK_ORACLE_ADDRESS)) {
      //   console.log('No chainlink oracle address')
      //   return
      // }

      // if (!(chainId in UNDERWORLD_ADDRESS)) {
      //   console.log('No underworld address')
      //   return
      // }

      const oracleAddress = CHAINLINK_ORACLE_ADDRESS[chainId]

      const underworldData = defaultAbiCoder.encode(
        ['address', 'address', 'address', 'bytes'],
        [
          currencies[Field.COLLATERAL].wrapped.address,
          currencies[Field.ASSET].wrapped.address,
          oracleAddress,
          oracleData,
        ]
      )

      console.log([
        currencies[Field.COLLATERAL].wrapped.address,
        currencies[Field.ASSET].wrapped.address,
        oracleAddress,
        oracleData,
      ])

      const tx = await coffinBoxContract?.deploy(chainId && UNDERWORLD_ADDRESS[chainId], underworldData, true)

      addTransaction(tx, {
        summary: `Add Underworld Market ${currencies[Field.ASSET].symbol}/${currencies[Field.COLLATERAL].symbol} Chainlink`,
      })

      router.push('/lend')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <CreateLayout>
      <Head>
        <title>Create Pair | Underworld by Soul</title>
        <meta key="description" name="description" content="Create Lending Pair on Underworld by Soul" />
      </Head>
      <Card
        className="h-full bg-dark-900"
        header={
          <Card.Header className="bg-dark-800">
            <div className="text-3xl text-high-emphesis leading-48px">Create Market</div>
          </Card.Header>
        }
      >
        <Container maxWidth="full" className="space-y-6">
          <div className="grid grid-cols-1 grid-rows-2 gap-4 md:grid-rows-1 md:grid-cols-2">
            <CurrencyInputPanel
              chainId={chainId}
              label="Collateral"
              hideBalance={true}
              hideInput={true}
              currency={currencies[Field.COLLATERAL]}
              onCurrencySelect={handleCollateralSelect}
              otherCurrency={currencies[Field.ASSET]}
              showCommonBases={false}
              allowManageTokenList={false}
              // showSearch={false}
              id="underworld-currency-collateral"
            />

            <CurrencyInputPanel
              label="Asset"
              chainId={chainId}
              hideBalance={true}
              hideInput={true}
              currency={currencies[Field.ASSET]}
              onCurrencySelect={handleAssetSelect}
              otherCurrency={currencies[Field.COLLATERAL]}
              showCommonBases={false}
              // allowManageTokenList={false}
              showSearch={false}
              id="underworld-currency-asset"
            />
          </div>

          <Button
            color="gradient"
            className="w-full px-4 py-3 text-base rounded text-high-emphesis"
            onClick={() => handleCreate()}
            disabled={!both}
          >
            {inputError || 'Create'}
          </Button>
        </Container>
      </Card>
    </CreateLayout>
  )
}

const CreateLayout = ({ children }) => {
  const { i18n } = useLingui()
  return (
  // @ts-ignore TYPE NEEDS FIXING
    <Layout
      left={
        <Card
          className="h-full bg-dark-900"
          backgroundImage="/images/underworld/deposit.png"
          title={i18n._(t`Create a new Underworld Market`)}
          description={i18n._(
            t`If you want to supply to a market that is not listed yet, you can use this tool to create a new pair.`
          )}
        />
      }
    >
      {children}
    </Layout>
  )
}

Create.Guard = NetworkGuard(Feature.UNDERWORLD)