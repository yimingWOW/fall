import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { Idl } from '@coral-xyz/anchor';
import { web3 } from '@project-serum/anchor';

import {
  LENDING_SEED,
  LENDING_AUTHORITY_SEED,
  LENDING_TOKEN_SEED,
  BORROW_TOKEN_SEED,
  COLLATERAL_TOKEN_SEED,
  LENDING_HEIGHT_TOKEN_SEED,
  BORROW_HEIGHT_TOKEN_SEED,
} from '../utils/constants';

export async function initLendingPool(
  wallet: any,
  connection: Connection,
  poolPda: PublicKey,
) {
  try {
    console.log('Creating lending pool...');
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: "confirmed" }
    );

    const program = new anchor.Program(
      fallIdl as Idl,
      provider
    );

    console.log('Fetching pool info...');
    const pool = await program.account.pool.fetch(poolPda);
    console.log('Pool info:', {
      amm: pool.amm.toString(),
      mintA: pool.mintA.toString(),
      mintB: pool.mintB.toString(),
    });

    const mintA = pool.mintA;
    const mintB = pool.mintB;

    // 获取 Lending Pool PDA
    const [lendingPoolPda] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), mintA.toBuffer(), mintB.toBuffer(), Buffer.from(LENDING_SEED)],
      program.programId
    );

    // 获取 Lending Pool Authority PDA
    const [lendingPoolAuthorityPda] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), mintA.toBuffer(), mintB.toBuffer(), Buffer.from(LENDING_AUTHORITY_SEED)],
      program.programId
    );

    // 获取 Lending Receipt Token Mint PDA
    const [lendingReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(),  Buffer.from(LENDING_TOKEN_SEED)],
      program.programId
    );

    // 获取 Borrow Receipt Token Mint PDA
    const [borrowReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(BORROW_TOKEN_SEED)],
      program.programId
    );

    // 获取 Collateral Receipt Token Mint PDA
    const [collateralReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(COLLATERAL_TOKEN_SEED)],
      program.programId
    );

    // 获取 Lending Pool Token Accounts
    const lendingPoolAccountA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: lendingPoolAuthorityPda
    });

    const lendingPoolAccountB = await anchor.utils.token.associatedAddress({
      mint: mintB,
      owner: lendingPoolAuthorityPda
    });

    // Block Height Token Mints
    const [lenderLendingBlockHeightTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(LENDING_HEIGHT_TOKEN_SEED)],
      program.programId
    );

    const [borrowerBorrowBlockHeightTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(BORROW_HEIGHT_TOKEN_SEED)],
      program.programId
    );

    console.log('Sending transaction...');
    const tx = await program.methods
      .initLendingPool()
      .accounts({
        pool: poolPda,
        mintA: mintA,
        mintB: mintB,
        lendingPool: lendingPoolPda,
        lendingPoolAuthority: lendingPoolAuthorityPda,
        lendingPoolTokenA: lendingPoolAccountA,
        lendingPoolTokenB: lendingPoolAccountB,
        lendingReceiptTokenMint: lendingReceiptTokenMint,
        borrowReceiptTokenMint: borrowReceiptTokenMint,
        collateralReceiptTokenMint: collateralReceiptTokenMint,
        lenderLendingBlockHeightTokenMint: lenderLendingBlockHeightTokenMint,
        borrowerBorrowBlockHeightTokenMint: borrowerBorrowBlockHeightTokenMint,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      }).rpc();

    // 获取交易详情
    const txInfo = await connection.getTransaction(tx, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    if (txInfo?.meta?.logMessages) {
      console.log("Program Logs:");
      txInfo.meta.logMessages.forEach(log => {
        console.log(log);
      });
    }

    return {
      tx,
      lendingPoolPda,
      lendingPoolAuthorityPda,
      lendingReceiptTokenMint,
      borrowReceiptTokenMint,
      collateralReceiptTokenMint,
      lendingPoolAccountA,
      lendingPoolAccountB
    };
  } catch (error) {
    console.error('Error in createLendingPool:', error);
    throw error;
  }
}