import { SwapOutlined } from '@ant-design/icons'
import { useWeb3React } from '@web3-react/core'
import { Col, Input, Row, Tooltip } from 'antd'
import { RefSelectProps } from 'antd/lib/select'
import BigNumber from 'bignumber.js'
import AssetInput from 'components/AssetInput'
import { Button } from 'components/Button'
import Web3Connect from 'components/Web3Connect'
import Web3Network from 'components/Web3Network'
import { ChainType } from 'constants/crosschain/chain'
import { CHAINS } from 'features/cross/chains'
import { classNames } from 'functions/styling'
import React, { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { useActiveWeb3React } from 'services/web3'
import Modal from "components/DefaultModal";
import Image from "next/image";
import { Chain, ChainKey, CoinKey, Token, TokenAmount, TokenWithAmounts } from '../types'
// import ChainSelect from './ChainSelect'
// import TokenSelect from './TokenSelect'
import { getInjectedConnector } from './web3/connectors'
import ChainSelect from './ChainSelect'

interface SwapFormProps {
  depositChain?: ChainKey
  setDepositChain: Function
  depositToken?: string
  setDepositToken: Function
  depositAmount: BigNumber
  setDepositAmount: Function

  withdrawChain?: ChainKey
  setWithdrawChain: Function
  withdrawToken?: string
  setWithdrawToken: Function
  withdrawAmount: BigNumber
  setWithdrawAmount: Function
  estimatedWithdrawAmount: string
  estimatedMinWithdrawAmount?: string

  availableChains: Array<Chain>
  tokens: { [ChainKey: string]: Array<TokenWithAmounts> }
  balances: { [ChainKey: string]: Array<TokenAmount> } | undefined
  allowSameChains?: boolean
  forceSameToken?: boolean
  fixedWithdraw?: boolean
  alternativeToSection?: ReactElement

  fromSectionDesignator?: string
  toSectionDesignator?: string
}

const SwapForm = ({
  depositChain,
  setDepositChain,

  depositToken,
  setDepositToken,
  depositAmount,
  setDepositAmount,

  withdrawChain,
  setWithdrawChain,
  withdrawToken,
  setWithdrawToken,
  withdrawAmount,
  setWithdrawAmount,
  estimatedWithdrawAmount,
  estimatedMinWithdrawAmount,

  availableChains,
  tokens,
  balances,
  allowSameChains,
  forceSameToken,
  fixedWithdraw,
  alternativeToSection,

  fromSectionDesignator,
  toSectionDesignator,
}: SwapFormProps) => {
  const depositSelectRef = useRef<RefSelectProps>()
  const withdrawSelectRef = useRef<RefSelectProps>()
  const [depositAmountString, setDepositAmountString] = useState<string>('')
  const { chainId } = useActiveWeb3React()
  const [showSelectFrom, setShowSelectFrom] = useState(false);
  const [showSelectTo, setShowSelectTo] = useState(false);
  const [fromToken, setFromToken] = useState()
  const [fromChain, setFromChain] = useState(chainId)
  const [toToken, setToToken] = useState()
  const [toChain, setToChain] = useState(chainId)

  // Wallet
  const { activate } = useWeb3React()

  const connectWallet = async () => {
    activate(await getInjectedConnector())
  }

  const onChangeDepositChain = (chainKey: ChainKey) => {
    if (!allowSameChains && withdrawChain === chainKey) {
      setWithdrawChain(depositChain)
      setWithdrawToken(depositToken)
    }
    setDepositChain(chainKey)

    // find same deposit token
    if (depositChain) {
      const symbol = tokens[depositChain]?.find((token) => token.address === depositToken)?.symbol
      const tokenAddress = tokens[chainKey]?.find((token) => token.symbol === symbol)?.address
      setDepositToken(tokenAddress)
    }
  }

  const onChangeWithdrawChain = (chainKey: ChainKey) => {
    if (!allowSameChains && depositChain === chainKey) {
      setDepositChain(withdrawChain)
      setDepositToken(withdrawToken)
    }
    setWithdrawChain(chainKey)

    // find same withdraw token
    if (withdrawChain) {
      const symbol = tokens[withdrawChain].find((token) => token.address === withdrawToken)?.symbol
      const tokenAddress = tokens[chainKey].find((token) => token.symbol === symbol)?.address
      setWithdrawToken(tokenAddress)
    }
  }

  const getBalance = (chainKey: ChainKey, tokenAddress: string) => {
    if (!balances || !balances[chainKey]) {
      return new BigNumber(0)
    }

    const tokenBalance = balances[chainKey].find((portfolio) => portfolio.address === tokenAddress)

    return tokenBalance?.amount || new BigNumber(0)
  }

  const onChangeDepositToken = (tokenAddress: string) => {
    // unselect
    depositSelectRef?.current?.blur()

    if (!depositChain) return

    // connect
    if (tokenAddress === 'connect') {
      connectWallet()
      return
    }

    // set token
    setDepositToken(tokenAddress)
    const balance = new BigNumber(getBalance(depositChain, tokenAddress))
    if (balance.lt(depositAmount) && balance.gt(0)) {
      setDepositAmount(balance)
    }

    // set withdraw token?
    if (forceSameToken && withdrawChain) {
      const symbol = tokens[depositChain].find((token) => token.address === tokenAddress)?.symbol
      const withdrawToken = tokens[withdrawChain].find((token) => token.symbol === symbol)?.address
      setWithdrawToken(withdrawToken)
    }
  }

  const onChangeWithdrawToken = (tokenId: string) => {
    // unselect
    withdrawSelectRef?.current?.blur()

    // connect
    if (tokenId === 'connect') {
      connectWallet()
      return
    }

    // set token
    setWithdrawToken(tokenId)

    // set withdraw token?
    if (forceSameToken && depositChain && withdrawChain) {
      const symbol = tokens[withdrawChain].find((token) => token.address === tokenId)?.symbol
      const depositToken = tokens[depositChain].find((token) => token.symbol === symbol)?.address
      setDepositToken(depositToken)
    }
  }

  // sync depositAmountString if depositAmount changes
  useEffect(() => {
    if (!new BigNumber(depositAmountString).eq(depositAmount) && depositAmount.gte(0)) {
      setDepositAmountString(depositAmount.toFixed())
    }
  }, [depositAmount, depositAmountString])

  const onChangeDepositAmount = (amount: string) => {
    setDepositAmountString(amount)
    setDepositAmount(new BigNumber(amount))
    setWithdrawAmount(new BigNumber(Infinity))
  }
  const onChangeWithdrawAmount = (amount: BigNumber) => {
    setDepositAmount(new BigNumber(Infinity))
    setWithdrawAmount(amount)
  }
  const formatAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    return new BigNumber(e.currentTarget.value)
  }

  const setMaxDeposit = () => {
    if (depositToken && depositChain) {
      const selectedToken = tokens[depositChain].find((token) => token.address === depositToken)
      if (selectedToken && selectedToken.amount) {
        setDepositAmount(selectedToken.amount)
      }
    }
  }

  const changeDirection = () => {
    setWithdrawChain(depositChain)
    setDepositChain(withdrawChain)
    setWithdrawToken(depositToken)
    setDepositToken(withdrawToken)
  }

  const hasSufficientBalance = () => {
    if (!depositToken || !depositChain) {
      return true
    }
    return depositAmount.lte(getBalance(depositChain, depositToken))
  }

  return (
    <>
      <Row style={{ marginBottom: 8 }}>
        <Col span={10}>
          <div className="form-text">{fromSectionDesignator ? fromSectionDesignator : 'From:'}</div>
        </Col>
      </Row>

      <Row style={{ marginBottom: 8 }} gutter={[0, 0]}>
        <Col span={12}>
          <div className="form-input-wrapper chain-select">
            {/* <ChainSelect
              availableChains={availableChains}
              selectedChain={depositChain}
              onChangeSelectedChain={onChangeDepositChain}
            /> */}
                <Web3Network
                  // onSelect={async ()=> depositChain}
                  // onChange={async () => await onChangeDepositChain}
                />         
                </div>
        </Col>
        <Col span={12}>
          <div className="form-input-wrapper token-select">
            {/* <TokenSelect
              tokens={tokens}
              balances={balances}
              selectedChain={depositChain}
              selectedToken={depositToken}
              onChangeSelectedToken={onChangeDepositToken}
              selectReference={depositSelectRef}
              grayed={true}
            /> */}
            {showSelectFrom &&
        <div>
          <TokenSelect
                show={showSelectFrom}
                chain={ChainKey[fromChain]}
                onClose={f => {
                  setShowSelectFrom(false)
                  if (!f) {
                    return
                  }
                  setFromToken(fromToken)
                  setFromChain(fromChain)
                  // setAmount("")
                  // setBalance("")
                  // amountRef.current?.select()
                } }     
              />
        </div>
        }
          </div>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <div className="form-input-wrapper">
            <Input
              style={{ height: 50 }}
              type="number"
              defaultValue={0.0}
              min={0}
              step={0.000000000000000001}
              value={depositAmountString}
              onChange={(event) => onChangeDepositAmount(event.currentTarget.value)}
              placeholder="0.0"
              bordered={false}
              className={!hasSufficientBalance() ? 'insufficient' : ''}
            />
            <Button
              className="maxButton"
              type="text"
              disabled={!depositToken}
              onClick={() => setMaxDeposit()}>
              MAX
            </Button>
          </div>
        </Col>
      </Row>

      {/* Swap from <-> to button */}
      {!alternativeToSection ? (
        <Row style={{ marginTop: 32, marginBottom: 12 }} justify={'center'}>
          <SwapOutlined onClick={() => changeDirection()} />
        </Row>
      ) : (
        ''
      )}

      {/* "To" section*/}
      {!alternativeToSection ? (
        <>
          <Row style={{ marginBottom: 8 }}>
            <Col span={10}>
              <div className="form-text">{toSectionDesignator ? toSectionDesignator : 'To:'}</div>
            </Col>
          </Row>
          <Row gutter={[0, 0]} style={{ marginBottom: 8 }}>
            <Col span={12}>
              <div className="flex">
                <ChainSelect
                  // disabled={fixedWithdraw}
                  availableChains={availableChains}
                  selectedChain={withdrawChain}
                  onChangeSelectedChain={onChangeWithdrawChain}
                />
              </div>
            </Col>
            <Col span={12}>
              <div className="flex">
            {showSelectTo &&
             <TokenSelect
                show={showSelectTo}
                chain={ChainKey[toChain]}
                onClose={f => {
                  setShowSelectTo(false)
                  if (!f) {
                    return
                  }
                  setToToken(toToken)
                  setToChain(toChain)
                  // setAmount("")
                  // setBalance("")
                  // amountRef.current?.select()
                  } }     
                />
                }
              </div>
            </Col>
          </Row>

          <Row style={{ marginBottom: 8 }}>
            <Col span={24}>
              <div className="form-input-wrapper disabled">
                <Input
                  style={{ height: 50 }}
                  type="text"
                  defaultValue={0.0}
                  min={0}
                  value={estimatedWithdrawAmount}
                  // value={isFinite(withdrawAmount) ? withdrawAmount : ''}
                  onChange={(event) => onChangeWithdrawAmount(formatAmountInput(event))}
                  placeholder="..."
                  bordered={false}
                  disabled
                />
                {!!estimatedMinWithdrawAmount && (
                  <Tooltip
                    color={'gray'}
                    title={`The final amount might change due to slippage but will not fall below ${estimatedMinWithdrawAmount}`}>
                    <span className="amountBadge">?</span>
                  </Tooltip>
                )}
              </div>
            </Col>
          </Row>
        </>
      ) : (
        alternativeToSection
      )}
    </>
  )
}

