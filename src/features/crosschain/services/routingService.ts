import { ethers, providers, Signer } from 'ethers'
import { ContractNames, getContractAbi } from '@etherspot/contracts'
import { isZeroAddress } from './utils'
import { Order, Route } from '../types' 
import { Token } from '../constants'
import LIFI from 'entities/Lifi'

export const erc20Abi = getContractAbi(ContractNames.ERC20Token)
export const lifi = new LIFI()

export declare const Orders: readonly ["RECOMMENDED", "FASTEST", "CHEAPEST", "SAFEST"];
export interface AllowDenyPrefer {
    allow?: string[];
    deny?: string[];
    prefer?: string[];
}

export interface ExtendedTransactionRequest {
  tx: providers.TransactionRequest
  amount: string
  token: Token
  chainId: number
}

export interface RouteOptions {
  order?: Order;
  slippage?: number;
  infiniteApproval?: boolean;
  allowSwitchChain?: boolean;
  integrator?: string;
  referrer?: string;
  bridges?: AllowDenyPrefer;
  exchanges?: AllowDenyPrefer;
  fee?: number;
}
export interface RoutesRequest {
  fromChainId: number;
  fromAmount: string;
  fromTokenAddress: string;
  fromAddress?: string;
  toChainId: number;
  toTokenAddress: string;
  toAddress?: string;
  options?: RouteOptions;
}

const getRoute = async (
  request: RoutesRequest,
  signer?: Signer,
): Promise<Route[] | ExtendedTransactionRequest[]> => {
  if (request.fromAddress !== request.toAddress && signer) {
    if (
      request.fromTokenAddress === request.toTokenAddress &&
      request.fromChainId === request.toChainId
    ) {
      const tx = getSimpleTransfer(request, signer)
      return tx
    }
    return getLIFIRoute(request)
  }
  return getLIFIRoute(request)
}

const getSimpleTransfer = async (request: RoutesRequest, signer: Signer) => {
  let tx: providers.TransactionRequest
  if (isZeroAddress(request.fromTokenAddress)) {
    tx = {
      from: request.fromAddress,
      to: request.toAddress,
      value: request.fromAmount,
      gasLimit: 100000,
      gasPrice: await signer.getGasPrice(),
    }
  } else {
    let contract = new ethers.Contract(request.fromTokenAddress, erc20Abi, signer)
    tx = await contract.populateTransaction.transfer(request.toAddress, request.fromAmount)
  }
  const extendedTx: ExtendedTransactionRequest = {
    tx,
    amount: request.fromAmount,
    token: await lifi.getToken(request.fromChainId, request.fromTokenAddress),
    chainId: request.fromChainId,
  }
  return [extendedTx]
}

const getLIFIRoute = async (request: RoutesRequest) => {
  const routeReponse = await lifi.getRoutes(request)
  return routeReponse.routes
}

export default getRoute