import React, { useEffect, useMemo, useRef, useState, VFC } from "react";
import Row from "../../components/Row";
import { Button as ButtonComponent } from 'components/Button'
import Column, { AutoColumn } from "../../components/Column"
import { BigNumber as EthersBigNumber, ethers } from "ethers";

import { FANTOM, AVALANCHE, BINANCE, Chain, CHAINS, ETHEREUM, MOONRIVER, POLYGON, Token } from "features/crosschain/helpers/Chains";

import styled from "styled-components";
import {
  chainToNetworkInfoMap,
  supportedChainsForBridge,
  transactionStatusMapping,
} from "../../utils/bridge";
import DropDownButton from "../../components/DropDownButton";
import useBridgeApi from "../../hooks/useBridgeApi";
import useMultiChain from "../../hooks/useMultiChain";
import Modal from "./components/Modal";
// import ModalTitle from "./components/ModalTitle";
import ModalContent from "./components/ModalContent";
import Scrollbar from "../../components/Scrollbar";
import useModal from "../../hooks/useModal";
import InputCurrencyBox from "./components/InputCurrencyBox";
import { AddressZero } from "@ethersproject/constants";
import {
  formatSimpleValue,
  unitToWei,
  weiToUnit,
} from "../../utils/conversion";
import ierc20Abi from "constants/abis/soulswap/ERCs/IERC20.json";
import erc20Abi from "constants/abis/erc20.json";

import { formatAddress, loadERC20Contract } from "../../utils/wallet";
import useBridge from "../../hooks/useBridge";
import useSendTransaction from "../../hooks/useSendTransaction";
import useFantomERC20 from "../../hooks/useFantomERC20";
import DoubleGlowShadowV2 from "components/DoubleGlowShadowV2";
import { BigNumber } from "@ethersproject/bignumber";
import Loader from "../../components/Loader";
import FadeInOut from "../../components/AnimationFade";
import { ContentBox, OverlayButton, Typo1, Typo2, Typo3 } from "components/index";
import InputError from "components/Input/Error";
import { useActiveWeb3React } from "services/web3";
import { ArrowDownIcon, StarIcon } from "@heroicons/react/solid";
import Image from 'next/image'
import Typography from "components/Typography";
import HeaderNew from "features/trade/HeaderNew";
import Container from "components/Container";
// import NavLink from "components/NavLink";
import { formatNumber } from "functions/format";
import SDK, { BLOCKCHAIN_NAME, Configuration, CrossChainTrade, InstantTrade, InsufficientFundsError, InsufficientLiquidityError, WalletProvider } from "rubik-sdk";
import Exchange, { sleep } from "pages/multichain";
// import Exchange, { sleep } from "pages/multichain";
import { TokenSelect } from "./components/TokenSelect";
import { useUserInfo } from "hooks/useAPI";
import { Spinner } from "components/Spinner";
import { SwapButton } from "features/crosschain/Styles";
import { CheckCircle } from "react-feather";
// import { BridgeTokenList, BridgeTokenSelectModal } from "pages/bridge";

const RUBIC_CHAIN_BY_ID = new Map([
  [FANTOM.chainId, BLOCKCHAIN_NAME.FANTOM],
  [MOONRIVER.chainId, BLOCKCHAIN_NAME.MOONRIVER],
  [POLYGON.chainId, BLOCKCHAIN_NAME.POLYGON],
  [AVALANCHE.chainId, BLOCKCHAIN_NAME.AVALANCHE],
  [ETHEREUM.chainId, BLOCKCHAIN_NAME.ETHEREUM],
  [BINANCE.chainId, BLOCKCHAIN_NAME.BINANCE_SMART_CHAIN],
]);

const NATIVE_ADDRESS = "0x0000000000000000000000000000000000000000"


const ChainSelect: React.FC<any> = ({ selectChain, chains }) => {
  return (
    <ContentBox
      style={{
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "black",
        borderRadius: "8px",
        padding: "1rem",
      }}
    >
      <Column style={{ gap: "1rem" }}>
        {chains.map((chainId: number) => {
          return (
            <OverlayButton
              key={`select-${chainId}`}
              onClick={() => {
                selectChain(chainId);
              }}
            >
              <Row style={{ gap: "1rem", alignItems: "center" }}>                
                <Image
                  alt="chain logo"
                  height="30px"
                  width="30px"
                  src={chainToNetworkInfoMap[chainId].image}
                />
                <Typo2 style={{ fontWeight: "bold" }}>
                  {chainToNetworkInfoMap[chainId].name}
                </Typo2>
              </Row>
            </OverlayButton>
          );
        })}
      </Column>
    </ContentBox>
  );
};

