import { createAction } from '@reduxjs/toolkit'
import { LeverageType } from 'sdk/enums/TradeType'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export const updateLeverageType = createAction<{ leverageType: LeverageType }>('swap/updateLeverageType')

export const selectCurrency = createAction<{
  field: Field
  currencyId: string
}>('swap/selectCurrency')
export const switchCurrencies = createAction<void>('swap/switchCurrencies')
export const typeInput = createAction<{ field: Field; typedValue: string }>('swap/typeInput')
export const replaceSwapState = createAction<{
  field: Field
  typedValue: string
  inputCurrencyId?: string
  outputCurrencyId?: string
  recipient?: string | null
}>('swap/replaceSwapState')
export const setRecipient = createAction<{ recipient: string | null}>('swap/setRecipient')