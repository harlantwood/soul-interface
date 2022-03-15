import { Currency, CurrencyAmount, Percent } from "sdk";
import { warningSeverity } from "functions/prices";
import React, { useMemo } from "react";
import { TYPE } from "../../theme";
// import { warningSeverity } from "utils/prices";
// import HoverInlineText from "../HoverInlineText";

const black = "#FFFFFF"
export function FiatValue({
  fiatValue,
  priceImpact,
}: {
  fiatValue: CurrencyAmount<Currency> | null | undefined;
  priceImpact?: Percent;
}) {
  const priceImpactColor = useMemo(() => {
    if (!priceImpact) return undefined;
    if (priceImpact.lessThan("0")) return black;
    const severity = warningSeverity(priceImpact);
    if (severity < 1) return black;
    if (severity < 3) return black;
    return black;
  }, [priceImpact, black]);

  return (
    <TYPE.Body fontSize={14} color={fiatValue ? black : black}>
      {fiatValue ? "~" : ""}$
          {fiatValue ? fiatValue?.toSignificant(6, { groupSeparator: "," }) : "-"}
      {priceImpact ? (
        <span style={{ color: priceImpactColor }}>
          {" "}
          ({priceImpact.multiply(-1).toSignificant(3)}%)
        </span>
      ) : null}
    </TYPE.Body>
  );
}
