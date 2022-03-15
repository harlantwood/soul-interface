/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useState, Fragment, useEffect } from "react";
import {
  Currency,
  CurrencyAmount,
  Percent,
  TradeType,
  Trade,
  SOUL
} from "sdk";
import TradePrice from "components/TradePrice";
import { MouseoverTooltip, MouseoverTooltipContent } from "../Tooltip";
import {
  ArrowDown,
  Info,
  Divide,
  X,
  CheckCircle,
  HelpCircle,
} from "react-feather";
import { Text } from "rebass";
import styled from "styled-components";
import {
  ButtonConfirmed,
  ButtonError,
  ButtonLight,
  ButtonPrimary,
} from "../Button";
import { AutoColumn } from "../Column";
import CurrencyInputPanel from "../LimitInputPanel";
import Row, { AutoRow, RowFixed } from "../Row";
import useSoulSwapLimitOrders from "hooks/limitOrders/useSoulSwapLimitOrders";
import { useIsSwapUnsupported } from "hooks/limitOrders/useIsSwapUnsupported";
import { Field } from "state/order/actions";
import { maxAmountSpend } from "utils/tools/maxAmountSpend";
import AppBody from "./AppBody";
import { TYPE } from "theme";
import useGasOverhead from "hooks/useGasOverhead";
import {
  ApprovalState,
  useApproveCallbackFromInputCurrencyAmount,
} from "hooks/useApproveCallback";
import Loader from "../Loader";
import { CurrencyLogo } from "components/CurrencyLogo";
import { NATIVE } from "../../constants/addresses";
import ConfirmSwapModal from "features/swap/ConfirmSwapModal";
import AdvancedSwapDetails from "features/swap/AdvancedSwapDetails";
import { useUSDCValue } from "hooks/useUSDCPrice";
import UnsupportedCurrencyFooter from "features/swap/UnsupportedCurrencyFooter";
import Card from "components/Card";
import { ArrowWrapper, BottomGrouping, Dots, SwapCallbackError, Wrapper } from "features/swap/styleds";
import { useWeb3 } from "hooks/useWeb3";
import { tryParseAmount } from "functions/parse";
import AssetInput from "components/AssetInput";
import SwapAssetPanel from "features/trident/swap/SwapAssetPanel";
import { useOrderState } from "state/order/hooks";
import { useLimitOrderState } from "state/limit-order/hooks";
import { useSwapActionHandlers } from "state/swap/hooks";
import { SwitchVerticalIcon } from "@heroicons/react/outline";
import SwapHeader from "components/SwapHeader";
// import { useWalletModalToggle } from "state/application/hooks";

const StyledInfo = styled(Info)`
  opacity: 0.4;
  color: ${({ theme }) => theme.text1};
  height: 16px;
  width: 16px;
  :hover {
    opacity: 0.8;
  }
`;

enum Rate {
  DIV = "DIV",
  MUL = "MUL",
}

const text1 = "#000000"
const text3 = "#6C7284"
const green1 = "#27AE60"

interface LimitOrderProps {
  showCommonBases?: boolean;
}