const ChainSelector: React.FC<any> = ({
  text,
  chains,
  selected,
  selectChain,
}) => {
  return (
    <Column style={{ width: "100%" }}>
      <Typo2 style={{ color: "#84888d" }}>{text}</Typo2>
      <div />
      <DropDownButton
        width="100%"
        DropDown={() => ChainSelect({ selectChain, chains })}
        dropdownTop={65}
      >
        <ContentBox
          style={{
            boxSizing: "border-box",
            width: "100%",
            backgroundColor: "black",
            padding: "1rem",
          }}
        >
          <Row style={{ gap: "1rem", alignItems: "center" }}>
            <Image
              alt="chain logo"
              height="30px"
              width="30px"
              src={chainToNetworkInfoMap[selected].image}
            />
            <Typo2 style={{ fontWeight: "bold" }}>
              {chainToNetworkInfoMap[selected].name}
            </Typo2>
          </Row>
        </ContentBox>
      </DropDownButton>
    </Column>
  );
};

const ChainSelection: React.FC<any> = ({
  setTokenList,
  connectToChain,
  bridgeToChain,
}) => {
  const { chainId, account, connector, deactivate, library } = useActiveWeb3React()

  const [fromChain, setFromChain] = useState(250);
  const [toChain, setToChain] = useState(1);
  const { getBridgeTokens } = useBridgeApi();
  const { forceSwap, DEFAULT_PROVIDERS } = useMultiChain();

  const getBalance = async (address: string, provider: any) => {
    if (address === AddressZero || !address) {
      return provider.getBalance(account);
    }

    const contract = await loadERC20Contract(address, provider);
    return contract.balanceOf(account);
  };

  useEffect(() => {
    connectToChain(fromChain);
  }, [fromChain]);

  useEffect(() => {
    bridgeToChain(toChain);
  }, [toChain]);

  useEffect(() => {
    setTokenList(null);
    getBridgeTokens(toChain, fromChain)?.then((tokenList) => {
      if (tokenList?.length) {
        const tokenOrder = [
          "FTM",
          "WFTM",
          "USDC",
          "USDT",
          "fUSDT",
          "DAI",
          "MIM",
          "ETH",
          "WETH",
          "BTC",
          "WBTC",
          "MATIC",
          "AVAX",
          "BNB",
        ];
        if (tokenList?.length && account) {
          const stickyTokens = tokenOrder
            .map((symbol) => {
              return tokenList.find(
                (token: any) =>
                  token.symbol.toLowerCase() === symbol.toLowerCase()
              );
            })
            .filter((item: any) => item);
          const restOfTokens = tokenList.filter(
            (token: any) => !stickyTokens.includes(token)
          );

          const allTokens = [...stickyTokens, ...restOfTokens];
          const fromProvider = DEFAULT_PROVIDERS[fromChain];
          const toProvider = DEFAULT_PROVIDERS[toChain];
          const tokensAndBalances = allTokens.map((token) => {
            return {
              ...token,
              balance: getBalance(
                token.isNative === "true" ? AddressZero : token.ContractAddress,
                fromProvider
              ),
              balanceTo: getBalance(
                token.isNativeTo === "true"
                  ? AddressZero
                  : token.ContractAddressTo,
                toProvider
              ),
            };
          });
          setTokenList(tokensAndBalances);
        }
      }
    });
  }, [fromChain, toChain, account]);

  const handleSetFromChain = (chainId: number) => {
    if (chainId !== 250) {
      setToChain(250);
    }
    if (chainId === toChain) {
      setToChain(chainId === 250 ? 1 : 250);
    }
    setFromChain(chainId);
  };

/* // TODO: RE-ENABLE // */
const handleSetToChain = (chainId: number) => {
  // if (chainId !== 250) {
    setFromChain(250);
  // }
  // if (chainId === fromChain) {
    // setFromChain(chainId === 250 ? 1 : 250);
  // }
  // setToChain(chainId);
  // TODO: DELETE BELOW //
  setToChain(chainId == 250 ? 1 : chainId);
};

  const handleSwap = () => {
    const fromChainOld = fromChain;
    const toChainOld = toChain;

    setFromChain(toChainOld);
    setToChain(fromChainOld);
  };
  
  return (
    <Column>
    
  {/* // TODO: RE-ENABLE // */}
      <div className="flex">
        <ChainSelector
          selected={fromChain}
          selectChain={handleSetFromChain}
          chains={supportedChainsForBridge.filter(
            (chainId) => chainId !== fromChain
          )}
        />
        {chainId !== fromChain && (
          <>
            <div className="ml-2" />
            <ButtonComponent
              variant="outlined"
              color="purple"
              onClick={() => forceSwap(fromChain)}
            >
              <div className="ml-2 mr-2 text-white font-bold">
                {`${fromChain}`}
              </div>

            </ButtonComponent>
          </>
        )}
      </div>
      <div />
      <Row style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ height: "1px", width: "100%" }} />
          <OverlayButton style={{ padding: 0 }} onClick={handleSwap}>
              <AutoColumn justify="space-between" className="py-2 -my-4 py-4">
                  <div className="flex justify-center mt-2.5 mb-2.5 z-0">
                    <div
                      role="button"
                      className="p-1.5 rounded-full bg-dark-1000 border shadow-md border-dark-700 hover:border-dark-600"
                    >
                      <ArrowDownIcon width={14} className="text-high-emphesis hover:text-white" />
                    </div>
                  </div>
                </AutoColumn>
          </OverlayButton>
        <div style={{ height: "1px", width: "100%" }} />
      </Row>
      <div className="flex">
      <ChainSelector
        selected={toChain}
        selectChain={handleSetToChain}
        chains={supportedChainsForBridge.filter(
          (chainId) => chainId !== toChain
        )}
      />
      
      </div>
    </Column>
  );
};

