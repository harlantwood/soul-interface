import React from 'react'
import { Switch } from '@headlessui/react'
import { classNames } from '../../functions'
import Image from 'next/image'
// import CROSSCHAIN from 'assets/icons/cross-chain.svg'
// import CROSSCHAIN from 'assets/icons/multi-cloud.png'
// import CROSSCHAIN from 'assets/icons/multi-btc.png'
import CROSSCHAIN from 'assets/icons/cross-the-chain.png'
import { getChainColorCode } from 'constants/chains'
import { useActiveWeb3React } from 'services/web3'

export interface ToggleProps {
  id?: string
  isActive: boolean
  optionA?: string
  optionB?: string
  toggle: () => void
}

export function Toggle({ id, isActive, toggle, optionA, optionB }: ToggleProps) {
  const { chainId } = useActiveWeb3React()
  return (
    <div className="flex flex-cols-2 gap-3">
      {!isActive && optionB}
      {isActive && optionA}
      <Switch
        checked={isActive}
        onChange={toggle}
        className={classNames(
          isActive ? `bg-${getChainColorCode(chainId)}` : 'bg-dark-600',
          'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none'
        )}
      >
        <span className="sr-only">Use Setting</span>
        <span
          className={classNames(
            isActive ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none relative inline-block h-5 w-5 rounded-full bg-dark-900 shadow transform ring-0 transition ease-in-out duration-200'
          )}
        >
          <span
            className={classNames(
              isActive ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200',
              'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            <svg className="w-3 h-3 text-low-emphesis" fill="none" viewBox="0 0 12 12">
              <path
                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span
            className={classNames(
              isActive ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100',
              'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            <svg className="w-3 h-3 text-high-emphesis" fill="currentColor" viewBox="0 0 12 12">
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
            </svg>
          </span>
        </span>
      </Switch>
    </div>
  )
}

export function CrossChainToggle({ id, isActive, toggle, optionA, optionB }: ToggleProps) {
  const { chainId } = useActiveWeb3React()
  return (
    <div className="flex justify-end mt-1">
      <Switch
        checked={isActive}
        onChange={toggle}
        className={classNames(
          isActive ? `bg-${getChainColorCode(chainId)}` : `bg-${getChainColorCode(chainId)}`,
          'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none'
        )}
      >
        <span
          className={classNames(
            isActive ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none relative inline-block h-5 w-5 rounded-full bg-dark-900 shadow transform ring-0 transition ease-in-out duration-200'
          )}
        >
          <span
            className={classNames(
              isActive ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200',
              'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            <svg className="w-3 h-3 text-low-emphesis" fill="none" viewBox="0 0 12 12">
              <path
                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

          </span>
          <span
            className={classNames(
              isActive ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100',
              'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            <svg className="w-3 h-3 text-high-emphesis" fill="currentColor" viewBox="0 0 12 12">
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
            </svg>
          </span>
        </span>
      </Switch>
    </div>
  )
}
