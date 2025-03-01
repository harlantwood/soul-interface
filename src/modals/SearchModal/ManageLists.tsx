import { CheckIcon, ExternalLinkIcon } from '@heroicons/react/outline'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { TokenList } from '@uniswap/token-lists'
import CloseIcon from 'components/CloseIcon'
import ListLogo from 'components/ListLogo'
import { HeadlessUiModal } from 'components/Modal'
import Popover from 'components/Popover'
import Switch from 'components/Switch'
import Typography from 'components/Typography'
import { UNSUPPORTED_LIST_URLS } from 'constants/token-lists'
import { classNames } from 'functions'
import { uriToHttp } from 'functions/convert'
import { parseENSAddress } from 'functions/ens'
import { listVersionLabel } from 'functions/list'
import { useFetchListCallback } from 'hooks/useFetchListCallback'
import { useCurrencyModalContext } from 'modals/SearchModal/CurrencySearchModal'
import { AppDispatch, AppState } from 'state'
import { acceptListUpdate, disableList, enableList, removeList } from 'state/lists/actions'
import { useActiveListUrls, useAllLists, useIsListActive } from 'state/lists/hooks'
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Settings } from 'react-feather'
import ReactGA from 'react-ga'
import { useDispatch, useSelector } from 'react-redux'

import CurrencyModalView from './CurrencyModalView'
import { useActiveWeb3React } from 'services/web3'

const listUrlRowHTMLId = (listUrl: string) => {
  return `list-row-${listUrl.replace(/\./g, '-')}`
}

const ListRow: FC<{ listUrl: string }> = memo(({ listUrl }) => {
  const { i18n } = useLingui()
  const listsByUrl = useSelector<AppState, AppState['lists']['byUrl']>((state) => state.lists.byUrl)
  const dispatch = useDispatch<AppDispatch>()
  const { current: list, pendingUpdate: pending } = listsByUrl[listUrl]
  const isActive = useIsListActive(listUrl)

  const handleAcceptListUpdate = useCallback(() => {
    if (!pending) return
    ReactGA.event({
      category: 'Lists',
      action: 'Update List from List Select',
      label: listUrl,
    })
    dispatch(acceptListUpdate(listUrl))
  }, [dispatch, listUrl, pending])

  const handleRemoveList = useCallback(() => {
    ReactGA.event({
      category: 'Lists',
      action: 'Start Remove List',
      label: listUrl,
    })
    if (window.prompt(`Please confirm you would like to remove this list by typing REMOVE`) === `REMOVE`) {
      ReactGA.event({
        category: 'Lists',
        action: 'Confirm Remove List',
        label: listUrl,
      })
      dispatch(removeList(listUrl))
    }
  }, [dispatch, listUrl])

  const handleEnableList = useCallback(() => {
    ReactGA.event({
      category: 'Lists',
      action: 'Enable List',
      label: listUrl,
    })
    dispatch(enableList(listUrl))
  }, [dispatch, listUrl])

  const handleDisableList = useCallback(() => {
    ReactGA.event({
      category: 'Lists',
      action: 'Disable List',
      label: listUrl,
    })
    dispatch(disableList(listUrl))
  }, [dispatch, listUrl])

  if (!list) return null

  return (
    <div
      id={listUrlRowHTMLId(listUrl)}
      className={classNames(
        isActive ? 'text-high-emphesis' : 'text-primary',
        'flex justify-between p-4 hover:bg-dark-800/40'
      )}
      key={listUrl}
    >
      <div className="flex gap-3">
        {list.logoURI && <ListLogo size="40px" logoURI={list.logoURI} alt={`${list.name} list logo`} />}
        <div className="flex flex-col">
          <Typography
            weight={700}
            className={classNames(isActive ? 'text-white' : 'text-primary', 'overflow-hidden overflow-ellipsis')}
          >
            {list.name}{' '}
            <Typography variant="xs" weight={700} component="span">
              {listVersionLabel(list.version)}
            </Typography>
          </Typography>
          <div className="flex gap-1 items-center">
            <Typography variant="xs" className="text-white">
              {i18n._(t`${list.tokens.length} tokens`)}
            </Typography>
            {/* <Popover
              placement="bottom-start"
              content={
                <div className="flex flex-col gap-1 border rounded shadow bg-dark-900 border-dark-700 p-3">
                  <a href={`https://tokenlists.org/token-list?url=${listUrl}`}>
                    <Typography variant="sm" weight={700} className="text-blue flex items-center gap-1">
                      {i18n._(t`View list`)}
                      <ExternalLinkIcon width={16} />
                    </Typography>
                  </a>
                  <Typography
                    role="button"
                    variant="sm"
                    weight={700}
                    onClick={handleRemoveList}
                    disabled={Object.keys(listsByUrl).length === 1}
                    className="hover:text-white cursor-pointer disabled:cursor-default"
                  >
                    {i18n._(t`Remove list`)}
                  </Typography>
                  <Typography
                    role="button"
                    variant="sm"
                    weight={700}
                    onClick={handleAcceptListUpdate}
                    className="hover:text-white cursor-pointer disabled:cursor-default"
                  >
                    {i18n._(t`Update list`)}
                  </Typography>
                </div>
              }
            >
              <Settings size={12} className="text-high-emphesis cursor-pointer hover:text-white" />
            </Popover> */}
          </div>
        </div>
      </div>
      <div>
        <Switch
          checked={isActive}
          onChange={() => (isActive ? handleDisableList() : handleEnableList())}
          checkedIcon={<CheckIcon className="text-dark-700" />}
          uncheckedIcon={<CloseIcon />}
          color="gradient"
        />
      </div>
    </div>
  )
})