const TokenSelector: React.FC<any> = ({ tokens, selected, selectToken }) => {

    const lastExchange = JSON.parse(localStorage.getItem("exchange"));
    if (!lastExchange) {
      return undefined;
    }

  const [from, setFrom] = useState<Token>(lastExchange.from?.token);
  const [to, setTo] = useState<Token>(lastExchange.to.token);
  const [fromChain, setFromChain] = useState<Chain>(lastExchange.from?.chain);
  const [toChain, setToChain] = useState<Chain>(lastExchange.to.chain);
  const { setToChain: connectToChain } = useMultiChain();
  const [showSelectTo, setShowSelectTo] = useState(false);
  const [showSelectFrom, setShowSelectFrom] = useState(false);

  const [onPresentSelectTokenModal] = useModal(
    // <BridgeTokenSelectModal tokens={tokens} selectToken={selectToken} />,
    <TokenSelect
        show={showSelectTo}
        chain={toChain}
        onClose={t => {
          setShowSelectTo(false);
          if (!t) {
            return;
          }
          setTo(t.token);
          setToChain(t.chain);
        }}
      />,
    "bridge-token-select-modal"
  );

  return (
    <Column style={{ width: "100%", flex: 1 }}>
      <OverlayButton
        style={{ padding: 0 }}
        disabled={!tokens || !tokens.length}
        onClick={() => tokens && tokens.length && onPresentSelectTokenModal()}
      >
        <ContentBox
          style={{
            boxSizing: "border-box",
            width: "100%",
            backgroundColor: "black",
            padding: "1rem",
            height: "64px",
          }}
        >
          <Row style={{ gap: "1rem", alignItems: "center" }}>
            {selected ? (
              <>
                <Image
                  alt="token logo"
                  height="30px"
                  width="30px"
                  src={selected.logoUrl}
                />
                <Typo2 style={{ fontWeight: "bold" }}>{selected.symbol}</Typo2>
              </>
            ) : tokens && tokens.length ? (
              <Typo1>Select Token </Typo1>
            ) : (
              <Loader />
            )}
          </Row>
        </ContentBox>
      </OverlayButton>
    </Column>
  );
};

interface CrossChain {
  from: { chain: Chain; token: Token };
  to: { chain: Chain; token: Token };
}
function getLastExchange(): CrossChain {
  const lastExchange = JSON.parse(localStorage.getItem("exchange"));
  if (!lastExchange) {
    return undefined;
  }

  const fromChain = CHAINS.find(c => c.chainId === lastExchange.from?.chain);
  const fromToken = fromChain?.tokens.find(t => t.id === lastExchange?.from?.token);
  const toChain = CHAINS.find(c => c.chainId === lastExchange.to.chain);
  const toToken = toChain?.tokens.find(t => t.id === lastExchange?.to.token);
  return { from: { chain: fromChain, token: fromToken }, to: { chain: toChain, token: toToken } };
}

const rubicConfiguration: Configuration = {
  rpcProviders: {
    [BLOCKCHAIN_NAME.BINANCE_SMART_CHAIN]: {
      mainRpc: BINANCE.rpc[0],
    },
    [BLOCKCHAIN_NAME.MOONRIVER]: {
      mainRpc: MOONRIVER.rpc[0],
    },
    [BLOCKCHAIN_NAME.POLYGON]: {
      mainRpc: POLYGON.rpc[0],
    },
    [BLOCKCHAIN_NAME.AVALANCHE]: {
      mainRpc: AVALANCHE.rpc[0],
    },
    [BLOCKCHAIN_NAME.ETHEREUM]: {
      mainRpc: ETHEREUM.rpc[0],
    },
    [BLOCKCHAIN_NAME.FANTOM]: {
      mainRpc: FANTOM.rpc[0],
    },
  },
};

const FTM = FANTOM.tokens.find(t => t.id === "fantom");
const DAI = FANTOM.tokens.find(t => t.id === "dai");
const DEFAULT_LOGO = 'https://raw.githubusercontent.com/soulswapfinance/assets/prod/blockchains/fantom/assets/0xe2fb177009FF39F52C0134E8007FA0e4BaAcBd07/logo.png'

