import { Distribution, OnesolProtocol } from '@onesol/onesol-sdk';
import { Wallet } from '@project-serum/anchor';

import { BaseAggregator, SwapData, RoutePlan } from '../interfaces/baseAggregator';
import { CONNECTION, sendSignedTransaction } from '../utils/rpc';

const onesolApi = new OnesolProtocol(CONNECTION);

export class Onesol extends BaseAggregator {
  private quote: Distribution[] | undefined;

  constructor(swapData: SwapData) {
    super(swapData);
  }

  protected async getQuote(): Promise<Distribution[]> {
    if (this.quote) {
      return this.quote;
    }

    const { inputMint, outputMint, amount } = this.swapData;

    try {
      const quote = await onesolApi.getRoutes({
        sourceMintAddress: inputMint,
        destinationMintAddress: outputMint,
        amount,
      });

      if (!quote) {
        throw Error('Unable to quote');
      }

      this.quote = quote;
      return quote;
    } catch (error) {
      console.error(`Jupiter[getQuote]: ${error}`);
      throw error;
    }
  }

  async getRoutePlan(): Promise<Array<{ outputAmount: number; routePlan: RoutePlan[] }>> {
    const quotes = await this.getQuote();
    return quotes.map(quote => ({
      outputAmount: Number(quote.amountOut),
      routePlan: quote.routes.map<RoutePlan>(
        ([{ amountIn, amountOut, exchangerFlag, sourceTokenMint, destinationTokenMint }]) => ({
          exchange: exchangerFlag,
          inputMint: sourceTokenMint.address,
          outputMint: destinationTokenMint.address,
          amountIn,
          amountOut,
        })
      ),
    }));
  }

  async sendTransaction(wallet: Wallet): Promise<string> {
    const [bestRoute] = await this.getQuote();

    const transactions = await onesolApi.getTransactions({
      wallet: wallet.publicKey,
      distribution: bestRoute,
      // slippage: this.swapData.slippage,
    });

    const transaction = transactions[0];
    const txnId = await sendSignedTransaction(wallet, transaction);

    return txnId;
  }
}
