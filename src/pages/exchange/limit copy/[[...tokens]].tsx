import { SwitchVerticalIcon } from '@heroicons/react/outline'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Currency, CurrencyAmount, Percent, Trade, TradeType, WNATIVE, WNATIVE_ADDRESS } from 'sdk'
// import limitOrderPairList from 'constants/token-lists/limitOrderPairList.json'
import tokenList from 'constants/token-lists/soulswap.tokenlist.json'
import { Feature } from 'enums'
import LimitPriceInputPanel from 'features/limit/LimitPriceInputPanel'
// import OrderExpirationDropdown from 'features/limit/components/OrderExpirationDropdown'
import HeaderNew from 'features/trade/HeaderNew'
import SwapAssetPanel from 'features/trident/swap/SwapAssetPanel'
import NetworkGuard from 'guards/Network'
import { SwapLayout, SwapLayoutCard } from 'layouts/SwapLayout'
import { useActiveWeb3React } from 'services/web3'
import { useAppDispatch } from 'state/hooks'
import { Field } from 'state/order/actions'
import useLimitOrderDerivedCurrencies, {
  useLimitOrderActionHandlers,
  useLimitOrderDerivedLimitPrice,
  useLimitOrderDerivedParsedAmounts,
  useLimitOrderDerivedTrade,
  useLimitOrderState,
} from 'state/limit-order/hooks'
import { useExpertModeManager } from 'state/user/hooks'
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import useSoulSwapLimitOrders from 'hooks/limitOrders/useSoulSwapLimitOrders'
import Badge from 'components/Badge'
import useLimitOrders from 'features/limit/hooks/useLimitOrders'
import DoubleGlowShadowV2 from 'components/DoubleGlowShadowV2'
import MainHeader from 'features/swap/MainHeader'
import { useDerivedSwapInfo } from 'state/swap/hooks'
import { maxAmountSpend } from 'functions/currency/maxAmountSpend'
import AppBody from 'pages/AppBody'
import { ArrowWrapper, BottomGrouping, Dots, SwapCallbackError, Wrapper } from 'features/swap/styleds'
import { AutoColumn } from 'components/Column'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import Row, { AutoRow, RowFixed } from 'components/Row'
import { MouseoverTooltip, MouseoverTooltipContent } from 'components/Tooltip'
import { ArrowDown, CheckCircle, Divide, HelpCircle, X } from 'react-feather'
import Loader from 'components/Loader'
import ConfirmSwapModal from 'features/swap/ConfirmSwapModal'
import theme, { TYPE } from 'theme'
import { CurrencyLogo } from 'components/CurrencyLogo'
import { Rate } from 'state/order/actions'
// import { NATIVE } from 'sdk'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { useCurrencyBalances } from 'state/wallet/hooks'
import AdvancedSwapDetails from 'features/swap/AdvancedSwapDetails'
import Typography from 'components/Typography'
import UnsupportedCurrencyFooter from 'features/swap/UnsupportedCurrencyFooter'
import { ApprovalState, useApproveCallbackFromInputCurrencyAmount } from 'hooks/useApproveCallback'
import { NATIVE } from 'constants/addresses'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import TradePrice from 'features/swap/TradePrice'
import Web3State from 'hooks/useWeb3'
import Card from 'components/Card'
// import { GelatoLimitOrdersHistoryPanel } from 'soulswap-limit-orders-react'
import { ZERO_PERCENT } from '../../../constants'
import LimitInputPanel from 'components/LimitInputPanel'