const CrossChain: React.FC<any> = () => {
  const { chainId, account, connector, deactivate, library } = useActiveWeb3React()
  const { setToChain: connectToChain } = useMultiChain();
  const { bridgeStableMethod, bridgeNativeMethod, bridgeMethod } = useBridge();
  const { getTransactionStatus } = useBridgeApi();
  // const { transaction } = useTransaction();
  const { approve, getAllowance } = useFantomERC20();
  const [tokenList, setTokenList] = useState(null);
  const [isShowingChainSelect, showChainSelect] = useState(false);
  const [isShowingTokenSelect, showTokenSelect] = useState(false);

  const lastExchange = useMemo(() => {
    return getLastExchange() ?? { from: { chain: FANTOM, token: FTM }, to: { chain: FANTOM, token: DAI } };
  }, []);
  
  const [fromChain, setFromChain] = useState<Chain>(lastExchange.from?.chain);
  const [toChain, setToChain] = useState<Chain>(lastExchange.to.chain);

  const [selectedToken, setSelectedToken] = useState(null);
  const [isApproved, setIsApproved] = useState(true);
  const [amount, setAmount] = useState("");
  
  const [from, setFrom] = useState<Token>(lastExchange.from?.token);
  const [to, setTo] = useState<Token>(lastExchange.to.token);

  const [trade, setTrade] = useState<InstantTrade | CrossChainTrade | undefined>(undefined);
  const [canBuy, setCanBuy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [configuration, setConfiguration] = useState(rubicConfiguration);
  const [fromUsd, setFromUsd] = useState<string>();
  const [toUsd, setToUsd] = useState<string>();

  const [rubic, setRubic] = useState<SDK>(null);
  useEffect(() => {
    SDK.createSDK(configuration).then(setRubic);
  }, []);



  const [inputError, setInputError] = useState(null);
  const [bridgeTxHash, setBridgeTxHash] = useState(
    window.localStorage.getItem("BridgeTxHash")
  );
  const [bridgeStatus, setBridgeStatus] = useState(0)


  const {
    ContractAddress,
    symbol,
    Decimals,
    balance,
    MinimumSwap,
    MaximumSwap,
    type,
  } = selectedToken || {};

  const validateAmount = (amount: string) => {
    if (selectedToken && balance) {
      balance.then((resolvedBalance: BigNumber) => {
        if (
          resolvedBalance &&
          BigNumber.from(unitToWei(amount, Decimals)).gt(resolvedBalance)
        ) {
          return setInputError("Insufficient funds");
        }
        if (parseFloat(amount) < parseFloat(MinimumSwap)) {
          return setInputError("Below minimum amount");
        }
        if (parseFloat(amount) > parseFloat(MaximumSwap)) {
          return setInputError("Above maximum amount");
        }
        return setInputError(null);
      });
    }
  };

  const handleSetAmount = (value: string) => {
    validateAmount(value);
    setAmount(value);
  };

  useEffect(() => {
    if (!rubic) {
      return;
    }

    let disposed = false;
    async function run() {
      // Debouncing to avoid hitting CoinGecko and RPCs on every keystroke.
      await sleep(300 / 1000);

      if (disposed) {
        return;
      }

      try {
        const tradeRequest =
          fromChain?.chainId === toChain?.chainId
            ? rubic.instantTrades
                .calculateTrade(
                  {
                    blockchain: RUBIC_CHAIN_BY_ID.get(fromChain?.chainId),
                    address: from?.isNative ? NATIVE_ADDRESS : from?.address,
                  },
                  amount,
                  to.isNative ? NATIVE_ADDRESS : to.address,
                )
                .then((trades: InstantTrade[]): InstantTrade => trades[0])
            : rubic.crossChain.calculateTrade(
                {
                  address: from?.isNative ? NATIVE_ADDRESS : from?.address,
                  blockchain: RUBIC_CHAIN_BY_ID.get(fromChain?.chainId),
                },
                amount,
                {
                  address: to.isNative ? NATIVE_ADDRESS : to.address,
                  blockchain: RUBIC_CHAIN_BY_ID.get(toChain?.chainId),
                },
              );

        const newTrade = await tradeRequest;
        const [newFromUsd, newToUsd] = await Promise.all([
          // Get the USD value of what's being _sold_.
          from?.isNative
            ? rubic.cryptoPriceApi.getNativeCoinPrice(RUBIC_CHAIN_BY_ID.get(fromChain?.chainId))
            : rubic.cryptoPriceApi.getErc20TokenPrice({
                address: from?.address,
                blockchain: RUBIC_CHAIN_BY_ID.get(fromChain?.chainId),
              }),

          // Get the USD value of what's being _bought_.
          to.isNative
            ? rubic.cryptoPriceApi.getNativeCoinPrice(RUBIC_CHAIN_BY_ID.get(toChain?.chainId))
            : rubic.cryptoPriceApi.getErc20TokenPrice({
                address: to.address,
                blockchain: RUBIC_CHAIN_BY_ID.get(toChain?.chainId),
              }),
        ]);
        if (disposed) {
          return;
        }

        setTrade(newTrade);
        setLoading(false);
        setFromUsd(formatNumber(newFromUsd.multipliedBy(newTrade.from?.tokenAmount)));
        setToUsd(formatNumber(newToUsd.multipliedBy(newTrade.to.tokenAmount)));
      } catch (e) {
        if (disposed) {
          return;
        }
        setLoading(false);
        if (e instanceof InsufficientLiquidityError) {
          setCanBuy(false);
        } else {
          console.warn(e);
        }
      }
    }
    setTrade(undefined);
    setFromUsd(undefined);
    setToUsd(undefined);
    setCanBuy(true);

    const isTradingSameToken = fromChain?.chainId === toChain?.chainId && from?.id === to?.id;
    if (amount && parseFloat(amount) > 0 && !isTradingSameToken) {
      setLoading(true);
      run();
      return () => {
        disposed = true;
      };
    } else {
      setLoading(false);
    }
  }, [from, fromChain, to, toChain, amount, rubic]);

  useEffect(() => {
    validateAmount(amount);
  }, [selectedToken]);

  const isTxPending = false

  const {
    sendTx: handleApproveToken,
    isPending: isApprovePending,
    isCompleted: isApproveCompleted,
  } = useSendTransaction(() =>
    approve(selectedToken.ContractAddress, selectedToken.router)
  );

  interface TradeDetailProps {
    trade?: InstantTrade | CrossChainTrade;
  }

  function isCrossChainTrade(trade: InstantTrade | CrossChainTrade): trade is CrossChainTrade {
    return "transitFeeToken" in trade;
  }

  const TradeDetail: VFC<TradeDetailProps> = ({ trade }) => {
    let min: string;
    if (trade) {
      if (isCrossChainTrade(trade)) {
        min = `${formatNumber(trade.toTokenAmountMin)} ${trade.to.symbol}`;
      } else {
        min = `${formatNumber(trade.toTokenAmountMin.tokenAmount)} ${trade.to.symbol}`;
      }
    }
  
    return (
      <div className="flex mt-[20px]">
        <div className="flex text-align-right">
          <div>Minimum Received:</div>
          <div>{min || "—"}</div>
        </div>
        <div className="flex items-center">
        <Exchange />
        </div>
      </div>
    );
  };

  interface TokenSelectProps {
    show: boolean;
    chain: Chain;
    onClose: (selection?: { token: Token; chain: Chain }) => void;
  }

  const TokenSelect: React.VFC<TokenSelectProps> = ({ show, onClose, chain }) => {
    const [filter, setFilter] = useState("");
    const [selectedChainId, setSelectedChainId] = useState(chain?.chainId);
    const selectedChain = useMemo(() => CHAINS.find(c => c.chainId === selectedChainId), [selectedChainId, CHAINS]);
    const input = useRef<HTMLInputElement>(null);
    const tokensList = useRef<HTMLDivElement>(null);
    const normalizedFilter = filter.trim().toLowerCase();
    const filteredTokens = selectedChain?.tokens.filter(({ name, symbol, address }) => {
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
          setSelectedChainId(chain?.chainId || 250);
          showChainSelect(false);
          tokensList.current?.scrollTo({ top: 0 });
        }, 100);
      }
    }, [show]);
  
    return (
      // TokenSelectOverlay
      <div className="fixed w-full h-full" style={{ opacity: show ? 1 : 0, pointerEvents: show ? "unset" : "none" }}>
        {/* TokenSelectBackground */}
        <div className="absolute w-full h-full bg-dark-900" onClick={() => onClose()} />
        {/* TokenSelectModal */}
        <div className="fixed h-[95px] border top-[50%] left-[50%] w-full max-h-[768px] max-w-[280px]" style={{ transform: `translate(-50%, calc(-50% + ${show ? 0 : 30}px))` }}>
          {/* ChainSelect */}
          <div
            className="absolute w-full h-full bg-dark-800"
            style={{
              transform: isShowingChainSelect ? "translateX(0)" : "translateX(100%)",
              pointerEvents: show && isShowingChainSelect ? "all" : "none",
            }}
          >
            <div className="chains-title">Select Chain</div>
            <div className="chains">
              {CHAINS.map((chain, i) => (
                <button
                  key={chain.chainId}
                  onClick={() => {
                    setSelectedChainId(chain.chainId);
                    tokensList.current?.scrollTo({ top: 0 });
                    showChainSelect(false);
                    setFilter("");
                  }}
                  className="chain"
                  style={{ backgroundColor: chain.color }}
                >
                  <img src={chain.logo} width="24" height="24" />
                  <div style={{ flexGrow: 1, textAlign: "left" }}>{chain.name}</div>
                  {chain.chainId === selectedChainId && 
                  <CheckCircle width="16" height="16" style={{ color: "white" }} />
                  }
                </button>
              ))}
            </div>
            
          </div>
          <div
            className="token-select"
            style={{
              transform: isShowingChainSelect ? "translateY(50px)" : "",
              opacity: isShowingChainSelect ? 0 : 1,
              pointerEvents: show ? "all" : "none",
            }}
          >
            <div className="token-select-head">
              <button
                className="selected-chain"
                style={{ backgroundColor: selectedChain?.color }}
                onClick={() => showChainSelect(true)}
              >
                <img src={selectedChain?.logo} width="24" height="24" />
                <div style={{ flexGrow: 1, textAlign: "left" }}>{selectedChain?.name}</div>
                {/* TODO */}
                {/* <ChevronIcon width="13" height="13" style={{ color: "white", marginTop: 2 }} /> */}
              </button>
  
              <form
                onSubmit={e => {
                  e.preventDefault();
                  onClose({ token: filteredTokens[0], chain: selectedChain });
                }}
              >
                <input
                  ref={input}
                  className="tokens-filter"
                  placeholder={`Search ${selectedChain?.name} tokens`}
                  value={filter}
                  onChange={e => setFilter(e.currentTarget.value)}
                />
              </form>
            </div>
            <div className="tokens-list" ref={tokensList}>
              {filteredTokens?.map(token => (
                <div key={token.address} onClick={() => onClose({ token, chain: selectedChain })}>
                  <img src={token.logo} width="24" height="24" />
                  <div className="token-name">{token.name}</div>
                  {token.favorite && <StarIcon width="16" height="16" className="token-favorite" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleBridgeAction = async () => {
    const isStableType =
      type === "anySwapOutUnderlying" ||
      type === "anySwapOut(address,address,uint256,uint256)" ||
      type === "anySwapOutNative(address,address,uint256)";
    const isNative = symbol !== "FTM" && !ContractAddress;

    let tx;
    if (isNative) {
      console.log("NATIVE BRIDGE");
      tx = await bridgeNativeMethod(
        selectedToken,
        unitToWei(amount, Decimals).toString()
      );
    } else if (isStableType) {
      console.log("STABLE BRIDGE");
      tx = await bridgeStableMethod(
        selectedToken,
        unitToWei(amount, Decimals).toString()
      );
    } else {
      console.log("BRIDGE");
      tx = await bridgeMethod(
        selectedToken,
        unitToWei(amount, Decimals).toString()
      );
    }

    if (tx) {
      window.localStorage.setItem("BridgeTxHash", tx);
      setBridgeTxHash(tx);
      // TODO announce is not a public api endpoint
      // announceTransaction(tx, fromChainId, toChainId);
    }
  };

  const resetTransactionStatus = () => {
    window.localStorage.removeItem("BridgeTxHash");
    setBridgeTxHash(null);
  };

  useEffect(() => {
    connectToChain(fromChain);
  }, [fromChain]);

  useEffect(() => {
    if (Number(chainId) !== Number(fromChain)) {
      return;
    }
    if (selectedToken?.needApprove === "true" && amount) {
      getAllowance(selectedToken.ContractAddress, selectedToken.router).then(
        (allowance) => {
          if (
            allowance.gte(
              amount
                ? BigNumber.from(unitToWei(amount, selectedToken.decimals))
                : selectedToken.balance
            )
          )
            return setIsApproved(true);
          return setIsApproved(false);
        }
      );
    }
    return setIsApproved(true);
  }, [selectedToken, isApproveCompleted, chainId]);

  useEffect(() => {
    let interval: any;
    if (bridgeTxHash && !interval) {
      const fetchStatus = () =>
        getTransactionStatus(bridgeTxHash)
          .then((response) => {
            if (!response?.data?.info) {
              return;
            }
            return setBridgeStatus(response.data.info.status);
          })
          .catch((err) => console.error(err));

      interval = setInterval(() => fetchStatus(), 10_000);
    }
    if (!bridgeTxHash) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [bridgeTxHash]);

  const [showSelectTo, setShowSelectTo] = useState(false);
  const [showSelectFrom, setShowSelectFrom] = useState(false);

  return (
    <Container id="remove-liquidity-page" maxWidth="2xl" className="space-y-4">
      <DoubleGlowShadowV2>
      <div className="p-4 mt-4 space-y-4 rounded bg-dark-900" style={{ zIndex: 1 }}>          
        <div className="px-2">

    <HeaderNew />
    </div>
    <FadeInOut>
      {bridgeTxHash && (
        <ContentBox
          style={{
            background: "#821fff",
            color: "white",
            fontFamily: "proxima-nova, sans-serif",
            borderRadius: "8px",
            position: "fixed",
            right: "2rem",
            top: "8rem",
            zIndex: 100,
            padding: "1rem",
          }}
        >
          <Column style={{}}>
            <Typo2 style={{ fontWeight: "bold" }}>Bridge Transaction</Typo2>
            <div />
            <Typo2>
              {"Hash: "}
              <a
                href={`https://anyswap.net/explorer/tx?params=${bridgeTxHash}`}
                target="_blank"
                rel="noreferrer"
              >
                {formatAddress(bridgeTxHash)}
              </a>
            </Typo2>
            {bridgeStatus > 0 && (
              <Typo2>
                {transactionStatusMapping[bridgeStatus] || "Unknown"}
              </Typo2>
            )}
            <div />
            <OverlayButton
              style={{ padding: 0 }}
              onClick={() => resetTransactionStatus()}
            >
              <Typo2 style={{ fontWeight: "bold" }}>Close</Typo2>
            </OverlayButton>
          </Column>
        </ContentBox>
      )}

      <Row style={{ width: "100%", justifyContent: "center" }}>
        <div className="flex -4 border border-dark-900 hover:border-dark-600 bg-dark-900 p-2 rounded w-full">
          <Column style={{ width: "100%" }}>
            <div />
            <>
              <ChainSelection
                setTokenList={setTokenList}
                connectToChain={setFromChain}
                bridgeToChain={setToChain} />
              <TokenSelect
        show={showSelectTo}
        chain={toChain}
        onClose={t => {
          setShowSelectTo(false);
          if (!t) {
            return;
          }
          setTo(t.token);
          setToChain(t.chain);
        }}
      />                            
      <div />
              <div />

      {/* <BridgeTokenList
                tokenList={tokenList}
                setSelectedToken={setFrom}
                fromChain={fromChain}
                toChain={toChain}
                amount={amount}
                setAmount={handleSetAmount}
                inputError={inputError}
                isBridgeTxCompleted={false} /> */}
              <div />
              
              <TokenSelector
                      show={showSelectTo}
                      chain={toChain}
                      onClose={t => {
                        setShowSelectTo(false);
                        if (!t) {
                          return;
                        }
                        setTo(t.token);
                        setToChain(t.chain);
                      } } />
              <div />
              <div className="h-px my-6 bg-dark-1000"></div>
              <div className="flex flex-col bg-dark-1000 p-3 border border-1 border-dark-700 hover:border-dark-600 w-full space-y-1">

                <div className="flex justify-between">
                  <Typography className="text-white" fontFamily={'medium'}>
                    Minimum Receieved
                  </Typography>
                  <Typography className="text-white" weight={600} fontFamily={'semi-bold'}>
                     {/* {min || "—"} */}
                  </Typography>
                </div>

                <div className="flex justify-between">
                  <Typography className="text-white" fontFamily={'medium'}>
                    Price
                  </Typography>
                  <Typography className="text-white" weight={600} fontFamily={'semi-bold'}>
                            {trade ? (
                      <div>
                        1 {trade.to.symbol} = {formatNumber(trade.to.price.dividedBy(trade.from?.price))}{" "}
                        {trade.from?.symbol}
                      </div>
                    ) : (
                      <div>&mdash;</div>
                    )}
                  </Typography>
                </div>

                {/* <div className="flex justify-between">
                  <Typography className="text-white" fontFamily={'medium'}>
                    Maximum Amount
                  </Typography>
                  <Typography className="text-white" weight={600} fontFamily={'semi-bold'}>
                    {selectedToken
                      ? `${formatSimpleValue(selectedToken.MaximumSwap)} ${selectedToken.symbol}`
                      : "-"}
                  </Typography>
                </div>

                <div className="flex justify-between">
                  <Typography className="text-white" fontFamily={'medium'}>
                    Fee (Minimum)
                  </Typography>
                  <Typography className="text-white" weight={600} fontFamily={'semi-bold'}>
                    {'~'}
                    {selectedToken
                      ? `${formatSimpleValue(
                        selectedToken.MinimumSwapFee
                      )} ${selectedToken.symbol}`
                      : "-"}
                  </Typography>
                </div> */}

                <div className="flex justify-center">
                  <Typography className="text-white text-xs">
                    {selectedToken
                      ? <i>Amounts over {formatSimpleValue(
                        selectedToken.BigValueThreshold
                      )} {selectedToken.symbol} may take up to 12hrs.</i>
                      : ""}
                  </Typography>
                </div>

              </div>
              <div className="mt-8" />
              <ButtonComponent variant="outlined" color="purple" onClick={handleApproveToken} className="mb-2">
                {isApprovePending
                  ? "Approving"
                  : isApproveCompleted
                    ? "Approve successful"
                    : "Approve Token"}
              </ButtonComponent>
              
                    
              {isApproved && (
                <ButtonComponent
                  disabled={inputError ||
                    !amount ||
                    Number(chainId) !== Number(fromChain)}
                  variant="filled"
                  color="purple"
                  onClick={handleBridgeAction}
                >
                  { isTxPending
                    ? "Broadcasting Transaction"
                    : "Swap Tokens" }
                </ButtonComponent>
              )}

{/* <TradeDetail trade={trade} /> */}

            </>
          </Column>
        </div>
      </Row>
      <div />
    </FadeInOut>
  </div>
</DoubleGlowShadowV2>
</Container>
  );
};

// const Divider: React.FC<any> = ({ padding = "2rem" }) => {
//   return (
//     <div
//       style={{
//         width: `calc(100% + ${padding} + ${padding})`,
//         marginLeft: `-${padding}`,
//         height: "1px",
//         backgroundColor: "#232F46",
//       }}
//     />
//   );
// };

interface TradeDetailProps {
  trade?: InstantTrade | CrossChainTrade;
}
function isCrossChainTrade(trade: InstantTrade | CrossChainTrade): trade is CrossChainTrade {
  return "transitFeeToken" in trade;
}

const TradeDetail: VFC<TradeDetailProps> = ({ trade }) => {
  let min: string;
  if (trade) {
    if (isCrossChainTrade(trade)) {
      min = `${formatNumber(trade.toTokenAmountMin)} ${trade.to.symbol}`;
    } else {
      min = `${formatNumber(trade.toTokenAmountMin.tokenAmount)} ${trade.to.symbol}`;
    }
  }

  return (
    <div className="flex mt-[20px]">
      <div className="flex text-align-right">
        <div>Minimum Received:</div>
        <div>{min || "—"}</div>
      </div>
      <div className="flex text-align-right">
        <div>Price:</div>
        <div>
          {trade ? (
            <div>
              1 {trade.to.symbol} = {formatNumber(trade.to.price.dividedBy(trade.from?.price))}{" "}
              {trade.from?.symbol}
            </div>
          ) : (
            <div>&mdash;</div>
          )}
        </div>
      </div>
      {/* <div className="detail">
        <div>Slippage:</div>
        <div>{trade ? `${trade.slippageTolerance * 100}%` : "—"}</div>
      </div> */}
    </div>
  );
};

interface ConfirmationProps {
  show: "hide" | "show" | "poor";
  onClose: (selection?: Token) => void;
  from: Token;
  to: Token;
  fromUsd: string | undefined;
  toUsd: string | undefined;
  trade?: InstantTrade | CrossChainTrade;
}
const Confirmation: React.VFC<ConfirmationProps> = ({ show, onClose, from, to, fromUsd, toUsd, trade }) => {
  const input = useRef<HTMLInputElement>(null);
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

  return (
    // <div
    //   className="confirmation-overlay"
    //   style={{ opacity: show !== "hide" ? 1 : 0, pointerEvents: show !== "hide" ? "unset" : "none" }}
    // >
    <div>
      <div className="confirmation-background" onClick={() => onClose()} />
      <div
        className="confirmation"
        style={{ transform: `translate(-50%, calc(-50% + ${show !== "hide" ? 0 : 30}px))` }}
      >
        <div className="transaction">
          <div className="transaction-side">
            <div className="transaction-token">
              <img src={from?.logo} width="16" height="16" />
              {from?.symbol}
              <span style={{ flexGrow: 1 }} />
              <span className="usd">${fromUsd ?? "0"}</span>
            </div>
            <div className="transaction-amount" style={{ color: show === "poor" ? "#e80625" : undefined }}>
              {trade ? formatNumber(trade.from?.tokenAmount) : "n/a"}
            </div>
          </div>
          <div className="transaction-direction">
            <ArrowDownIcon width="42" height="42" />
          </div>
          <div className="transaction-side">
            <div className="transaction-token">
              <img src={ to?.logo || DEFAULT_LOGO } width="16" height="16" />
              { to?.symbol || 'SOUL' }
              <span style={{ flexGrow: 1 }} />
              <span className="usd">${toUsd ?? "0"}</span>
            </div>
            <div className="transaction-amount">{trade ? formatNumber(trade.to.tokenAmount) : "n/a"}</div>
          </div>
        </div>
        {/* TODO: fix below */}
        {show === "poor" && <div className="poor-prompt">Your wallet doesn't have enough {from?.symbol || 'SOUL'}</div>}
        {show === "show" && (
          <div className="confirmation-prompt">
            Confirm this transaction in {window.ethereum.isMetaMask ? "MetaMask" : "your wallet"}
          </div>
        )}
      </div>
    </div>
  );
};

const StyledOverlayButton = styled(OverlayButton)`
  :hover {
    background-color: #b365ff;
  }
`;

export default CrossChain;