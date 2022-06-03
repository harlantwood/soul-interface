import React, { useEffect, useState } from "react";

import { useActiveWeb3React } from "hooks";
import Typography from "components/Typography";
import { weiToUnit } from "utils/conversion";
import { chainToNetworkInfoMap } from "utils/bridge";
import Row from "components/Row";
import InputError from "components/Input/Error";
import { BigNumber } from "@ethersproject/bignumber";
import useModal from "hooks/useModal";
// import { BridgeTokenSelectModal } from "pages/bridge";
import InputCurrencyBox from "pages/bridge/components/InputCurrencyBox";
import Column from "components/Column";
import { ContentBox, OverlayButton, Typo1, Typo2 } from "components";
import Loader from "components/Loader";


export const CrossTokenList = ({
    tokenList,
    fromChain,
    toChain,
    setSelectedToken,
    amount,
    setAmount,
    inputError,
    isBridgeTxCompleted,
}) => {
    const { account } = useActiveWeb3React()
    const [token, setToken] = useState(null);
    const [fromTokenBalance, setFromTokenBalance] = useState(null);
    const [toTokenBalance, setToTokenBalance] = useState(null);
    
    
    const handleSetToken = (value: any) => {
      setFromTokenBalance(null);
      setToTokenBalance(null);
      setToken(value);
    };
  
    useEffect(() => {
      if (tokenList && tokenList.length) {
        setFromTokenBalance(null);
        setToTokenBalance(null);
        return setToken(tokenList[0]);
      }
    }, [tokenList]);
  
    useEffect(() => {
      setSelectedToken(token);
      setAmount("");
  
      if (token) {
        Promise.all([token.balance, token.balanceTo]).then(
          ([fromBalance, toBalance]) => {
            setFromTokenBalance(fromBalance || BigNumber.from(0));
            setToTokenBalance(toBalance || BigNumber.from(0));
            setSelectedToken({
              ...token,
              // balance: fromBalance || BigNumber.from(0),
              // balanceTo: toBalance || BigNumber.from(0),
            });
          }
        );
        return;
      }
    }, [token, account, isBridgeTxCompleted]);
  
    const TokenSelector: React.FC<any> = ({ tokens, selected, selectToken }) => {
        const [onPresentSelectTokenModal] = useModal(
        //   <BridgeTokenSelectModal tokens={tokens} selectToken={selectToken} />,
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
                    //   <Image
                    //     alt="token logo"
                    //     height="30px"
                    //     width="30px"
                    //     src={selected.logoUrl}
                    // />
                      <Typo2 style={{ fontWeight: "bold" }}>{selected.symbol}</Typo2>
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
      
    return (
      <div className="grid justify-center">
        <Row style={{ gap: "1rem" }}>
          <div className="my-1" />
          <Row style={{ flex: 2, paddingLeft: "1rem" }}>
            {inputError ? (
              <InputError error={inputError} fontSize="14px" />
            ) : (
              <div />
            )}
          </Row>
        </Row>
        <div />
        
        <div className="hidden sm:flex">
        <div className="grid grid-cols-2 gap-1 mt-2 mb-2 rounded p-0 border border-dark-1000 hover:border-dark-600 w-full">
          <TokenSelector
            tokens={tokenList}
            selected={token}
            selectToken={handleSetToken}
          />
          <div className="flex">
            <InputCurrencyBox
              disabled={!token}
              value={amount}
              setValue={setAmount}
              max={
                token && fromTokenBalance
                  ? weiToUnit(fromTokenBalance, token?.Decimals)
                  : 0
              }
              variant="new"
            />
          </div>
        </div>
        </div>
        <div className="flex sm:hidden">
        <div className="grid grid-cols gap-1 mt-2 mb-2 rounded p-0 border border-dark-1000 hover:border-dark-600 w-full">
          <TokenSelector
            tokens={tokenList}
            selected={token}
            selectToken={handleSetToken}
          />
          <div style={{ flex: 2 }} className="mt-2">
            <InputCurrencyBox
              disabled={!token}
              value={amount}
              setValue={setAmount}
              max={
                token && fromTokenBalance
                  ? weiToUnit(fromTokenBalance, token?.Decimals)
                  : 0
              }
              variant="new"
            />
          </div>
        </div>
        </div>
        
        <div className="my-2" />
  
        <div className="flex justify-between">
            <Typography className="text-white" fontFamily={'medium'}>
            Balance on {chainToNetworkInfoMap[fromChain].name}
            </Typography>
            <Typography className="text-white" weight={600} fontFamily={'semi-bold'}>
            {token && fromTokenBalance
              ? ` ${weiToUnit(fromTokenBalance, token.Decimals) + ' ' + token.symbol}`
              : "-"}
            </Typography>
        </div>
        <div className="flex justify-between">
            <Typography className="text-white" fontFamily={'medium'}>
            Balance on {chainToNetworkInfoMap[toChain].name}
            </Typography>
            <Typography className="text-white" weight={600} fontFamily={'semi-bold'}>
            {token && toTokenBalance
              ? ` ${weiToUnit(toTokenBalance, token.DecimalsTo) + ' ' + token.symbol}`
              : "-"}
            </Typography>
        </div>
       </div>
    );
  };