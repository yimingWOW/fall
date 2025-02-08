import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import fallIdl from '../idl/fall.json';
import { Idl } from '@coral-xyz/anchor';
export interface PoolInfo {
  poolPk: PublicKey;
  amm: PublicKey;
  admin: PublicKey;
  mintA: PublicKey;
  mintB: PublicKey;
  tokenAAmount: number;
  tokenBAmount: number;
  liquidityMintAmount: number;
  adminFeeAmount: number;
  aToB: number;
  bToA: number;
  displayName?: string;
  tokenAIcon?: string;
  tokenBIcon?: string;
  tokenASymbol?: string;
  tokenBSymbol?: string;
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
      (fallIdl as any) as Idl,
      provider
    ) as any;

    const accounts = await program.account.pool.all();

    return accounts.map((account: any) => ({
      poolPk: new PublicKey(account.publicKey.toString()),
      amm: new PublicKey(account.account.amm.toString()),
      mintA: new PublicKey(account.account.mintA.toString()),
      mintB: new PublicKey(account.account.mintB.toString()),
      tokenAAmount: account.account.tokenAAmount.toString(),
      tokenBAmount: account.account.tokenBAmount.toString(),
      displayName: `${account.account.mintA.toString().slice(0,4)}...${account.account.mintB.toString().slice(0,4)}`
    }));
  } catch (error) {
    console.error('Error fetching pool accounts:', error);
    throw error;
  }
} 