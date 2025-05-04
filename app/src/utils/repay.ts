import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { AUTHORITY_SEED, 
  LENDING_AUTHORITY_SEED, 
  BORROW_TOKEN_SEED, 
  BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED, 
  BORROWER_AUTHORITY_SEED, 
  COLLATERAL_TOKEN_SEED } from './constants';
import { Idl } from '@coral-xyz/anchor';
export async function repay(
  wallet: any,
  connection: Connection,
  poolPda: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
) {
  try {
    console.log('Executing repay...');
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
      [
        poolPda.toBuffer(),
        Buffer.from(COLLATERAL_TOKEN_SEED)
      ],
      program.programId
    );
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
    const [borrowerBorrowBlockHeightMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED)],
      program.programId
    );

    const borrowerBorrowBlockHeightReceiptToken = await anchor.utils.token.associatedAddress({
      mint: borrowerBorrowBlockHeightMint,
      owner: borrowerAuthority
    });

    console.log('Sending repay transaction...');
    const tx = await program.methods
      .repay()
      .accounts({
        mintA: mintA,
        mintB: mintB,
        pool: poolPda,
        poolAuthority,
        lendingPoolAuthority,
        lendingPoolTokenA,
        lendingPoolTokenB,
        borrowReceiptTokenMint,
        collateralReceiptTokenMint,
        borrowerBorrowBlockHeightMint,
        borrower: provider.wallet.publicKey,
        borrowerTokenA,
        borrowerTokenB,
        borrowerAuthority,
        borrowerBorrowReceiptToken,
        borrowerCollateralReceiptToken,
        borrowerBorrowBlockHeightReceiptToken,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).rpc();

    console.log('Repay transaction signature:', tx);
    return tx;
  } catch (error) {
    console.error('Error in repay:', error);
    throw error;
  }
}