import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import { BN } from 'bn.js';
import fallIdl from '../idl/fall.json';

export async function depositLiquidity(
  wallet: any,
  connection: Connection,
  pool: PublicKey,
  amm: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
  amountA: number,
  amountB: number,
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

    const [mintLiquidity] = PublicKey.findProgramAddressSync(
      [
        amm.toBuffer(),
        mintA.toBuffer(),
        mintB.toBuffer(),
        Buffer.from("liquidity")
      ],
      program.programId
    );

    // 获取代币账户地址
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

    // 发送交易
    const tx = await program.methods
      .depositLiquidity(
        new BN(amountA),
        new BN(amountB)
      )
      .accounts({
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
      })
      .rpc();

    return tx;
  } catch (error) {
    console.error('Error in depositLiquidity:', error);
    throw error;
  }
} 