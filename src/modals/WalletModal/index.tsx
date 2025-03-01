import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import AccountDetails from 'components/AccountDetails'
import { Button } from 'components/Button'
import ExternalLink from 'components/ExternalLink'
import HeadlessUiModal from 'components/Modal/HeadlessUIModal'
import Typography from 'components/Typography'
import { injected, SUPPORTED_WALLETS } from 'config/wallets'
import { OVERLAY_READY } from 'entities/connectors/FortmaticConnector'
import usePrevious from 'hooks/usePrevious'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useWalletModalToggle } from 'state/application/hooks'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import ReactGA from 'react-ga'

import Option from './Option'
import PendingView from './PendingView'
import { useActiveWeb3React } from 'services/web3'

enum WALLET_VIEWS {
  OPTIONS,
  ACCOUNT,
  PENDING,
}

interface WalletModal {
  pendingTransactions: string[] // hashes of pending
  confirmedTransactions: string[] // hashes of confirmed
  ENSName?: string
}

const WalletModal: FC<WalletModal> = ({ pendingTransactions, confirmedTransactions, ENSName }) => {
  const { active, account, connector, activate, error, deactivate } = useWeb3React()
  const { i18n } = useLingui()
  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)
  const [pendingWallet, setPendingWallet] = useState<{ connector?: AbstractConnector; id: string }>()
  const [pendingError, setPendingError] = useState<boolean>()
  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useWalletModalToggle()
  const previousAccount = usePrevious(account)
  const activePrevious = usePrevious(active)
  const connectorPrevious = usePrevious(connector)
  const { chainId } = useActiveWeb3React()

  // close on connection, when logged out before
  useEffect(() => {
    if (account && !previousAccount && walletModalOpen) toggleWalletModal()
  }, [account, previousAccount, toggleWalletModal, walletModalOpen])

  // always reset to account view
  useEffect(() => {
    if (walletModalOpen) {
      setPendingError(false)
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [walletModalOpen])

  useEffect(() => {
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious && !error))) {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [setWalletView, active, error, connector, walletModalOpen, activePrevious, connectorPrevious])

  // close wallet modal if Fortmatic modal is active
  useEffect(() => {
    if (connector?.constructor?.name === 'FormaticConnector') {
      connector.on(OVERLAY_READY, () => {
        toggleWalletModal()
      })
    }
  }, [toggleWalletModal, connector])

  const handleBack = useCallback(() => {
    setPendingError(undefined)
    setWalletView(WALLET_VIEWS.ACCOUNT)
  }, [])

  const handleDeactivate = useCallback(() => {
    deactivate()
    setWalletView(WALLET_VIEWS.ACCOUNT)
  }, [deactivate])

  const tryActivation = useCallback(
    async (connector: (() => Promise<AbstractConnector>) | AbstractConnector | undefined, id: string) => {
      let name = ''
      let conn = typeof connector === 'function' ? await connector() : connector

      Object.keys(SUPPORTED_WALLETS).map((key) => {
        if (connector === SUPPORTED_WALLETS[key].connector) {
          return (name = SUPPORTED_WALLETS[key].name)
        }
        return true
      })
      // log selected wallet
      ReactGA.event({
        category: 'Wallet',
        action: 'Change Wallet',
        label: name,
      })
      setPendingWallet({ connector: conn, id }) // set wallet for pending view
      setWalletView(WALLET_VIEWS.PENDING)

      // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
      if (conn instanceof WalletConnectConnector && conn.walletConnectProvider?.wc?.uri) {
        conn.walletConnectProvider = undefined
      }

      conn &&
        activate(conn, undefined, true).catch((error) => {
          if (error instanceof UnsupportedChainIdError) {
            // @ts-ignore TYPE NEEDS FIXING
            activate(conn) // a little janky...can't use setError because the connector isn't set
          } else {
            setPendingError(true)
          }
        })
    },
    [activate]
  )

  // get wallets user can switch too, depending on device/browser
  const options = useMemo(() => {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask
    return Object.keys(SUPPORTED_WALLETS).map((key) => {
      const option = SUPPORTED_WALLETS[key]

      // check for mobile options
      if (isMobile) {
        // disable portis on mobile for now
        if (option.name === 'Portis') {
          return null
        }

        if
          (
          !window.web3 && !window.ethereum &&
          option.mobile
        ) {
          return (
            <Option
              onClick={() => tryActivation(option.connector, key)}
              id={`connect-${key}`}
              key={key}
              active={option.connector && option.connector === connector}
              link={option.href}
              header={option.name}
              subheader={null}
              icon={'/images/wallets/' + option.iconName}
            />
          )
        }
        return null
      }

      // overwrite injected when needed
      if (option.connector === injected) {
        // don't show injected if there's no injected provider
        if (!(window.web3 || window.ethereum)) {
          if (option.name === 'MetaMask') {
            return (
              <Option
                id={`connect-${key}`}
                key={key}
                header={'Install Metamask'}
                subheader={null}
                link={'https://metamask.io/'}
                icon="/images/wallets/metamask.png"
              />
            )
          }
          else {
            return null // dont want to return install twice
          }
        }
        // don't return metamask if injected provider isn't metamask
        else if (option.name === 'MetaMask'
          && !isMetamask
        ) {
          return null
        }
        // likewise for generic
        else if (option.name === 'Injected'
          && isMetamask
        ) {
          return null
        }
      }

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly && (
          <Option
            id={`connect-${key}`}
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && tryActivation(option.connector, key)
            }}
            key={key}
            active={option.connector === connector}
            link={option.href}
            header={option.name}
            subheader={null} // use option.descriptio to bring back multi-line
            icon={'/images/wallets/' + option.iconName}
          />
        )
      )
    })
  }, [connector, tryActivation])

  return (
    <HeadlessUiModal.Controlled isOpen={walletModalOpen}
      chainId={chainId}
      onDismiss={toggleWalletModal} maxWidth="md">
      {error ? (
        <div className="flex flex-col gap-4">
          <HeadlessUiModal.Header
            onClose={toggleWalletModal}
            header={error instanceof UnsupportedChainIdError ? i18n._(t`Wrong Network`) : i18n._(t`Error connecting`)}
          />
          <HeadlessUiModal.BorderedContent>
            <Typography variant="xs" weight={700}>
              {error instanceof UnsupportedChainIdError
                ? i18n._(t`Please connect to the appropriate network.`)
                : i18n._(t`Error connecting. Try refreshing the page.`)}
            </Typography>
          </HeadlessUiModal.BorderedContent>
          <Button color="red" onClick={handleDeactivate}>
            {i18n._(t`Disconnect`)}
          </Button>
        </div>
      ) : account && walletView === WALLET_VIEWS.ACCOUNT ? (
        <AccountDetails
          toggleWalletModal={toggleWalletModal}
          pendingTransactions={pendingTransactions}
          confirmedTransactions={confirmedTransactions}
          ENSName={ENSName}
          openOptions={() => setWalletView(WALLET_VIEWS.OPTIONS)}
        />
      ) : (
        <div className="flex flex-col w-full space-y-4">
          <HeadlessUiModal.Header
            header={i18n._(t`Select Wallet`)}
            onClose={toggleWalletModal}
            {...(walletView !== WALLET_VIEWS.ACCOUNT && { onBack: handleBack })}
          />
          {walletView === WALLET_VIEWS.PENDING ? (
            <PendingView
              id={pendingWallet.id}
              connector={pendingWallet.connector}
              header={''}
              subheader={''}
            // error={pendingError}
            // setPendingError={setPendingError}
            // tryActivation={tryActivation}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">{options}</div>
          )}
          <div className="flex justify-center">
            <Typography variant="xs" className="text-secondary" component="span">
              {i18n._(t`New to Fantom?`)}{' '}
              <Typography variant="xs" className="text-blue" component="span">
                <ExternalLink href="https://docs.fantom.foundation/tutorials/set-up-metamask/" color="blue">
                  {i18n._(t`Learn About Wallets`)}
                </ExternalLink>
              </Typography>
            </Typography>
          </div>
        </div>
      )}
    </HeadlessUiModal.Controlled>
  )
}

export default WalletModal