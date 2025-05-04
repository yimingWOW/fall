import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import BN from 'bn.js';
import { Idl } from '@coral-xyz/anchor';
import { 
  AUTHORITY_SEED,
  LENDING_AUTHORITY_SEED,
  BORROW_TOKEN_SEED,
  COLLATERAL_TOKEN_SEED,
  BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED,
  BORROWER_AUTHORITY_SEED,
} from '../utils/constants';
import { initTokenAccount } from './initTokenAccount';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export async function borrow(
  wallet: any,
  connection: Connection,
  poolPda: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
  borrowAmount: BN,
): Promise<string> {
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
    ) as any;

    const pool = await program.account.pool.fetch(poolPda);
    console.log('Pool info:', {
      amm: pool.amm.toString(),
      mintA: pool.mintA.toString(),
      mintB: pool.mintB.toString(),
    });

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

    const [borrowReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(BORROW_TOKEN_SEED)
      ],
      program.programId
    );

    const [collateralReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(COLLATERAL_TOKEN_SEED)],
      program.programId
    );

    const [borrowerBorrowBlockHeightTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED)
      ],
      program.programId
    );

    const poolAccountA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: poolAuthority
    });

    const poolAccountB = await anchor.utils.token.associatedAddress({
      mint: mintB,
      owner: poolAuthority
    });

    const lendingPoolTokenA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: lendingPoolAuthority
    });

    const lendingPoolTokenB = await anchor.utils.token.associatedAddress({
      mint: mintB,
      owner: lendingPoolAuthority
    });

    const borrowerTokenA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: provider.wallet.publicKey
    });

    const borrowerTokenB = await anchor.utils.token.associatedAddress({
      mint: mintB,
      owner: provider.wallet.publicKey
    });

    const [borrowerAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
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
    const borrowerBorrowBlockHeightReceiptToken = await anchor.utils.token.associatedAddress({
      mint: borrowerBorrowBlockHeightTokenMint,
      owner: borrowerAuthority
    });

    const hasTokenAAccount=await checkTokenAccount(connection, provider.wallet.publicKey, mintA)
    if (!hasTokenAAccount) {
      await initTokenAccount(connection, provider.wallet, mintA);
    }

    console.log('Sending borrow transaction...');
    const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ 
      units: 1_000_000  
    });
    const tx = await program.methods
      .borrow(borrowAmount)
      .accounts({
        pool: poolPda,
        poolAuthority,
        mintA,
        mintB,
        poolAccountA,
        poolAccountB,
        lendingPoolAuthority,
        lendingPoolTokenA,
        lendingPoolTokenB,
        borrowReceiptTokenMint,
        collateralReceiptTokenMint,
        borrowerBorrowBlockHeightTokenMint,
        borrower: provider.wallet.publicKey,
        borrowerTokenA,
        borrowerTokenB,
        borrowerBorrowReceiptToken,
        borrowerCollateralReceiptToken,
        borrowerBorrowBlockHeightReceiptToken,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).preInstructions([modifyComputeUnits]).rpc();

    return tx;
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

async function checkTokenAccount(connection: Connection, walletPublicKey: PublicKey, tokenMint: PublicKey): Promise<boolean> {
  try {
    const tokenAccount = await getAssociatedTokenAddress(tokenMint, walletPublicKey, true);
    const account = await connection.getAccountInfo(tokenAccount);
    return account !== null;
  } catch (e) {
    console.log("checkTokenAccount error:", e);
    return false;
  }
}