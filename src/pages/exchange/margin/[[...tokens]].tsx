import { ArrowDownIcon } from '@heroicons/react/solid'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Currency, CurrencyAmount, JSBI, Token, Trade as V2Trade, TradeType } from 'sdk'
import Banner from 'components/Banner'
import { Button, ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import RecipientField from 'components/RecipientField'
import Typography from 'components/Typography'
import Web3Connect from 'components/Web3Connect'
import ConfirmSwapModal from 'features/swap/ConfirmSwapModal'
import SwapCallbackError from 'features/swap/SwapCallbackError'
import SwapDetails from 'features/swap/SwapDetails'
import UnsupportedCurrencyFooter from 'features/swap/UnsupportedCurrencyFooter'
import HeaderNew from 'features/trade/HeaderNew'
import SwapAssetPanel from 'features/trident/swap/SwapAssetPanel'
import confirmPriceImpactWithoutFee from 'functions/prices'
import { warningSeverity } from 'functions/prices'
import { computeFiatValuePriceImpact } from 'functions/trade'
import { useAllTokens, useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
import useENSAddress from 'hooks/useENSAddress'
import useIsArgentWallet from 'hooks/useIsArgentWallet'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { useSwapCallback } from 'hooks/useSwapCallback'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { SwapLayout, SwapLayoutCard } from 'layouts/SwapLayout'
import TokenWarningModal from 'modals/TokenWarningModal'
import { useActiveWeb3React } from 'services/web3'
import { Field, setRecipient } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useExpertModeManager, useUserOpenMev, useUserSingleHopOnly } from 'state/user/hooks'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ReactGA from 'react-ga'
import { useBorrowable, useLendingAvailable } from 'state/wallet/hooks'

import { fetchAPI } from '../../../lib/api'
import Chart from 'components/Chart'
// import AppBody from 'pages/AppBody'
import { ArrowWrapper, BottomGrouping, ClickableText, Wrapper } from 'features/swap/styleds'
import Column, { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { AutoRow, RowBetween } from 'components/Row'
import { ArrowDown } from 'react-feather'
import LinkStyledButton from 'components/LinkStyledButton'
import TradePrice from 'features/swap/TradePrice'
// import theme, { TYPE } from 'theme'
import Card from 'components/Card'
import ProgressSteps from 'components/ProgressSteps'
import AdvancedSwapDetailsDropdown from 'features/swap/AdvancedSwapDetailsDropdown'
import AddressInputPanel from 'components/AddressInputPanel'
import { LeverageType } from 'sdk/enums/TradeType'
import { useMarginTokenList } from 'state/lists/hooks'

export async function getServerSideProps() {
  try {
    const { data } = await fetchAPI('/banners?populate=image')
    return {
      props: { banners: data || [] },
    }
  } catch (e) {
    return {
      props: { banners: [] },
    }
  }
}

const Swap = () => {
  const { i18n } = useLingui()
  const loadedUrlParams = useDefaultsFromURLSearch()
  const { account } = useActiveWeb3React()
  const defaultTokens = useAllTokens()
  const [isExpertMode] = useExpertModeManager()
  const { independentField, typedValue, recipient } = useSwapState()
  const { v2Trade, parsedAmount, currencies, inputError: swapInputError, allowedSlippage, to } = useDerivedSwapInfo()
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]

  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  // dismiss warning if all imported tokens are in active lists
  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens)
    })

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

  const trade = showWrap ? undefined : v2Trade

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
          [Field.INPUT]: parsedAmount,
          [Field.OUTPUT]: parsedAmount,
        }
        : {
          [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
          [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
        },
    [independentField, parsedAmount, showWrap, trade]
  )

  const fiatValueInput = useUSDCValue(parsedAmounts[Field.INPUT])
  const fiatValueOutput = useUSDCValue(parsedAmounts[Field.OUTPUT])
  const priceImpact = computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput)
  const { onSwitchTokens, onCurrencySelection, onUserInput } = useSwapActionHandlers()

  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )

  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: V2Trade<Currency, Currency, TradeType> | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? /* @ts-ignore TYPE NEEDS FIXING */
      parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const userHasSpecifiedInputOutput = Boolean(
    /* @ts-ignore TYPE NEEDS FIXING */
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )

  const routeNotFound = !trade?.route

  // check whether the user has approved the router on the input token
  const [approvalState, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage)

  const signatureData = undefined

  const handleApprove = useCallback(async () => {
    await approveCallback()
    // if (signatureState === UseERC20PermitState.NOT_SIGNED && gatherPermitSignature) {
    //   try {
    //     await gatherPermitSignature()
    //   } catch (error) {
    //     // try to approve if gatherPermitSignature failed for any reason other than the user rejecting it
    //     if (error?.code !== USER_REJECTED_TRANSACTION) {
    //       await approveCallback()
    //     }
    //   }
    // } else {
    //   await approveCallback()
    // }
  }, [approveCallback])
  // }, [approveCallback, gatherPermitSignature, signatureState])

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  const [useOpenMev] = useUserOpenMev()

  const borrowableBalance = useBorrowable(currencies[Field.INPUT] ?? undefined)
  const currencySymbol = currencies[Field.INPUT]?.symbol
  const tokenList = useMarginTokenList(250)
  const token = tokenList.find(t => t.symbol === currencySymbol)
  // const lendingAvailable = useLendingAvailable(250, token, provider)

  // const maxAmountInput: CurrencyAmount<Token | Currency> | undefined = maxAmountSpend(
  //   currencyBalances[Field.INPUT],
  //   lendingAvailable,
  //   marginAccountBalances[Field.INPUT]
  // )
  // const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))
  // const marginTrade = leverageType === LeverageType.CROSS_MARGIN
  const [maxBorrow, setMaxBorrow] = useState<number | undefined>()

  useEffect(() => {
    const maxBorrow = Math.min(
      borrowableBalance ? parseFloat(borrowableBalance.toSignificant(6)) : 0,
      // lendingAvailable ? parseFloat(lendingAvailable.toSignificant(6)) : 0
    )
    setMaxBorrow(maxBorrow)
  }, [borrowableBalance, ]) // lendingAvailable


  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    to,
    signatureData,
    /* @ts-ignore TYPE NEEDS FIXING */
    null,
    useOpenMev
    // leverageType === LeverageType.CROSS_MARGIN && maxAmountInput ? maxAmountInput.toSignificant(6) : '0'
  )

  const [singleHopOnly] = useUserSingleHopOnly()

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    if (priceImpact && !confirmPriceImpactWithoutFee(priceImpact)) {
      return
    }
    setSwapState({
      attemptingTxn: true,
      tradeToConfirm,
      showConfirm,
      swapErrorMessage: undefined,
      txHash: undefined,
    })
    swapCallback()
      .then((hash) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: undefined,
          txHash: hash,
        })

        ReactGA.event({
          category: 'Swap',
          action:
            recipient === null
              ? 'Swap w/o Send'
              : (recipientAddress ?? recipient) === account
                ? 'Swap w/o Send + recipient'
                : 'Swap w/ Send',
          label: [
            trade?.inputAmount?.currency?.symbol,
            trade?.outputAmount?.currency?.symbol,
            singleHopOnly ? 'SH' : 'MH',
          ].join('/'),
        })

        ReactGA.event({
          category: 'Routing',
          action: singleHopOnly ? 'Swap with multihop disabled' : 'Swap with multihop enabled',
        })
      })
      .catch((error) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [
    swapCallback,
    priceImpact,
    tradeToConfirm,
    showConfirm,
    recipient,
    recipientAddress,
    account,
    trade?.inputAmount?.currency?.symbol,
    trade?.outputAmount?.currency?.symbol,
    singleHopOnly,
  ])

  // warnings on slippage
  // const priceImpactSeverity = warningSeverity(priceImpactWithoutFee);
  const priceImpactSeverity = useMemo(() => {
    const executionPriceImpact = trade?.priceImpact
    return warningSeverity(
      executionPriceImpact && priceImpact
        ? executionPriceImpact.greaterThan(priceImpact)
          ? executionPriceImpact
          : priceImpact
        : executionPriceImpact ?? priceImpact
    )
  }, [priceImpact, trade])

  const isArgentWallet = useIsArgentWallet()

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !isArgentWallet &&
    !swapInputError &&
    (approvalState === ApprovalState.NOT_APPROVED ||
      approvalState === ApprovalState.PENDING ||
      (approvalSubmitted && approvalState === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode)

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({
      showConfirm: false,
      tradeToConfirm,
      attemptingTxn,
      swapErrorMessage,
      txHash,
    })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({
      tradeToConfirm: trade,
      swapErrorMessage,
      txHash,
      attemptingTxn,
      showConfirm,
    })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleOutputSelect = useCallback(
    (outputCurrency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection]
  )

  const swapIsUnsupported = useIsSwapUnsupported(currencies?.INPUT, currencies?.OUTPUT)

  const priceImpactCss = useMemo(() => {
    switch (priceImpactSeverity) {
      case 0:
      case 1:
      case 2:
      default:
        return 'text-low-emphesis'
      case 3:
        return 'text-yellow'
      case 4:
        return 'text-red'
    }
  }, [priceImpactSeverity])

  return (
    <>

      <ConfirmSwapModal
        isOpen={showConfirm}
        trade={trade}
        originalTrade={tradeToConfirm}
        onAcceptChanges={handleAcceptChanges}
        attemptingTxn={attemptingTxn}
        txHash={txHash}
        // @ts-ignore TYPE NEEDS FIXING
        recipient={recipient}
        allowedSlippage={allowedSlippage}
        onConfirm={handleSwap}
        swapErrorMessage={swapErrorMessage}
        onDismiss={handleConfirmDismiss}
      />
      <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
      />
      {/* <div className="mt-8" /> */}
      <SwapLayoutCard>
        <div className="flex flex-col gap-3 justify-center">
          <HeaderNew inputCurrency={currencies[Field.INPUT]} outputCurrency={currencies[Field.OUTPUT]} />
          <SwapAssetPanel
            spendFromWallet={true}
            header={(props) => (
              <SwapAssetPanel.Header
                {...props}
                label={
                  independentField === Field.OUTPUT && !showWrap ? i18n._(t`Swap from:`) : i18n._(t`Swap from:`)
                }
              />
            )}
            currency={currencies[Field.INPUT]}
            value={formattedAmounts[Field.INPUT]}
            onChange={handleTypeInput}
            onSelect={handleInputSelect}
          />
          <div className="flex justify-center -mt-6 -mb-6 z-0">
            <div
              role="button"
              className="p-1.5 rounded-full bg-dark-800 border shadow-md border-dark-700 hover:border-dark-600"
              onClick={() => {
                setApprovalSubmitted(false) // reset 2 step UI for approvals
                onSwitchTokens()
              }}
            >
              <ArrowDownIcon width={14} className="text-high-emphesis hover:text-white" />
            </div>
          </div>
          <SwapAssetPanel
            spendFromWallet={true}
            header={(props) => (
              <SwapAssetPanel.Header
                {...props}
                label={independentField === Field.INPUT && !showWrap ? i18n._(t`Swap to:`) : i18n._(t`Swap to:`)}
              />
            )}
            currency={currencies[Field.OUTPUT]}
            value={formattedAmounts[Field.OUTPUT]}
            onChange={handleTypeOutput}
            onSelect={handleOutputSelect}
            priceImpact={priceImpact}
            priceImpactCss={priceImpactCss}
          />
          {isExpertMode && <RecipientField recipient={recipient} action={setRecipient} />}
          {Boolean(trade) && (
            <SwapDetails
              inputCurrency={currencies[Field.INPUT]}
              outputCurrency={currencies[Field.OUTPUT]}
              trade={trade}
              recipient={recipient ?? undefined}
            />
          )}

          {trade && routeNotFound && userHasSpecifiedInputOutput && (
            <Typography variant="xs" className="text-center py-2">
              {i18n._(t`Insufficient liquidity for this trade.`)}{' '}
              {singleHopOnly && i18n._(t`Try enabling multi-hop trades`)}
            </Typography>
          )}

          {swapIsUnsupported ? (
            <Button color="red" disabled fullWidth className="rounded-2xl md:rounded">
              {i18n._(t`Unsupported Asset`)}
            </Button>
          ) : !account ? (
            <Web3Connect color="blue" variant="filled" className="rounded-2xl md:rounded" />
          ) : showWrap ? (
            <Button
              fullWidth
              color="blue"
              disabled={Boolean(wrapInputError)}
              onClick={onWrap}
              className="rounded-2xl md:rounded"
            >
              {wrapInputError ??
                (wrapType === WrapType.WRAP
                  ? i18n._(t`Wrap`)
                  : wrapType === WrapType.UNWRAP
                    ? i18n._(t`Unwrap`)
                    : null)}
            </Button>
          ) : showApproveFlow ? (
            <div>
              {approvalState !== ApprovalState.APPROVED && (
                <Button
                  fullWidth
                  color = "purple"
                  loading={approvalState === ApprovalState.PENDING}
                  onClick={handleApprove}
                  disabled={approvalState !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                  className="rounded-2xl md:rounded"
                >
                  {i18n._(t`Approve ${currencies[Field.INPUT]?.symbol}`)}
                </Button>
              )}
              {approvalState === ApprovalState.APPROVED && (
                <Button
                  color={isValid && priceImpactSeverity > 2 ? 'red' : 'gradient'}
                  onClick={() => {
                    if (isExpertMode) {
                      handleSwap()
                    } else {
                      setSwapState({
                        tradeToConfirm: trade,
                        attemptingTxn: false,
                        swapErrorMessage: undefined,
                        showConfirm: true,
                        txHash: undefined,
                      })
                    }
                  }}
                  fullWidth
                  id="swap-button"
                  disabled={
                    !isValid || approvalState !== ApprovalState.APPROVED || (priceImpactSeverity > 3 && !isExpertMode)
                  }
                  className="rounded-2xl md:rounded"
                >
                  {priceImpactSeverity > 3 && !isExpertMode
                    ? i18n._(t`Price Impact High`)
                    : priceImpactSeverity > 2
                      ? i18n._(t`Swap Anyway`)
                      : i18n._(t`Swap`)}
                </Button>
              )}
            </div>
          ) : (
            <Button
              color={isValid && priceImpactSeverity > 2 && !swapCallbackError ? 'red' : 'gradient'}
              fullWidth
              onClick={() => {
                if (isExpertMode) {
                  handleSwap()
                } else {
                  setSwapState({
                    tradeToConfirm: trade,
                    attemptingTxn: false,
                    swapErrorMessage: undefined,
                    showConfirm: true,
                    txHash: undefined,
                  })
                }
              }}
              id="swap-button"
              disabled={!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError}
              className="rounded-2xl md:rounded"
            >
              {swapInputError
                ? swapInputError
                : priceImpactSeverity > 3 && !isExpertMode
                  ? i18n._(t`Price Impact Too High`)
                  : priceImpactSeverity > 2
                    ? i18n._(t`Swap Anyway`)
                    : i18n._(t`Swap`)}
            </Button>
          )}
          {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
          {swapIsUnsupported ? <UnsupportedCurrencyFooter currencies={[currencies.INPUT, currencies.OUTPUT]} show={false} /> : null}
        </div>
      <div className={`xl:max-w-7xl mt-6 w-full lg:grid-cols-1 order-last space-y-4 lg:space-x-4 lg:space-y-0 bg-dark-900`}>
        <div className={`w-full flex flex-col order-last mt-6 mb-20 sm:mb-0 lg:mt-0 p-6 rounded rounded-lg bg-light-glass`}>
          <Chart inputCurrency={currencies[Field.INPUT]} outputCurrency={currencies[Field.OUTPUT]} />
        </div>
      </div>
      {/* </SwapLayoutCard> */}
      {/* <AppBody> */}
        {/* <SwapHeader />
        <PaddedColumn>
          <ToggleWrapper>
            <ToggleOption
              onClick={() => onSwitchLeverageType(LeverageType.SPOT)}
              active={leverageType === LeverageType.SPOT}
            >
              SPOT
            </ToggleOption>
            <ToggleOption
              onClick={() => onSwitchLeverageType(LeverageType.CROSS_MARGIN)}
              active={leverageType === LeverageType.CROSS_MARGIN}
            >
              MARGIN
            </ToggleOption>
          </ToggleWrapper>
        </PaddedColumn> */}
        {/* <Separator /> */}
        <Wrapper id="swap-page">
          <ConfirmSwapModal
            isOpen={showConfirm}
            trade={trade}
            originalTrade={tradeToConfirm}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            allowedSlippage={allowedSlippage}
            onConfirm={handleSwap}
            swapErrorMessage={swapErrorMessage}
            onDismiss={handleConfirmDismiss}
          />

          <AutoColumn gap={'md'}>
            <CurrencyInputPanel
              label={independentField === Field.OUTPUT && !showWrap && trade ? 'From (estimated)' : 'From'}
              value={formattedAmounts[Field.INPUT]}
              // showMaxButton={!atMaxAmountInput}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              // onMax={handleMaxInput}
              onCurrencySelect={handleInputSelect}
              otherCurrency={currencies[Field.OUTPUT]}
              // allowManualAddToken={leverageType === LeverageType.SPOT}
              id="swap-currency-input" showMaxButton={false}            />
            <AutoColumn justify="space-between">
              <AutoRow
                // justify={isExpertMode || leverageType === LeverageType.CROSS_MARGIN ? 'space-between' : 'center'}
                justify={isExpertMode ? 'space-between' : 'center'}
                style={{ padding: '0 1rem' }}
              >
                {/*leverageType === LeverageType.CROSS_MARGIN && <span>Leverage: 50%</span>*/}
                <ArrowWrapper clickable>
                  <ArrowDown
                    size="16"
                    onClick={() => {
                      setApprovalSubmitted(false) // reset 2 step UI for approvals
                      onSwitchTokens()
                    }}
                    // color={currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.primary1 : theme.text2}
                  />
                </ArrowWrapper>
                {/* {leverageType === LeverageType.CROSS_MARGIN && ( */}
                  <span>
                    Borrowable:
                    {` ${maxBorrow ? maxBorrow : '-'}`}
                  </span>
                {/* )} */}
                {recipient === null && !showWrap && isExpertMode ? (
                  <LinkStyledButton id="add-recipient-button" 
                  // onClick={() => onChangeRecipient('')}
                  >
                    + Add a send (optional)
                  </LinkStyledButton>
                ) : null}
              </AutoRow>
            </AutoColumn>
            <CurrencyInputPanel
              value={formattedAmounts[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              label={independentField === Field.INPUT && !showWrap && trade ? 'To (estimated)' : 'To'}
              showMaxButton={false}
              currency={currencies[Field.OUTPUT]}
              onCurrencySelect={handleOutputSelect}
              otherCurrency={currencies[Field.INPUT]}
              // allowManualAddToken={leverageType === LeverageType.SPOT}
              id="swap-currency-output"
            />

            {recipient !== null && !showWrap ? (
              <>
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable={false}>
                    <ArrowDown size="16" />
                  </ArrowWrapper>
                  {/* <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                    - Remove send
                  </LinkStyledButton> */}
                </AutoRow>
                {/* <AddressInputPanel id="recipient" value={recipient} 
                onChange={onChangeRecipient} 
                /> */}
              </>
            ) : null}

            {showWrap ? null : (
              // <Card padding={showWrap ? '.25rem 1rem 0 1rem' : '0px'} borderRadius={'20px'}>
              <Card className= {'.25rem 1rem 0 1rem'}>
                <AutoColumn gap="8px" style={{ padding: '0 16px' }}>
                  {Boolean(trade) && (
                    <RowBetween align="center">
                      {/* <Text fontWeight={500} fontSize={14} color={theme.text2}> */}
                        Price
                      {/* </Text> */}
                      <TradePrice
                        price={trade?.executionPrice} showInverted={false} setShowInverted={function (showInverted: boolean): void {
                          throw new Error('Function not implemented.')
                        } }                        // showInverted={showInverted}
                        // setShowInverted={setShowInverted}
                      />
                    </RowBetween>
                  )}
                  {/* {allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && ( */}
                    <RowBetween align="center">
                      {/* <ClickableText fontWeight={500} fontSize={14} color={theme.text2} onClick={toggleSettings}> */}
                        Slippage Tolerance
                      {/* </ClickableText> */}
                      {/* <ClickableText fontWeight={500} fontSize={14} color={theme.text2} onClick={toggleSettings}> */}
                        {Number(allowedSlippage) / 100}%
                      {/* </ClickableText> */}
                    </RowBetween>
                  {/* )} */}
                </AutoColumn>
              </Card>
            )}
          </AutoColumn>
          <BottomGrouping>
            {swapIsUnsupported ? (
              <ButtonPrimary disabled={true}>
                {/* <TYPE.Main mb="4px">Unsupported Asset</TYPE.Main> */}
              </ButtonPrimary>
            ) : !account ? (
              // <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
              <ButtonLight onClick={null}>Connect Wallet</ButtonLight>
            ) : showWrap ? (
              <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                {wrapInputError ??
                  (wrapType === WrapType.WRAP ? 'Wrap' : wrapType === WrapType.UNWRAP ? 'Unwrap' : null)}
              </ButtonPrimary>
            // ) : noRoute && userHasSpecifiedInputOutput && tradeLoading.isLoading ? (
            ) : userHasSpecifiedInputOutput ? (
              // <GreyCard style={{ textAlign: 'center' }}>
                // <CustomLightSpinner src={Circle} alt="loader" size={'25px'} />
              // </GreyCard>
              ''
            // ) : noRoute && userHasSpecifiedInputOutput ? (
            ) : userHasSpecifiedInputOutput ? (
              // <GreyCard style={{ textAlign: 'center' }}>
                // <TYPE.Main mb="4px">Insufficient liquidity for this trade.</TYPE.Main>
                // {singleHopOnly && <TYPE.main mb="4px">Try enabling multi-hop trades.</TYPE.main>}
              // </GreyCard>
            // ) : leverageType !== LeverageType.CROSS_MARGIN && showApproveFlow ? (
            // ) : showApproveFlow ? (
              <RowBetween>
                {/* <ButtonConfirmed
                  onClick={approveCallback}
                  disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                  width="48%"
                  altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                  confirmed={approval === ApprovalState.APPROVED}
                >
                  {approval === ApprovalState.PENDING ? (
                    <AutoRow gap="6px" justify="center">
                      Approving <Loader stroke="white" />
                    </AutoRow>
                  ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                    'Approved'
                  ) : (
                    'Approve ' + currencies[Field.INPUT]?.symbol
                  )}
                </ButtonConfirmed> */}
              </RowBetween>
            ) : (
              <ButtonError
                onClick={() => {
                  if (isExpertMode) {
                    handleSwap()
                  } else {
                    setSwapState({
                      tradeToConfirm: trade,
                      attemptingTxn: false,
                      swapErrorMessage: undefined,
                      showConfirm: true,
                      txHash: undefined
                    })
                  }
                }}
                id="swap-button-2"
                disabled={!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError}
                error={isValid && priceImpactSeverity > 2 && !swapCallbackError}
              >
                {/* <Text fontSize={20} fontWeight={500}> */}
                  {swapInputError
                    ? swapInputError
                    : priceImpactSeverity > 3 && !isExpertMode
                    ? `Price Impact Too High`
                    : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
                {/* </Text> */}
              </ButtonError>
            )}
            {showApproveFlow && (
              <Column style={{ marginTop: '1rem' }}>
                <ProgressSteps 
                steps={[]}                
                // steps={[approval === ApprovalState.APPROVED]} 
                />
              </Column>
            )}
            {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
          </BottomGrouping>
        </Wrapper>
        </SwapLayoutCard>
      {/* {!swapIsUnsupported ? (
        <AdvancedSwapDetailsDropdown trade={trade} allowedSlippage={new Percent} />
      ) : (
        <UnsupportedCurrencyFooter show={swapIsUnsupported} currencies={[currencies.INPUT, currencies.OUTPUT]} />
      )} */}

      {/* <Banner banners={banners} /> */}
    </>
  )
}

Swap.Layout = SwapLayout('swap-page')
export default Swap