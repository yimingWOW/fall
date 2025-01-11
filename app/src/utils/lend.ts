import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import BN from 'bn.js';
import { Idl } from '@coral-xyz/anchor';
import { AUTHORITY_SEED, LENDING_AUTHORITY_SEED, LENDING_TOKEN_SEED, BORROW_TOKEN_SEED, LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED,BORROWER_AUTHORITY_SEED } from './constants';

export async function lend(
  wallet: any,
  connection: Connection,
  poolPda: PublicKey,
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
      (fallIdl as any) as Idl,
      provider
    ) as any;

    const pool = await program.account.pool.fetch(poolPda);
    const mintA = pool.mintA;
    const mintB = pool.mintB;
    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [
        pool.amm.toBuffer(),
        mintA.toBuffer(),
        mintB.toBuffer(),
        Buffer.from(AUTHORITY_SEED)
      ],
      program.programId
    );
    const [lendingPoolAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(LENDING_AUTHORITY_SEED)
      ],
      program.programId
    );

    const [lendingReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(LENDING_TOKEN_SEED)
      ],
      program.programId
    );

    const [borrowReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(BORROW_TOKEN_SEED)
      ],
      program.programId
    );

    const [lenderLendingBlockHeightMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED)
      ],
      program.programId
    );
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
    const lenderTokenA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: provider.wallet.publicKey
    });
    const [lenderAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(BORROWER_AUTHORITY_SEED)
      ],
      program.programId
    );
    const lenderLendReceiptToken = await anchor.utils.token.associatedAddress({
      mint:lendingReceiptTokenMint,
      owner:lenderAuthority,
    });
    const lenderLendingBlockHeightReceiptToken = await anchor.utils.token.associatedAddress({
      mint:lenderLendingBlockHeightMint,
      owner:lenderAuthority,
    });

    const tx = await program.methods.lend(new BN(amount)).accounts({
        pool: poolPda,
        lendingPoolAuthority: lendingPoolAuthority,
        lendingPoolTokenA: lendingPoolTokenA,
        lendingReceiptTokenMint: lendingReceiptTokenMint,
        lenderLendingBlockHeightMint: lenderLendingBlockHeightMint,
        lender: provider.wallet.publicKey,
        lenderTokenA: lenderTokenA,
        lenderAuthority: lenderAuthority,
        lenderLendReceiptToken: lenderLendReceiptToken,
        lenderLendingBlockHeightReceiptToken: lenderLendingBlockHeightReceiptToken,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).rpc();

    return {
      tx,
      accounts: {
        poolAuthority,
        lendingPoolAuthority,
        lendingReceiptTokenMint,
        borrowReceiptTokenMint,
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