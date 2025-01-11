import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { AUTHORITY_SEED, LENDING_AUTHORITY_SEED, BORROW_TOKEN_SEED, COLLATERAL_TOKEN_SEED, BORROWER_AUTHORITY_SEED } from './constants';
import { Idl } from '@coral-xyz/anchor';
export async function liquidate(
  wallet: any,
  connection: Connection,
  poolKey: PublicKey,
  borrower: PublicKey,
) {
  try {
    console.log('Executing liquidate...');
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: "confirmed" }
    );

    const program = new anchor.Program(
      (fallIdl as any) as Idl,
      provider
    ) as any;

    const pool = await program.account.pool.fetch(poolKey);
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
        poolKey.toBuffer(),
        Buffer.from(LENDING_AUTHORITY_SEED)
      ],
      program.programId
    );
    const [borrowReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolKey.toBuffer(),
        Buffer.from(BORROW_TOKEN_SEED)
      ],
      program.programId
    );
    const [collateralReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolKey.toBuffer(),
        Buffer.from(COLLATERAL_TOKEN_SEED)
      ],
      program.programId
    );
    const [borrowerAuthority] = PublicKey.findProgramAddressSync(
      [
        poolKey.toBuffer(),
        borrower.toBuffer(),
        Buffer.from(BORROWER_AUTHORITY_SEED)
      ],
      program.programId
    );
    const borrowerBorrowReceiptToken = await anchor.utils.token.associatedAddress({
      mint: borrowReceiptTokenMint,
      owner: borrowerAuthority
    });
    const borrowerCollateralReceiptToken = await anchor.utils.token.associatedAddress({
      mint: collateralReceiptTokenMint,
      owner: borrowerAuthority
    });
    const traderAccountB = getAssociatedTokenAddressSync(
      mintB,
      provider.wallet.publicKey,
      true
    );
    const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ 
      units: 200000_000
    });

    console.log('Sending liquidate transaction...');
    const tx = await program.methods
      .liquidate()
      .accounts({
        pool: poolKey,
        poolAuthority: poolAuthority,
        mintA: mintA,
        mintB: mintB,
        lendingPoolAuthority: lendingPoolAuthority,
        borrowReceiptTokenMint: borrowReceiptTokenMint,
        collateralReceiptTokenMint: collateralReceiptTokenMint,
        trader: provider.wallet.publicKey,
        traderAccountB: traderAccountB,
        borrower: borrower,
        borrowerBorrowReceiptToken: borrowerBorrowReceiptToken,
        borrowerCollateralReceiptToken: borrowerCollateralReceiptToken,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .preInstructions([modifyComputeUnits])
      .rpc();

    console.log('Liquidate transaction signature:', tx);
    return {
      tx,
      accounts: {
        poolKey,
        poolAuthority,
        lendingPoolAuthority,
        borrowReceiptTokenMint,
        collateralReceiptTokenMint,
        traderAccountB,
        borrowerBorrowReceiptToken,
        borrowerCollateralReceiptToken,
      }
    };
  } catch (error) {
    console.error('Error in liquidate:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}