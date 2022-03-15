import { Currency, Percent } from "sdk";
import React, { useMemo } from "react";
import { Rate } from "state/order/actions";
import { TYPE } from "../../theme";

const red1 = "#FD4040"
const green1 = "#27AE60" 
const text4 = "#565A69"


export function RatePercentage({
  priceImpact,
  rateType,
  inputCurrency,
  outputCurrency,
}: {
  priceImpact?: Percent;
  rateType?: Rate;
  inputCurrency?: Currency | null;
  outputCurrency?: Currency | null;
}) {
  const priceImpactColor = useMemo(() => {
    if (!priceImpact) return undefined;

    const pi = rateType === Rate.MUL ? priceImpact : priceImpact?.multiply(-1);

    if (pi.equalTo("0")) return text4;
    if (pi.greaterThan("0")) return green1;
    return red1;
  }, [priceImpact, rateType, green1, red1, text4]);

  return (
    <TYPE.Body fontSize={12} color={text4}>
      {priceImpact ? (
        <span style={{ color: priceImpactColor }}>
          {rateType === Rate.MUL
            ? `Sell ${inputCurrency?.symbol ?? "-"} ${priceImpact.toSignificant(
                3
              )}% ${priceImpact.lessThan("0") ? "below" : "above"} market`
            : `Buy ${outputCurrency?.symbol ?? "-"} ${priceImpact
                .multiply(-1)
                .toSignificant(3)}% ${
                priceImpact.lessThan("0") ? "above" : "below"
              } market`}
        </span>
      ) : (
        "-"
      )}
    </TYPE.Body>
  );
}
