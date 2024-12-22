import { Wallet } from '@project-serum/anchor';

export interface SwapData {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippage: number;
}

export interface RoutePlan {
  exchange: string;
  inputMint: string;
  outputMint: string;
  amountIn: number;
  amountOut: number;
}

export abstract class BaseAggregator {
  swapData: SwapData;

  constructor(swapData: SwapData) {
    this.swapData = swapData;
  }

  protected abstract getQuote(): Promise<any>;
  abstract getRoutePlan(): Promise<Array<{ outputAmount: number; routePlan: RoutePlan[] }>>;
  abstract sendTransaction(wallet: Wallet): Promise<string>;
}
