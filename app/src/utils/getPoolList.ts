import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import fallIdl from '../idl/fall.json';

interface PoolInfo {
  pubkey: string;
  amm: string;
  mintA: string;
  mintB: string;
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
    );

    const accounts = await program.account.pool.all();
    
    return accounts.map(account => ({
      pubkey: account.publicKey.toString(),
      amm: account.account.amm.toString(),
      mintA: account.account.mintA.toString(),
      mintB: account.account.mintB.toString(),
    }));
  } catch (error) {
    console.error('Error fetching pool accounts:', error);
    throw error;
  }
} 