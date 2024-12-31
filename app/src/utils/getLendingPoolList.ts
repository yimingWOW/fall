import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import fallIdl from '../idl/fall.json';


export async function getLendingPoolAccounts(
  wallet: anchor.Wallet,
  connection: Connection
) {
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    { preflightCommitment: "confirmed" }
  );

  const program = new anchor.Program(
    fallIdl,
    provider
  );

  const accounts = await program.account.lendingPool.all();

  return accounts.map(account => ({
    pubkey: account.publicKey.toString(),
    pool: account.account.pool.toString(),
    mintA: account.account.mintA.toString(),
    mintB: account.account.mintB.toString(),
    lendingReceipt: account.account.lendingReceipt.toString(),
    borrowReceipt: account.account.borrowReceipt.toString(),
    collateralReceipt: account.account.collateralReceipt.toString(),
    minCollateralRatio: account.account.minCollateralRatio,
    baseRate: account.account.baseRate,
    borrowInterest: account.account.borrowInterest,
  }));
} 