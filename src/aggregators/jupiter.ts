import { QuoteResponse, createJupiterApiClient } from '@jup-ag/api';
import { VersionedTransaction } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';

import { sendSignedTransaction } from '../utils/rpc';
import { BaseAggregator, SwapData, RoutePlan } from '../interfaces/baseAggregator';

const jupiterApi = createJupiterApiClient();

export class Jupiter extends BaseAggregator {
  private quote: QuoteResponse | undefined;

  constructor(swapData: SwapData) {
    super(swapData);
  }

  protected async getQuote(): Promise<QuoteResponse> {
    if (this.quote) {
      return this.quote;
    }

    const { inputMint, outputMint, amount, slippage } = this.swapData;

    try {
      const quote = await jupiterApi.quoteGet({
        inputMint,
        outputMint,
        amount,
        slippageBps: slippage,
        onlyDirectRoutes: false,
        asLegacyTransaction: false,
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
    const quote = await this.getQuote();
    const outputAmount = Number(quote.outAmount);

    const routePlan = quote.routePlan.map<RoutePlan>(
      ({ swapInfo: { label, inAmount, outAmount, inputMint, outputMint } }) => ({
        exchange: label ?? '',
        inputMint,
        outputMint,
        amountIn: Number(inAmount),
        amountOut: Number(outAmount),
      })
    );

    return [{ outputAmount, routePlan }];
  }

  async sendTransaction(wallet: Wallet): Promise<string> {
    const quote = await this.getQuote();

    const swapResult = await jupiterApi.swapPost({
      swapRequest: {
        quoteResponse: quote,
        userPublicKey: wallet.publicKey.toBase58(),
        dynamicComputeUnitLimit: true,
      },
    });

    const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    const txid = await sendSignedTransaction(wallet, transaction);

    return txid;
  }
}
