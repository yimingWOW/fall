import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import { Idl } from '@coral-xyz/anchor';
import fallIdl from '../idl/fall.json';
import { AUTHORITY_SEED, LIQUIDITY_SEED } from './constants';

export async function withdrawLiquidity(
  wallet: any,
  connection: Connection,
  pool: PublicKey,
  amm: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
  amount: number,
) {
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

    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [
        amm.toBuffer(),
        mintA.toBuffer(),
        mintB.toBuffer(),
        Buffer.from(AUTHORITY_SEED)
      ],
      program.programId
    );

    const [mintLiquidity] = PublicKey.findProgramAddressSync(
      [
        pool.toBuffer(),
        Buffer.from(LIQUIDITY_SEED)
      ],
      program.programId
    );

    const poolAccountA = await getAssociatedTokenAddress(
      mintA,
      poolAuthority,
      true
    );

    const poolAccountB = await getAssociatedTokenAddress(
      mintB,
      poolAuthority,
      true
    );

    const depositorAccountA = await getAssociatedTokenAddress(
      mintA,
      wallet.publicKey,
      true
    );

    const depositorAccountB = await getAssociatedTokenAddress(
      mintB,
      wallet.publicKey,
      true
    );

    const depositorAccountLiquidity = await getAssociatedTokenAddress(
      mintLiquidity,
      wallet.publicKey,
      true
    );

    const tx = await program.methods.withdrawLiquidity(amount).accounts({
        pool,
        poolAuthority,
        depositor: wallet.publicKey,
        mintLiquidity,
        mintA,
        mintB,
        poolAccountA,
        poolAccountB,
        depositorAccountLiquidity,
        depositorAccountA,
        depositorAccountB,
        payer: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).rpc({
          skipPreflight: false,
          maxRetries: 3,
          commitment: 'confirmed',
        });
    return tx;
  } catch (error) {
    console.error('Error in depositLiquidity:', error);
    throw error;
  }
} 