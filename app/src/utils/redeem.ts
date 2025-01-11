import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { AUTHORITY_SEED, LENDING_AUTHORITY_SEED, LENDING_TOKEN_SEED, BORROW_TOKEN_SEED, LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED, BORROWER_AUTHORITY_SEED } from './constants';
import { Idl } from '@coral-xyz/anchor';

export async function redeem(
  wallet: any,
  connection: Connection,
  poolPda: PublicKey,
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
    const lendingPoolTokenA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: lendingPoolAuthority
    });
    const lendingPoolTokenB = await anchor.utils.token.associatedAddress({
      mint: mintB,
      owner: lendingPoolAuthority
    });
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
    const lenderTokenA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: provider.wallet.publicKey
    });
    const lenderTokenB = await anchor.utils.token.associatedAddress({
      mint: mintB,
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

    console.log('Sending redeem transaction...');
    const tx = await program.methods
      .redeem()
      .accounts({
        pool: poolPda,
        poolAuthority: poolAuthority,
        mintA: mintA,
        mintB: mintB,
        lendingPoolAuthority: lendingPoolAuthority,
        lendingPoolTokenA: lendingPoolTokenA,
        lendingPoolTokenB: lendingPoolTokenB,
        lendingReceiptTokenMint: lendingReceiptTokenMint,
        borrowReceiptTokenMint: borrowReceiptTokenMint,
        lenderLendingBlockHeightTokenMint: lenderLendingBlockHeightMint,
        lender: provider.wallet.publicKey,
        lenderTokenA: lenderTokenA,
        lenderTokenB: lenderTokenB,
        lenderLendingReceiptToken: lenderLendReceiptToken,
        lenderLendingBlockHeightReceiptToken: lenderLendingBlockHeightReceiptToken,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).rpc();
    console.log('Redeem transaction signature:', tx);
    return tx;
  } catch (error) {
    console.error('Error in redeem:', error);
    throw error;
  }
}