import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import fallIdl from '../idl/fall.json';

export interface PoolInfo {
  pubkey: PublicKey;
  amm: PublicKey;
  mintA: PublicKey;
  mintB: PublicKey;
  fee: number;
  minCollateralRatio: number;
  tokenAAmount: number;
  tokenBAmount: number;
}

export async function getPoolList(
  wallet: any,
  connection: Connection
): Promise<PoolInfo[]> {
  try {
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: "confirmed" }
    );

    const program = new anchor.Program(
      fallIdl,
      provider
    ) as any;

    const accounts = await program.account.pool.all();
    return accounts.map((account: any) => ({
      pubkey: account.publicKey.toString(),
      amm: account.account.amm.toString(),
      mintA: account.account.mintA.toString(),
      mintB: account.account.mintB.toString(),
      fee: account.account.fee.toString(),
      minCollateralRatio: account.account.minCollateralRatio.toString(),
      tokenAAmount: account.account.tokenAAmount.toString(),
      tokenBAmount: account.account.tokenBAmount.toString(),
    }));
  } catch (error) {
    console.error('Error fetching pool accounts:', error);
    throw error;
  }
} 