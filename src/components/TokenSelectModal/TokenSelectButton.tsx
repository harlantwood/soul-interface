import React from "react";
import { Button, Typo2 } from "../index";
import useModal from "../../hooks/useModal";
import TokenSelectModal from "./TokenSelectModal";
import Row from "../Row";
import ftmIcon from "assets/networks/fantom.svg";
import Spacer from "../Spacer";
// import vShape from "../../assets/img/shapes/vShape.png";
import Image from 'components/Image'
import { useActiveWeb3React } from "services/web3";
import { getChainInfo } from "constants/chains";
import { useTokenInfo } from "hooks/useAPI";
const vShape = 'https://raw.githubusercontent.com/BunsDev/fWallet-interface/buns/packages/app/src/assets/img/shapes/vShape.png'

const TokenSelectButton = ({
  currentToken,
  ftmBalance,
  assets,
  setTokenSelected,
  includeNative = true,
}) => {
  const [onPresentSelectTokenModal] = useModal(
    <TokenSelectModal
      ftmBalance={ftmBalance}
      assets={assets}
      setTokenSelected={setTokenSelected}
      includeNative={includeNative}
    />,
    "token-select-modal"
  );
  const { chainId } = useActiveWeb3React()
  const tokenURI = `https://raw.githubusercontent.com/SoulSwapFinance/assets/master/blockchains/${getChainInfo(chainId, 'NAME').toLowerCase()}/assets/${currentToken.wrapped.address}/logo.png`
  const currentTokenSymbol = useTokenInfo(currentToken.wrapped.address).tokenInfo.symbol
  return (
    <Button
      style={{ flex: 2, padding: "10px" }}
      variant="secondary"
      onClick={() => onPresentSelectTokenModal()}
    >
      <Row style={{ alignItems: "center" }}>
        <Image
          alt=""
          src={currentToken.isNative ? ftmIcon : tokenURI}
          height="24px"
          width="24px"
          style={{ height: "24px" }}
        />
        <Spacer 
        // size="xxs" 
        />
        <Typo2>{currentTokenSymbol}</Typo2>
        <Spacer 
        // size="sm" 
        />
        <Image alt="" src={vShape} />
      </Row>
    </Button>
  );
};

export default TokenSelectButton;