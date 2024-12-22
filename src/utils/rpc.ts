import { Connection, VersionedTransaction, Transaction } from '@solana/web3.js';
import { getKeypairFromEnvironment } from '@solana-developers/node-helpers';
import { Wallet } from '@project-serum/anchor';

const SOLANA_RPC_ENDPOINT = `https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;

export const CONNECTION = new Connection(SOLANA_RPC_ENDPOINT);

export const WALLET = new Wallet(getKeypairFromEnvironment('SECRET_KEY'));

export async function sendSignedTransaction(
  wallet: Wallet,
  transaction: VersionedTransaction | Transaction
): Promise<string> {
  if (transaction instanceof VersionedTransaction) {
    transaction.sign([wallet.payer]);
  }

  if (transaction instanceof Transaction) {
    transaction.sign(wallet.payer);
  }

  const rawTransaction = transaction.serialize({ verifySignatures: false });
  const txid = await CONNECTION.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    // maxRetries: 2,
    preflightCommitment: 'processed',
  });

  return txid;
}
