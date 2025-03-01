import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import HeadlessUiModal from 'components/Modal/HeadlessUIModal'
import Typography from 'components/Typography'
import React, { FC } from 'react'

// @ts-ignore TYPE NEEDS FIXING
const TransactionDetailsExplanationModal: FC = ({ children }) => {
  const { i18n } = useLingui()

  return (
    <HeadlessUiModal trigger={children}>
      {({ setOpen }) => (
        <div className="flex flex-col gap-4 lg:max-w-2xl">
          <HeadlessUiModal.Header header={i18n._(t`Transaction Details`)} onClose={() => setOpen(false)} />
          <HeadlessUiModal.BorderedContent className="flex flex-col gap-4 border-dark-800">
            <div className="flex flex-col gap-2">
              <Typography weight={700} variant="sm" className="text-high-emphesis">
                {i18n._(t`Minimum Received`)}
              </Typography>
              <Typography variant="sm">
                {i18n._(
                  t`The minimum amount you’ll receive from your transaction, or else the transaction will revert.`
                )}
              </Typography>
            </div>
            <div className="flex flex-col gap-2">
              <Typography weight={700} variant="sm" className="text-high-emphesis">
                {i18n._(t`Price Impact`)}
              </Typography>
              <Typography variant="sm">
                {i18n._(
                  t`The difference between market price and estimated price due to the proportional makeup of the assets deposited.`
                )}{' '}
              </Typography>
            </div>
          </HeadlessUiModal.BorderedContent>
          <HeadlessUiModal.BorderedContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Typography weight={700} variant="sm" className="text-high-emphesis">
                {i18n._(t`Liquidity Provider Fee`)}
              </Typography>
              <Typography variant="sm">{i18n._(t`0.25% of each swap goes to liquidity providers.`)}</Typography>
            </div>
            <div className="flex flex-col gap-2">
              <Typography weight={700} variant="sm" className="text-high-emphesis">
                {i18n._(t`Burn Fee`)}
              </Typography>
              <Typography variant="sm">{i18n._(t`0.055% of each swap goes to burning SOUL.`)} </Typography>
            </div>
            <div className="flex flex-col gap-2">
              <Typography weight={700} variant="sm" className="text-high-emphesis">
                {i18n._(t`Estimated Network Fee`)}
              </Typography>
              <Typography variant="sm">
                {i18n._(
                  t`This is our estimate of how much the gas cost for your transaction will be. Your wallet will give the true and final gas cost, which may be different from what is quoted.`
                )}
              </Typography>
            </div>
          </HeadlessUiModal.BorderedContent>
          <HeadlessUiModal.BorderedContent className="border-purple/60">
            <Typography variant="sm">
              {i18n._(
                t`Depositing with Zap Mode involves swapping your asset for the assets in the pool - this makes your transaction subject to swap-related fees.`
              )}
            </Typography>
          </HeadlessUiModal.BorderedContent>
        </div>
      )}
    </HeadlessUiModal>
  )
}

export default TransactionDetailsExplanationModal