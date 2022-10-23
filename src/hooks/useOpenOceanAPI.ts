import { useTokenInfo } from "./useAPI";
import useRestApi from "./useRestApi";

export const OPENOCEAN_BASEURL = "https://open-api.openocean.finance/v1/cross";

export enum OPENOCEAN_METHODS {
  GET_TOKENLIST = "/tokenList",
  GET_QUOTE = "/quote",
  GET_SWAP_QUOTE = "/swap_quote",
}

export type OOToken = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
};

const useOpenOceanApi = (inToken?: string, outToken?: string) => {
  const inTokenSymbol = useTokenInfo(inToken).tokenInfo.symbol
  const outTokenSymbol = useTokenInfo(outToken).tokenInfo.symbol
  
  const inTokenDecimals = useTokenInfo(inToken).tokenInfo.decimals
  const outTokenDecimals = useTokenInfo(outToken).tokenInfo.decimals

  const inTokenAddress = useTokenInfo(inToken).tokenInfo.address
  const outTokenAddress = useTokenInfo(outToken).tokenInfo.address
  const { get } = useRestApi(OPENOCEAN_BASEURL);

  const getTokenList = () => {
    return get({
      path: OPENOCEAN_METHODS.GET_TOKENLIST,
      queryParams: [["chainId", 250]],
    });
  };

  const getQuote = (
    // inToken: string,
    // outToken: string,
    amount: string,
    slippage: number
  ) => {
    return get({
      path: OPENOCEAN_METHODS.GET_QUOTE,
      queryParams: [
        ["inTokenSymbol", inTokenSymbol],
        ["inTokenAddress", inTokenAddress],
        ["outTokenSymbol", outTokenSymbol],
        ["outTokenAddress", outTokenAddress],
        ["amount", amount],
        ["gasPrice", 100],
        ["slippage", slippage],
        ["exChange", "openoceanv2"],
        ["chainId", 250],
        ["withRoute", "routes"],
      ],
    });
  };

  const getSwapQuote = (
    // inToken: OOToken,
    // outToken: OOToken,
    amount: string,
    slippage: number,
    account: string
  ) => {
    return get({
      path: OPENOCEAN_METHODS.GET_SWAP_QUOTE,
      queryParams: [
        ["inTokenSymbol", inTokenSymbol],
        ["inTokenAddress", inTokenAddress],
        ["in_token_decimals", inTokenDecimals],
        ["outTokenSymbol", outTokenSymbol],
        ["outTokenAddress", outTokenAddress],
        ["out_token_decimals", outTokenDecimals],
        ["amount", amount],
        ["gasPrice", 100],
        ["slippage", slippage],
        ["exChange", "openoceanv2"],
        ["chainId", 250],
        ["account", account],
        ["withRoute", "routes"],
        ["referrer", "0x1551c797c53d459c39baeafe79fe7a3a6592022c"],
      ],
    });
  };

  return {
    getTokenList,
    getQuote,
    getSwapQuote,
  };
};

export default useOpenOceanApi;