const LimitOrder = () => {
  const { account, chainId } = useActiveWeb3React()
  // const [isExpertMode] = useExpertModeManager()
  // const { typedField, typedValue, fromCoffinBalance, recipient } = useLimitOrderState()
  // const { inputCurrency, outputCurrency } = useLimitOrderDerivedCurrencies()
  // const { pending } = useLimitOrders()
  const toggleWalletModal = Web3State
  const currencyBalances = useCurrencyBalances(account)

  // const currencyBalances = useLimitOrderDerivedCurrencies();
  const trade = useLimitOrderDerivedTrade()
  const rate = useLimitOrderDerivedLimitPrice()
  const parsedAmounts = useLimitOrderDerivedParsedAmounts({ rate, trade })
  const { onSwitchTokens, onCurrencySelection, onUserInput } = useLimitOrderActionHandlers()
  const { inputCurrency, outputCurrency } = useLimitOrderDerivedCurrencies()
  const inputPanelHelperText = useMemo(() => {
    if (rate && trade) {
      const { numerator, denominator } = rate.subtract(trade.executionPrice).divide(trade.executionPrice)
      return new Percent(numerator, denominator)
    }
  }, [rate, trade])
  const {
    handlers: {
      handleInput,
      handleRateType,
      handleCurrencySelection,
      handleSwitchTokens,
      handleLimitOrderSubmission,
    },
    derivedOrderInfo: {
      // parsedAmounts,
      currencies,
      // currencyBalances,Currency
      // trade,
      formattedAmounts,
      inputError,
      rawAmounts,
      price,
    },
    orderState: { independentField, rateType },
  } = useSoulSwapLimitOrders();

  const fiatValueInput = useUSDCValue(parsedAmounts.inputAmount);

  const swapIsUnsupported = useIsSwapUnsupported(
    currencies?.input,
    currencies?.output
  );

  const { typedField, typedValue, fromCoffinBalance } = useLimitOrderState()


  // const desiredRateInCurrencyAmount = 
  // parsedAmounts(
  //   trade?.outputAmount.toSignificant(6),
  //   currencies.output  
  // );

  // const fiatValueDesiredRate = useUSDCValue(desiredRateInCurrencyAmount);

  const currentMarketRate = trade?.executionPrice ?? undefined;

  const pct =
    currentMarketRate && price
      ? price.subtract(currentMarketRate).divide(currentMarketRate)
      : undefined;

  const percentageRateDifference = pct
    ? new Percent(pct.numerator, pct.denominator)
    : undefined;

  const isValid = !inputError;

  const [activeTab, setActiveTab] = useState<"sell" | "buy">("sell");
  const handleActiveTab = (tab: "sell" | "buy") => {
    if (activeTab === tab) return;

    // handleRateType(rateType, price);
    setActiveTab(tab);
  };
  const handleTypeInput = useCallback(
    (value: string) => {
      handleInput(Field.INPUT, value);
    },
    [handleInput]
  );
  const handleTypeOutput = useCallback(
    (value: string) => {
      handleInput(Field.OUTPUT, value);
    },
    [handleInput]
  );
  const handleTypeDesiredRate = useCallback(
    (value: string) => {
      handleInput(Field.PRICE, value);
    },
    [handleInput]
  );

  // modal and loading
  const [
    { showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash },
    setSwapState,
  ] = useState<{
    showConfirm: boolean;
    tradeToConfirm: Trade<Currency, Currency, TradeType> | undefined;
    attemptingTxn: boolean;
    swapErrorMessage: string | undefined;
    txHash: string | undefined;
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  });

  const [
    approvalState,
    approveCallback,
  ] = useApproveCallbackFromInputCurrencyAmount(parsedAmounts.inputAmount);

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true);
    }
  }, [approvalState, approvalSubmitted]);

  const allowedSlippage = new Percent(40, 10_000);
  const userHasSpecifiedInputOutput = Boolean(
    currencies.input && currencies.output
  );
  const routeNotFound = !trade?.route;
  const isLoadingRoute =
    userHasSpecifiedInputOutput &&
    ((parsedAmounts.inputAmount && !parsedAmounts.outputAmount) ||
      (!parsedAmounts.inputAmount && parsedAmounts.outputAmount));

  const maxInputAmount: CurrencyAmount<Currency> | undefined = maxAmountSpend(
    currencyBalances[account]?.inputCurrency
  );
  const showMaxButton = Boolean(
    maxInputAmount?.greaterThan(0) &&
    !parsedAmounts.inputAmount?.equalTo(maxInputAmount)
  );

  const showApproveFlow =
    !inputError &&
    (approvalState === ApprovalState.NOT_APPROVED ||
      approvalState === ApprovalState.PENDING ||
      (approvalSubmitted && approvalState === ApprovalState.APPROVED));

  const handleApprove = useCallback(async () => {
    await approveCallback();
  }, [approveCallback]);

  const handleSwap = useCallback(() => {
    if (!handleLimitOrderSubmission) {
      return;
    }

    setSwapState({
      attemptingTxn: true,
      tradeToConfirm,
      showConfirm,
      swapErrorMessage: undefined,
      txHash: undefined,
    });

    try {
      if (!currencies.input?.wrapped.address) {
        throw new Error("Invalid input currency");
      }

      if (!currencies.output?.wrapped.address) {
        throw new Error("Invalid output currency");
      }

      if (!rawAmounts.input) {
        throw new Error("Invalid input amount");
      }

      if (!rawAmounts.output) {
        throw new Error("Invalid output amount");
      }

      if (!account) {
        throw new Error("No account");
      }

      handleLimitOrderSubmission({
        inputToken: currencies.input?.isNative
          ? NATIVE
          : currencies.input?.wrapped.address,
        outputToken: currencies.output?.isNative
          ? NATIVE
          : currencies.output?.wrapped.address,
        inputAmount: rawAmounts.input,
        outputAmount: rawAmounts.output,
        owner: account,
      })
        .then(({ hash }) => {
          setSwapState({
            attemptingTxn: false,
            tradeToConfirm,
            showConfirm,
            swapErrorMessage: undefined,
            txHash: hash,
          });
        })
        .catch((error) => {
          setSwapState({
            attemptingTxn: false,
            tradeToConfirm,
            showConfirm,
            swapErrorMessage: error.message,
            txHash: undefined,
          });
        });
    } catch (error: any) {
      setSwapState({
        attemptingTxn: false,
        tradeToConfirm,
        showConfirm,
        swapErrorMessage: error.message,
        txHash: undefined,
      });
    }
  }, [
    handleLimitOrderSubmission,
    tradeToConfirm,
    showConfirm,
    currencies.input?.wrapped.address,
    currencies.input?.isNative,
    currencies.output?.wrapped.address,
    currencies.output?.isNative,
    rawAmounts.input,
    rawAmounts.output,
    account,
  ]);

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({
      showConfirm: false,
      tradeToConfirm,
      attemptingTxn,
      swapErrorMessage,
      txHash,
    });
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      handleInput(Field.INPUT, "");
    }
  }, [attemptingTxn, handleInput, swapErrorMessage, tradeToConfirm, txHash]);


  const handleAcceptChanges = useCallback(() => {
    setSwapState({
      tradeToConfirm: trade as any,
      swapErrorMessage,
      txHash,
      attemptingTxn,
      showConfirm,
    });
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash]);

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      //  setApprovalSubmitted(false); // reset 2 step UI for approvals
      handleCurrencySelection(Field.INPUT, inputCurrency);
    },
    [handleCurrencySelection]
  );

  const handleMaxInput = useCallback(() => {
    maxInputAmount && handleInput(Field.INPUT, maxInputAmount.toExact());
  }, [maxInputAmount, handleInput]);

  const handleOutputSelect = useCallback(
    (outputCurrency) => handleCurrencySelection(Field.OUTPUT, outputCurrency),
    [handleCurrencySelection]
  );

  const [showInverted, setShowInverted] = useState<boolean>(false);

  const recipient = account ?? null;

  return (
    // <Fragment>
    <SwapLayoutCard>
      <div id="limit-page" className="w-full h-full max-w-2xl space-y-3 rounded bg-dark-900 z-1">
          <HeaderNew inputCurrency={currencies[Field.INPUT]} outputCurrency={currencies[Field.OUTPUT]} />
        </div>
        <div className="ml-0 mb-4">
        <LimitInputPanel
                label={
                  independentField === Field.OUTPUT ? "From (at most)" : "From"
                }
                value={formattedAmounts.input}
                showMaxButton={showMaxButton}
                currency={currencies.input}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                // fiatValue={fiatValueInput ?? undefined}
                onCurrencySelect={handleInputSelect}
                otherCurrency={currencies.output}
                // showCommonBases={showCommonBases}
                id="limit-order-currency-input"
              />
          <div className="flex gap-3">
            <div className="flex flex-2">
              <LimitPriceInputPanel trade={trade} limitPrice={!!rate ? rate : trade?.executionPrice} />
            </div>
            <SwitchVerticalIcon
              width={18}
              className="mt-6 cursor-pointer text-secondary hover:text-white"
              onClick={onSwitchTokens}
            />
          </div>
          <SwapAssetPanel
            error={false}
            header={(props) => <SwapAssetPanel.Header {...props} label={`You receive`} />}
            selected={true}
            currency={outputCurrency}
            value={(typedField === Field.OUTPUT ? typedValue : parsedAmounts?.outputAmount?.toSignificant(6)) || ''}
            onChange={(value) => onUserInput(currencies[Field.OUTPUT], value || '')}
            onSelect={(outputCurrency) => onCurrencySelection(currencies[Field.OUTPUT], outputCurrency)}
          // currency={currencies[Field.OUTPUT]}
          priceImpact={inputPanelHelperText}
          priceImpactCss={inputPanelHelperText?.greaterThan(ZERO_PERCENT) ? 'text-green' : 'text-red'}
          />
        </div>
        {/* {isExpertMode && <RecipientField recipient={recipient} action={setRecipient} />} */}
        {/* <LimitOrderButton trade={trade} parsedAmounts={parsedAmounts} /> */}
        {/* <LimitOrderReviewModal
          parsedAmounts={parsedAmounts}
          trade={trade}
          limitPrice={!!rate ? rate : trade?.executionPrice}
        /> */}
        {/* <Typography variant="xs" className="px-10 mt-5 italic text-center text-low-emphesis">
        {i18n._(t`Limit orders use funds from CoffinBox, to create a limit order depositing into CoffinBox is required.`)}
      </Typography> */}
        {/* <div className="sm:flex items-center px-4">
          <NavLink href="/exchange/limit/open">
          <a className="flex text-blue items-center space-x-2 font-medium text-center cursor-pointer text-base hover:text-high-emphesis">
          <span>{i18n._(t`View Open Orders`)}</span>
          <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          </a>
          </NavLink>
        </div> */}
        {/* <GelatoLimitOrdersHistoryPanel /> */}
    </SwapLayoutCard>
  )
}

LimitOrder.Guard = NetworkGuard(Feature.LIMIT)
LimitOrder.Layout = SwapLayout('limit-order-page')

export default LimitOrder