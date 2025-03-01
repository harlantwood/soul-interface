import {
  Currency,
  CurrencyAmount,
  Percent,
  TradeType,
} from "sdk";
import { Trade } from "sdk";
import React, { useCallback, useMemo, useState } from "react";
// import TransactionConfirmationModal, {
//   ConfirmationModalContent,
//   TransactionErrorContent,
// } from "../TransactionConfirmationModal";
import SwapModalFooter from "./SwapModalFooter";
import SwapModalHeader from "./SwapModalHeader";
import TransactionConfirmationModal, { ConfirmationModalContent, TransactionErrorContent } from "modals/TransactionConfirmationModal";

export default function ConfirmSwapModal({
  trade,
  onAcceptChanges,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  originalTrade,
  isOpen,
  attemptingTxn,
  txHash,
  inputAmount,
  outputAmount,
}: {
  isOpen: boolean;
  trade: Trade<Currency, Currency, TradeType> | undefined;
  originalTrade: Trade<Currency, Currency, TradeType> | undefined;
  attemptingTxn: boolean;
  txHash: string | undefined;
  recipient: string | null;
  allowedSlippage: Percent;
  onAcceptChanges: () => void;
  onConfirm: () => void;
  swapErrorMessage: string | undefined;
  onDismiss: () => void;
  inputAmount: CurrencyAmount<Currency> | undefined;
  outputAmount: CurrencyAmount<Currency> | undefined;
}) {
  // const showAcceptChanges = useMemo(
  //   () =>
  //     Boolean(
  //       trade instanceof Trade &&
  //         originalTrade instanceof Trade // &&
  //         // tradeMeaningfullyDiffers(trade, originalTrade)
  //     ),
  //   [originalTrade, trade]
  // );

  const [disclaimer, setDisclaimer] = useState<boolean>(false);
  const showAcceptChanges = false;

  const modalHeader = useCallback(() => {
    return (
      <SwapModalHeader
        trade={trade}
        recipient={recipient}
        showAcceptChanges={false}
        onAcceptChanges={onAcceptChanges}
        onDisclaimerChange={(value) => setDisclaimer(value)}
      />
    );
  }, [onAcceptChanges, recipient, trade]);

  const modalBottom = useCallback(() => {
    return (
      <SwapModalFooter
        onConfirm={onConfirm}
        trade={trade}
        disabledConfirm={!disclaimer}
        swapErrorMessage={swapErrorMessage}
      />
    );
  }, [onConfirm, disclaimer, swapErrorMessage, trade]);

  // text to show while loading
  const pendingText = `Submitting: ${inputAmount?.toSignificant(
    6
  )} ${inputAmount?.currency?.symbol} for ${outputAmount?.toSignificant(6)} ${
    outputAmount?.currency?.symbol
  }`;

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent
          onDismiss={onDismiss}
          message={swapErrorMessage}
        />
      ) : (
        <ConfirmationModalContent
          title="Confirm Order"
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onDismiss, modalBottom, modalHeader, swapErrorMessage]
  );

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
      currencyToAdd={trade?.outputAmount.currency}
    />
  );
}
