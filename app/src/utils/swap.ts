import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress 
} from '@solana/spl-token';
import { BN } from 'bn.js';
import fallIdl from '../idl/fall.json';

export async function swap(
  wallet: any,
  connection: Connection,
  pool: PublicKey,
  amm: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
  swapAtoB: boolean,
  inputAmount: number,
  minOutputAmount: number,
) {
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

    // 获取必要的 PDA
    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [
        amm.toBuffer(),
        mintA.toBuffer(),
        mintB.toBuffer(),
        Buffer.from("authority")
      ],
      program.programId
    );

    // 获取代币账户
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

    const traderAccountA = await getAssociatedTokenAddress(
      mintA,
      wallet.publicKey,
      true
    );

    const traderAccountB = await getAssociatedTokenAddress(
      mintB,
      wallet.publicKey,
      true
    );

    // 发送交易
    const tx = await program.methods
      .swapExactTokensForTokens(
        swapAtoB,
        new BN(inputAmount),
        new BN(minOutputAmount)
      )
      .accounts({
        amm,
        pool,
        poolAuthority,
        trader: wallet.publicKey,
        mintA,
        mintB,
        poolAccountA,
        poolAccountB,
        traderAccountA,
        traderAccountB,
        payer: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error in swap:', error);
    throw error;
  }
} 