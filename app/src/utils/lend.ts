import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import BN from 'bn.js';
import { AUTHORITY_SEED, LENDING_SEED, LENDING_AUTHORITY_SEED, LENDING_TOKEN_SEED, BORROW_TOKEN_SEED, LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED } from './constants';

export async function lend(
  wallet: any,
  connection: Connection,
  poolKey: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
  amount: number | BN,
) {
  try {
    console.log('Executing lend...');
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: "confirmed" }
    );

    const program = new anchor.Program(
      fallIdl ,
      provider
    );

    const pool = await program.account.pool.fetch(poolKey);
    console.log('Pool info:', {
      amm: pool.amm.toString(),
      mintA: pool.mintA.toString(),
      mintB: pool.mintB.toString(),
    });

    const mintA = pool.mintA;
    const mintB = pool.mintB;

    // 获取 Pool Authority PDA
    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [
        pool.amm.toBuffer(),
        mintA.toBuffer(),
        mintB.toBuffer(),
        Buffer.from(AUTHORITY_SEED)
      ],
      program.programId
    );

    // Lending Pool PDA
    const [lendingPool] = PublicKey.findProgramAddressSync(
      [
        poolKey.toBuffer(),
        mintA.toBuffer(),
        mintB.toBuffer(),
        LENDING_SEED
      ],
      program.programId
    );

    // Lending Pool Authority PDA
    const [lendingPoolAuthority] = PublicKey.findProgramAddressSync(
      [
        poolKey.toBuffer(),
        mintA.toBuffer(),
        mintB.toBuffer(),
        LENDING_AUTHORITY_SEED
      ],
      program.programId
    );

    // Receipt Token Mints
    const [lendingReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolKey.toBuffer(),
        mintA.toBuffer(),
        LENDING_TOKEN_SEED
      ],
      program.programId
    );

    const [borrowReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolKey.toBuffer(),
        mintA.toBuffer(),
        BORROW_TOKEN_SEED
      ],
      program.programId
    );

    const [lenderLendingBlockHeightTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolKey.toBuffer(),
        LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED
      ],
      program.programId
    );

    // Associated Token Accounts
    const lendingPoolTokenA = getAssociatedTokenAddressSync(
      mintA,
      lendingPoolAuthority,
      true
    );

    const lendingPoolTokenB = getAssociatedTokenAddressSync(
      mintB,
      lendingPoolAuthority,
      true
    );

    const lenderTokenA = getAssociatedTokenAddressSync(
      mintA,
      provider.wallet.publicKey,
      true
    );

    const lenderLendReceiptToken = getAssociatedTokenAddressSync(
      lendingReceiptTokenMint,
      provider.wallet.publicKey,
      true
    );

    const lenderLendingBlockHeightReceiptToken = getAssociatedTokenAddressSync(
      lenderLendingBlockHeightTokenMint,
      provider.wallet.publicKey,
      true
    );

    console.log('Sending lend transaction...');
    const tx = await program.methods
      .lend(new BN(amount))
      .accounts({
        mintA: mintA,
        mintB: mintB,
        pool: poolKey,
        poolAuthority: poolAuthority,
        lendingPool: lendingPool,
        lendingPoolAuthority: lendingPoolAuthority,
        lendingPoolTokenA: lendingPoolTokenA,
        lendingReceiptTokenMint: lendingReceiptTokenMint,
        lenderLendingBlockHeightMint: lenderLendingBlockHeightTokenMint,
        lender: provider.wallet.publicKey,
        lenderTokenA: lenderTokenA,
        lenderLendReceiptToken: lenderLendReceiptToken,
        lenderLendingBlockHeightReceiptToken: lenderLendingBlockHeightReceiptToken,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).rpc();

    console.log('Lend transaction signature:', tx);
    return {
      tx,
      accounts: {
        poolKey,
        poolAuthority,
        lendingPool,
        lendingPoolAuthority,
        lendingReceiptTokenMint,
        borrowReceiptTokenMint,
        lenderLendingBlockHeightTokenMint,
        lendingPoolTokenA,
        lendingPoolTokenB,
        lenderTokenA,
        lenderLendReceiptToken,
        lenderLendingBlockHeightReceiptToken,
      }
    };
  } catch (error) {
    console.error('Error in lend:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}