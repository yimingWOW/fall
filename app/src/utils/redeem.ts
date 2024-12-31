import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { AUTHORITY_SEED, LENDING_SEED, LENDING_AUTHORITY_SEED, LENDING_TOKEN_SEED, BORROW_TOKEN_SEED, LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED } from './constants';

export async function redeem(
  wallet: any,
  connection: Connection,
  poolPda: PublicKey,
) {
  try {
    console.log('Executing redeem...');
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: "confirmed" }
    );

    const program = new anchor.Program(
        fallIdl,
        provider
      );

    const pool = await program.account.pool.fetch(poolPda);
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

    // 获取 Lending Pool PDA
    const [lendingPool] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        mintA.toBuffer(),
        mintB.toBuffer(),
        Buffer.from(LENDING_SEED)
      ],
      program.programId
    );

    // 获取 Lending Pool Authority PDA
    const [lendingPoolAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        mintA.toBuffer(),
        mintB.toBuffer(),
        Buffer.from(LENDING_AUTHORITY_SEED)
      ],
      program.programId
    );

    // 获取 Receipt Token Mints
    const [lendingReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        mintA.toBuffer(),
        Buffer.from(LENDING_TOKEN_SEED)
      ],
      program.programId
    );

    const [borrowReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        mintA.toBuffer(),
        Buffer.from(BORROW_TOKEN_SEED)
      ],
      program.programId
    );

    const [lenderLendingBlockHeightTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED)
      ],
      program.programId
    );

    // 获取相关 Token Accounts
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

    const lenderTokenA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: provider.wallet.publicKey
    });

    const lenderTokenB = await anchor.utils.token.associatedAddress({
      mint: mintB,
      owner: provider.wallet.publicKey
    });

    const lenderLendingReceiptToken = await anchor.utils.token.associatedAddress({
      mint: lendingReceiptTokenMint,
      owner: provider.wallet.publicKey
    });

    const lenderLendingBlockHeightReceiptToken = await anchor.utils.token.associatedAddress({
      mint: lenderLendingBlockHeightTokenMint,
      owner: provider.wallet.publicKey
    });

    console.log('Sending redeem transaction...');
    const tx = await program.methods
      .redeem()
      .accounts({
        pool: poolPda,
        poolAuthority: poolAuthority,
        mintA: mintA,
        mintB: mintB,
        poolAccountA: poolAccountA,
        poolAccountB: poolAccountB,
        lendingPool: lendingPool,
        lendingPoolAuthority: lendingPoolAuthority,
        lendingPoolTokenA: lendingPoolTokenA,
        lendingPoolTokenB: lendingPoolTokenB,
        lendingReceiptTokenMint: lendingReceiptTokenMint,
        borrowReceiptTokenMint: borrowReceiptTokenMint,
        lenderLendingBlockHeightTokenMint: lenderLendingBlockHeightTokenMint,
        lender: provider.wallet.publicKey,
        lenderTokenA: lenderTokenA,
        lenderTokenB: lenderTokenB,
        lenderLendingReceiptToken: lenderLendingReceiptToken,
        lenderLendingBlockHeightReceiptToken: lenderLendingBlockHeightReceiptToken,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('Redeem transaction signature:', tx);
    return tx;
  } catch (error) {
    console.error('Error in redeem:', error);
    throw error;
  }
}