const ManageLists: FC = () => {
  const { i18n } = useLingui()
  const { chainId } = useActiveWeb3React()
  const { setView, setImportList, setListUrl } = useCurrencyModalContext()
  const [listUrlInput, setListUrlInput] = useState<string>('')
  const lists = useAllLists()
  const activeListUrls = useActiveListUrls()
  const [activeCopy, setActiveCopy] = useState<string[] | undefined>()
  const fetchList = useFetchListCallback(chainId)
  const [tempList, setTempList] = useState<TokenList>()
  const [addError, setAddError] = useState<string | undefined>()

  useEffect(() => {
    if (!activeCopy && activeListUrls) {
      setActiveCopy(activeListUrls)
    }
  }, [activeCopy, activeListUrls])

  const handleInput = useCallback((e) => {
    setListUrlInput(e.target.value)
  }, [])

  const validUrl: boolean = useMemo(() => {
    return uriToHttp(listUrlInput).length > 0 || Boolean(parseENSAddress(listUrlInput))
  }, [listUrlInput])

  const sortedLists = useMemo(() => {
    const listUrls = Object.keys(lists)
    return listUrls
      .filter((listUrl) => {
        // only show loaded lists, hide unsupported lists
        return Boolean(lists[listUrl].current) && !UNSUPPORTED_LIST_URLS.includes(listUrl)
      })
      .sort((u1, u2) => {
        const { current: l1 } = lists[u1]
        const { current: l2 } = lists[u2]

        // first filter on active lists
        if (activeCopy?.includes(u1) && !activeCopy?.includes(u2)) {
          return -1
        }
        if (!activeCopy?.includes(u1) && activeCopy?.includes(u2)) {
          return 1
        }

        if (l1 && l2) {
          return l1.name.toLowerCase() < l2.name.toLowerCase()
            ? -1
            : l1.name.toLowerCase() === l2.name.toLowerCase()
            ? 0
            : 1
        }
        if (l1) return -1
        if (l2) return 1
        return 0
      })
  }, [lists, activeCopy])

  useEffect(() => {
    async function fetchTempList() {
      fetchList(listUrlInput, false)
        .then((list) => setTempList(list))
        .catch(() => setAddError('Error importing list'))
    }
    // if valid url, fetch details for card
    if (validUrl) {
      fetchTempList()
    } else {
      setTempList(undefined)
      listUrlInput !== '' && setAddError('Enter valid list location')
    }

    // reset error
    if (listUrlInput === '') {
      setAddError(undefined)
    }
  }, [fetchList, listUrlInput, validUrl])

  // check if list is already imported
  const isImported = Object.keys(lists).includes(listUrlInput)

  // set list values and have parent modal switch to import list view
  const handleImport = useCallback(() => {
    if (!tempList) return
    setImportList(tempList)
    setView(CurrencyModalView.importList)
    setListUrl(listUrlInput)
  }, [listUrlInput, setImportList, setListUrl, setView, tempList])

  return (
    <>
      <input
        id="list-add-input"
        type="text"
        placeholder="https:// or ipfs:// or ENS name"
        className="w-full bg-[rgba(0,0,0,0.2)] border border-dark-800 focus:border-blue rounded placeholder-secondary font-bold text-base p-4 appearance-none"
        value={listUrlInput}
        onChange={handleInput}
        title="List URI"
        autoComplete="off"
        autoCorrect="off"
      />
      {addError ? (
        <Typography
          variant="sm"
          weight={700}
          title={addError}
          className="overflow-hidden text-red text-ellipsis text-center h-9"
        >
          {addError}
        </Typography>
      ) : null}
      {tempList && !addError && (
        <HeadlessUiModal.BorderedContent
          className={classNames(
            isImported ? 'pointer-events-none' : 'hover:border-blue cursor-pointer',
            'flex flex-col gap-4'
          )}
          onClick={handleImport}
        >
          {isImported && (
            <Typography variant="xs" weight={700} className="text-green">
              {i18n._(t`Already imported`)}
            </Typography>
          )}
          <div className="flex justify-between">
            <div className="flex gap-3">
              {tempList?.logoURI && (
                <ListLogo size="40px" logoURI={tempList.logoURI} alt={`${tempList.name} list logo`} />
              )}
              <div className="flex flex-col">
                <Typography weight={700} className={classNames('text-primary overflow-hidden overflow-ellipsis')}>
                  {tempList?.name}{' '}
                  {tempList && (
                    <Typography variant="xs" weight={700} component="span">
                      {listVersionLabel(tempList.version)}
                    </Typography>
                  )}
                </Typography>
                <div className="flex gap-1 items-center">
                  <Typography variant="xs" className="text-white">
                    {i18n._(t`${tempList?.tokens.length} tokens`)}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </HeadlessUiModal.BorderedContent>
      )}
      <div className="h-full overflow-y-auto bg-[rgba(0,0,0,0.2)] border border-dark-800 rounded overflow-hidden">
        <div className="flex flex-col flex-1 flex-grow divide-y divide-dark-800">
          {sortedLists.map((listUrl) => (
            <ListRow key={listUrl} listUrl={listUrl} />
          ))}
        </div>
      </div>
    </>
  )
}

export default ManageLists