export default function LimitOrder({
  showCommonBases = true,
}: LimitOrderProps) {
  const { account, chainId } = useWeb3();
  // const toggleWalletModal = useWalletModalToggle()
  const recipient = account ?? null;

  const {
    handlers: {
      handleInput,
      handleRateType,
      handleCurrencySelection,
      handleSwitchTokens,
      handleLimitOrderSubmission,
    },
    derivedOrderInfo: {
      parsedAmounts,
      currencies,
      currencyBalances,
      trade,
      formattedAmounts,
      inputError,
      rawAmounts,
      price,
    },
    orderState: { independentField, rateType },
  } = useSoulSwapLimitOrders();

  const fiatValueInput = useUSDCValue(parsedAmounts.input);

  const desiredRateInCurrencyAmount = tryParseAmount(
    trade?.outputAmount.toSignificant(6),
    currencies.output
  );

  const fiatValueDesiredRate = useUSDCValue(desiredRateInCurrencyAmount);

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

    handleRateType(rateType, price);
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
  ] = useApproveCallbackFromInputCurrencyAmount(parsedAmounts.input);

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
    ((parsedAmounts.input && !parsedAmounts.output) ||
      (!parsedAmounts.input && parsedAmounts.output));

  const maxInputAmount: CurrencyAmount<Currency> | undefined = maxAmountSpend(
    currencyBalances.input
  );
  const showMaxButton = Boolean(
    maxInputAmount?.greaterThan(0) &&
      !parsedAmounts.input?.equalTo(maxInputAmount)
  );

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
        throw new Error("No Account");
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

  const [showInverted, setShowInverted] = useState<boolean>(false);
  
  const { typedField, typedValue, fromCoffinBalance } = useLimitOrderState()
  const { onSwitchTokens, onCurrencySelection, onUserInput } = useSwapActionHandlers()
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

  const swapIsUnsupported = useIsSwapUnsupported(
    currencies?.input,
    currencies?.output
  );

  const {
    gasPrice,
    realExecutionPrice,
    realExecutionPriceAsString,
  } = useGasOverhead(parsedAmounts.input, parsedAmounts.output, rateType);

  const showApproveFlow =
    !inputError &&
    (approvalState === ApprovalState.NOT_APPROVED ||
      approvalState === ApprovalState.PENDING ||
      (approvalSubmitted && approvalState === ApprovalState.APPROVED));

  const handleApprove = useCallback(async () => {
    await approveCallback();
  }, [approveCallback]);

  return (
    <Fragment>
      <AppBody>
        <SwapHeader handleActiveTab={handleActiveTab} activeTab={activeTab} />
        <Wrapper id="limit-order-page">
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
            // inputAmount={parsedAmounts.input}
            // outputAmount={parsedAmounts.output} 
            />

          <AutoColumn gap={"md"}>
            <div style={{ display: "relative" }}>
            <SwapAssetPanel
                error={false}
                header={(props) => <SwapAssetPanel.Header {...props} />}
                selected={true}
                spendFromWallet={true}
                currency={currencies.input}
                value={formattedAmounts.input}
                // onCurrencySelect={handleInputSelect}
                // value={(typedField === Field.INPUT ? 
                //   typedValue : 
                //   parsedAmounts?.input?.toSignificant(6)) || ''}
                onChange={(value) => (handleTypeInput(value))}
                // onUserInput(Field.INPUT, value || '')}
                onSelect={handleInputSelect} 
                // onSelect={(inputCurrency) => handleInputSelect(inputCurrency)}
              />
              {/* <CurrencyInputPanel
                label={
                  independentField === Field.OUTPUT ? "From (at most)" : "From"
                }
                value={formattedAmounts.input}
                showMaxButton={showMaxButton}
                currency={currencies.input}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                fiatValue={fiatValueInput ?? undefined}
                onCurrencySelect={handleInputSelect}
                otherCurrency={currencies.output}
                showCommonBases={showCommonBases}
                id="limit-order-currency-input"
              /> */}
              <AssetInput
                value={formattedAmounts.price}
                // showMaxButton={showMaxButton}
                showMax={false}
                currencyLogo={false}
                currency={currencies.output}
                // onUserInput={handleTypeDesiredRate}
                fiatValue={fiatValueDesiredRate ?? undefined}
                // onCurrencySelect={handleInputSelect}
                otherCurrency={currencies.output}
                showCommonBases={showCommonBases}
                id="limit-order-currency-input" 
                onChange={(value) => (value)}
               showCurrencySelector={false}
                hideBalance={true}
                showRate={true}
                isInvertedRate={rateType === Rate.MUL ? false : true}
                gasPrice={gasPrice}
                realExecutionPrice={realExecutionPrice ?? undefined}
                realExecutionPriceAsString={realExecutionPriceAsString}
              />
            <SwitchVerticalIcon
              width={18}
              className="mt-6 cursor-pointer text-secondary hover:text-white"
              onClick={onSwitchTokens}
            />
              <SwapAssetPanel
                error={false}
                header={(props) => <SwapAssetPanel.Header {...props} />}
                selected={true}
                spendFromWallet={true}
                currency={currencies.output || SOUL[chainId]}
                value={formattedAmounts.output}
                // value={(typedField === Field.OUTPUT ? 
                //   typedValue : 
                //   parsedAmounts?.output?.toSignificant(6)) || ''}
                onChange={(value) => (handleTypeOutput(value))}
                // onUserInput(Field.INPUT, value || '')}
                // onSelect={handleOutputSelect} 
                onSelect={(outputCurrency) => handleOutputSelect(outputCurrency)}
              // currencies={inputTokenList}
              />
              {/* <CurrencyInputPanel
                value={formattedAmounts.output}
                onUserInput={handleTypeOutput}
                label={
                  independentField === Field.INPUT ? "To (at least)" : "To"
                }
                showMaxButton={false}
                hideBalance={false}
                priceImpact={percentageRateDifference}
                currency={currencies.output}
                onCurrencySelect={handleOutputSelect}
                otherCurrency={currencies.input}
                showCommonBases={showCommonBases}
                rateType={rateType}
                id="limit-order-currency-output"
              /> */}
            </div>

            <Row
              style={{ justifyContent: !trade ? "center" : "space-between" }}
            >
              {Trade ? (
                <RowFixed>
                  {/* Current Market Rate */}
                  <TradePrice
                    price={trade?.executionPrice}
                    showInverted={showInverted}
                    setShowInverted={setShowInverted}
                  />
                  <MouseoverTooltipContent content={
                  <AdvancedSwapDetails allowedSlippage={new Percent(50, 10_000)} />
                  }>
                    <StyledInfo />
                  </MouseoverTooltipContent>
                </RowFixed>
              ) : null}
            </Row>

            <BottomGrouping>
              {swapIsUnsupported ? (
                <ButtonPrimary disabled={true}>
                  <TYPE.Main mb="4px">Unsupported Asset</TYPE.Main>
                </ButtonPrimary>
              ) : 
              routeNotFound && isLoadingRoute ? (
                <Card style={{ textAlign: "center" }}>
                  <TYPE.Main mb="4px">
                    <Dots>Loading</Dots>
                  </TYPE.Main>
                </Card>
              ) : showApproveFlow ? (
                <AutoRow style={{ flexWrap: "nowrap", width: "100%" }}>
                  <AutoColumn style={{ width: "100%" }} gap="12px">
                    <ButtonConfirmed
                      onClick={handleApprove}
                      disabled={
                        approvalState !== ApprovalState.NOT_APPROVED ||
                        approvalSubmitted
                      }
                      width="100%"
                      altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
                      confirmed={approvalState === ApprovalState.APPROVED}
                    >
                      <AutoRow
                        justify="space-between"
                        style={{ flexWrap: "nowrap" }}
                      >
                        <span style={{ display: "flex", alignItems: "center" }}>
                          <CurrencyLogo
                            currency={currencies.input}
                            size={"20px"}
                            style={{ marginRight: "8px", flexShrink: 0 }}
                          />
                          {/* we need to shorten this string on mobile */}
                          {approvalState === ApprovalState.APPROVED
                            ? `${currencies.input?.symbol} Allowed.`
                            : `Approve
                              ${currencies.input?.symbol}.`}
                        </span>
                        {approvalState === ApprovalState.PENDING ||
                        (approvalSubmitted &&
                          approvalState === ApprovalState.NOT_APPROVED) ? (
                          <Loader stroke="white" />
                        ) : approvalSubmitted &&
                          approvalState === ApprovalState.APPROVED ? (
                          <CheckCircle size="20" 
                          color={green1} 
                          />
                        ) : (
                          <MouseoverTooltip
                            text={`You must give the Gelato Limit Orders smart contracts
                                permission to use your 
                                ${currencies.input?.symbol}. You only have to do
                                this once per token.`}
                          >
                            <HelpCircle
                              size="20"
                              color={"white"}
                              style={{ marginLeft: "8px" }}
                            />
                          </MouseoverTooltip>
                        )}
                      </AutoRow>
                    </ButtonConfirmed>
                    <ButtonError
                      onClick={() => {
                        setSwapState({
                          tradeToConfirm: trade,
                          attemptingTxn: false,
                          swapErrorMessage: undefined,
                          showConfirm: true,
                          txHash: undefined,
                        });
                      }}
                      id="limit-order-button"
                      disabled={
                        !isValid || approvalState !== ApprovalState.APPROVED
                      }
                      error={false}
                    >
                      <Text fontSize={20} fontWeight={500}>
                        {inputError ? inputError : `Place Order`}
                      </Text>
                    </ButtonError>
                  </AutoColumn>
                </AutoRow>
              ) : (
                <ButtonError
                  onClick={() => {
                    setSwapState({
                      tradeToConfirm: trade,
                      attemptingTxn: false,
                      swapErrorMessage: undefined,
                      showConfirm: true,
                      txHash: undefined,
                    });
                  }}
                  id="limit-order-button"
                  disabled={!isValid}
                  error={false}
                >
                  <Text fontSize={20} fontWeight={500}>
                    {inputError ? inputError : `Place Order`}
                  </Text>
                </ButtonError>
              )}
              {swapErrorMessage && isValid ? (
                <SwapCallbackError error={swapErrorMessage} />
              ) : null}
            </BottomGrouping>
          </AutoColumn>
        </Wrapper>
      </AppBody>

      {!swapIsUnsupported ? null : (
        <UnsupportedCurrencyFooter
          show={swapIsUnsupported}
          currencies={[currencies.input, currencies.output]}
        />
      )}
    </Fragment>
  );
}
function dispatch(arg0: any): void {
  throw new Error("Function not implemented.");
}

