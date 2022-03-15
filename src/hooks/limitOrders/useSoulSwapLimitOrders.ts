import useSoulSwapLimitOrdersHandlers, {
  SoulSwapLimitOrdersHandlers,
} from "./useSoulSwapLimitOrdersHandlers";
import {
  DerivedOrderInfo,
  useDerivedOrderInfo,
  useOrderState,
} from "state/order/hooks";
import { OrderState } from "state/order/reducer";

export default function useSoulSwapLimitOrders(): {
  handlers: SoulSwapLimitOrdersHandlers;
  derivedOrderInfo: DerivedOrderInfo;
  orderState: OrderState;
} {
  const derivedOrderInfo = useDerivedOrderInfo();

  const orderState = useOrderState();

  const handlers = useSoulSwapLimitOrdersHandlers();

  return {
    handlers,
    derivedOrderInfo,
    orderState,
  };
}