interface TokenSelectProps {
  show: boolean;
  chain: Chain;
  onClose: (selection?: { token: Token; chain: Chain }) => void;
}

const TokenSelect: React.FC<TokenSelectProps> = ({ show, onClose, chain }) => {
  const [filter, setFilter] = useState("");
  const { chainId } = useActiveWeb3React()
  const [selectedChainId, setSelectedChainId] = useState(chainId);
  const selectedChain = useMemo(() => CHAINS.find(c => c.chainId === selectedChainId), [selectedChainId, CHAINS]);
  const input = useRef<HTMLInputElement>(null);
  const tokensList = useRef<HTMLDivElement>(null);
  const normalizedFilter = filter.trim().toLowerCase();
  const filteredTokens = selectedChain.tokens.filter(({ name, symbol, address }) => {
    const isNameMatch = name.toLowerCase().includes(normalizedFilter);
    const isSymbolMatch = symbol.toLowerCase().includes(normalizedFilter);
    const isAddressMatch = address.startsWith(normalizedFilter) || address.startsWith("0x" + normalizedFilter);
    return isNameMatch || isSymbolMatch || isAddressMatch;
  });
  const [isShowingChainSelect, showChainSelect] = useState(false);

  useEffect(() => {
    if (!show) {
      return;
    }

    input.current?.focus();

    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("keydown", escape);
    };
  }, [show]);

  useEffect(() => {
    if (!show) {
      setTimeout(() => {
        setFilter("");
        setSelectedChainId(selectedChain.chainId);
        showChainSelect(false);
        tokensList.current?.scrollTo({ top: 0 });
      }, 100);
    }
  }, [show]);

  return (
    <div className={'absolute top-20 left-0 w-[100vw] h-[0vh] z-[1000] opacity'
    } style={{ opacity: show ? 1 : 0, pointerEvents: show ? "unset" : "none" }}>
      <div className="absolute top-0 left-0 w-[100%] h-[100%]" onClick={() => onClose()} />
      <div className={classNames(show ? "absolute left-[15%] bottom-[10%] top-[50%] max-w-[28ch]" : 'hidden')}
        style={{ transform: `translate(-50%, calc(-50% + ${show ? 0 : 30}px))` }}
      >
        <div
          className={classNames(isShowingChainSelect ? "w-full h-full top-0 left-0 z-10 bg-dark-1100" : "hidden")}
        >

          {/* CHAIN SELECTION */}
          <Modal
            isOpen={isShowingChainSelect}
            onDismiss={() => onClose()}
            isCustom={true}
          >
            <div className="flex justify-center">
              {CHAINS.map((chain, i) => (
                <Button
                  key={chain.chainId}
                  onClick={() => {
                    setSelectedChainId(chain.chainId);
                    tokensList.current?.scrollTo({ top: 0 });
                    showChainSelect(false);
                    setFilter("");
                  }}
                  variant="bordered"
                  color="black"
                  className={classNames(chain.chainId === selectedChainId && `border border-2 border-white`, "flex border border-transparent hover:border-white align-center w-[100%]")}
                  style={{ backgroundColor: chain.color }}
                >
                  <div className={classNames('grid justify-center')}>
                    <Image src={chain.logo} width={'42'} height="42" alt={chain.name + ' logo'} />
                  </div>
                </Button>
              ))}
            </div>
          </Modal>
        </div>

        {/* TOKEN + CHAIN MODAL */}
        <div
          className="flex flex-cols border-radius-[8px] w-[100%] h-[100%] bg-dark-1100"
          style={{
            transform: isShowingChainSelect ? "translateY(50px)" : "",
            opacity: isShowingChainSelect ? 0 : 1,
            pointerEvents: show ? "all" : "none",
          }}
        >
          <Modal
            isOpen={true}
            isCustom={true}
            onDismiss={() => onClose()}
            borderColor={selectedChain?.color}
          >
            <div className="bg-dark-900 rounded padding-[10px]">
              <Button
                className="flex p-[10px] w-[100%] gap-[8px] align-center items-center"
                variant="bordered"
                color="black"
                style={{ backgroundColor: selectedChain.color }}
                onClick={() => showChainSelect(true)}
                onClose={()=>showChainSelect(false)}
              >
                <div className="grid grid-cols-1 w-[33%]">
                <Image 
                  src={selectedChain.logo} 
                  width="36" height="36" 
                  alt={selectedChain.name + ' logo'} 
                  className={"w-full justify-center"}
                />
                </div>
                <div style={{ flexGrow: 1, fontSize: "24px", textAlign: "center" }}>{selectedChain.name}</div>
              </Button>

              {/* SEARCH BAR */}
              {/* <form
                onSubmit={e => {
                  e.preventDefault();
                  onClose({ token: filteredTokens[0], chain: selectedChain });
                }}
              >
                <Input
                  ref={input}
                  className="w-[100%] border border-unset border-radius-[4px] text-black mb-2"
                  placeholder={`Search ${selectedChain.name} tokens`}
                  value={filter}
                  onChange={e => setFilter(e.currentTarget.value)}
                />
              </form> */}
              <div className="w-[100%] my-6" />


              {/* SELECT TOKEN LIST */}
              {/* {filter && */}
              <div className="grid grid-cols-4 bg-dark-1100 w-full" ref={tokensList}>
                {filteredTokens.map(token => (
                  <div className="flex border border-2 m-0.5 
                    border-dark-1000 p-1
                    rounded rounded-3xl bg-black font-bold 
                    text-center justify-center"
                    key={token.address} onClick={() => 
                    onClose({token: CoinKey[token.address], chain: ChainKey[selectedChain?.chainId] })}>
                    <Image src={token.logo} width="56" height="56" alt={token.name + ' logo'} /> 
                    </div>
                ))}
              </div>
              {/* } */}
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default SwapForm