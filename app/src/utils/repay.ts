import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import BN from 'bn.js';

// 与合约中的常量定义保持一致
const AUTHORITY_SEED = "authority";
const LENDING_SEED = "lending";
const LENDING_AUTHORITY_SEED = "lending_authority";
const BORROW_TOKEN_SEED = "borrow_token";
const COLLATERAL_TOKEN_SEED = "collateral_token";

export async function repay(
  wallet: any,
  connection: Connection,
  poolPda: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
  repayAmount: BN,
) {
  try {
    console.log('Executing repay...');
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: "confirmed" }
    );

    const program = new anchor.Program(
      fallIdl,
      provider
    );

    // 获取 Pool Authority PDA
    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
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
    const [borrowReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        mintA.toBuffer(),
        Buffer.from(BORROW_TOKEN_SEED)
      ],
      program.programId
    );

    const [collateralReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        mintB.toBuffer(),
        Buffer.from(COLLATERAL_TOKEN_SEED)
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

    const borrowerTokenA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: provider.wallet.publicKey
    });

    const borrowerTokenB = await anchor.utils.token.associatedAddress({
      mint: mintB,
      owner: provider.wallet.publicKey
    });

    const borrowerBorrowReceiptToken = await anchor.utils.token.associatedAddress({
      mint: borrowReceiptTokenMint,
      owner: provider.wallet.publicKey
    });

    const borrowerCollateralReceiptToken = await anchor.utils.token.associatedAddress({
      mint: collateralReceiptTokenMint,
      owner: provider.wallet.publicKey
    });

    console.log('Sending repay transaction...');
    const tx = await program.methods
      .repay(repayAmount)
      .accounts({
        pool: poolPda,
        poolAuthority,
        mintA,
        mintB,
        poolAccountA,
        poolAccountB,
        lendingPool,
        lendingPoolAuthority,
        lendingPoolTokenA,
        lendingPoolTokenB,
        borrowReceiptTokenMint,
        collateralReceiptTokenMint,
        borrower: provider.wallet.publicKey,
        borrowerTokenA,
        borrowerTokenB,
        borrowerBorrowReceiptToken,
        borrowerCollateralReceiptToken,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('Repay transaction signature:', tx);
    return tx;
  } catch (error) {
    console.error('Error in repay:', error);
    throw error;
  }
}