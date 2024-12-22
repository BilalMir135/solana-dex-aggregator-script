import './config';

import { Jupiter } from './aggregators/jupiter';
import { Onesol } from './aggregators/onesol';
import { WALLET } from './utils/rpc';

async function main() {
  const SWAP_DATA = {
    inputMint: 'So11111111111111111111111111111111111111112',
    outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: 100000000,
    slippage: 10,
  };

  const jupiter = new Jupiter(SWAP_DATA);
  const onesol = new Onesol(SWAP_DATA);

  const [jupiterRouterPlan, onesolRoutePlan] = await Promise.all([
    jupiter.getRoutePlan(),
    onesol.getRoutePlan(),
  ]);

  console.log('jupiterRouterPlan => ', jupiterRouterPlan);
  console.log('onesolRoutePlan => ', onesolRoutePlan);

  const [jupiterBestRoute] = jupiterRouterPlan;
  const [onesolBestRoute] = onesolRoutePlan;

  const txId =
    jupiterBestRoute.outputAmount > onesolBestRoute.outputAmount
      ? await jupiter.sendTransaction(WALLET)
      : await onesol.sendTransaction(WALLET);

  console.log(`https://solscan.io/tx/${txId}`);
}

main();
