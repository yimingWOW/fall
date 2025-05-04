import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,getAssociatedTokenAddressSync } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { Idl } from '@coral-xyz/anchor';
import BN from 'bn.js';
import { 
  LENDING_AUTHORITY_SEED,
  COLLATERAL_TOKEN_SEED,
  BORROWER_AUTHORITY_SEED,
  BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED,
} from './constants';

export interface DepositCollateralResult {
  tx: string;
}

export async function depositCollateral(
  wallet: any,
  connection: Connection,
  poolPda: PublicKey,
  mintB: PublicKey,
  collateralAmount: BN,
): Promise<DepositCollateralResult> {
  try {
    console.log('Executing borrow...');
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: "confirmed" }
    );

    const program = new anchor.Program(
      (fallIdl as any) as Idl,
      provider
    );

    const [lendingPoolAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(LENDING_AUTHORITY_SEED)
      ],
      program.programId
    );
    const lendingPoolTokenB = await getAssociatedTokenAddressSync(
      mintB,
      lendingPoolAuthority,
      true  
    );
    const [collateralReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(COLLATERAL_TOKEN_SEED)
      ],
      program.programId
    );
    const [borrowerBorrowBlockHeightTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED)
      ],
      program.programId
    );
    const borrowerTokenB = getAssociatedTokenAddressSync(
      mintB,
      provider.wallet.publicKey
    );
    const [borrowerAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(BORROWER_AUTHORITY_SEED)
      ],
      program.programId
    );
    const borrowerCollateralReceiptToken = await getAssociatedTokenAddressSync(
      collateralReceiptTokenMint,
      borrowerAuthority,
      true 
    );
    const borrowerBorrowBlockHeightReceiptToken = await anchor.utils.token.associatedAddress({
      mint: borrowerBorrowBlockHeightTokenMint,
      owner: borrowerAuthority
    });
    console.log('Sending borrow transaction...');
    const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ 
      units: 1_000_000  
    });
    const tx = await program.methods
      .depositCollateral( collateralAmount)
      .accounts({
        pool: poolPda,
        lendingPoolAuthority,
        lendingPoolTokenB,
        collateralReceiptTokenMint,
        borrowerBorrowBlockHeightTokenMint,
        borrower: provider.wallet.publicKey,
        borrowerTokenB,
        borrowerAuthority,
        borrowerCollateralReceiptToken,
        borrowerBorrowBlockHeightReceiptToken,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).preInstructions([modifyComputeUnits]).rpc();

    return {
      tx,
    };
  } catch (error) {
    console.error('Error in borrow:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}