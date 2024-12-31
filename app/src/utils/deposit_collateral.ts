import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import BN from 'bn.js';
import { 
  AUTHORITY_SEED,
  LENDING_SEED,
  LENDING_AUTHORITY_SEED,
  BORROW_TOKEN_SEED,
  COLLATERAL_TOKEN_SEED,
  BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED,
  BORROWER_AUTHORITY_SEED,
} from '../utils/constants';

export interface DepositCollateralResult {
  tx: string;
  accounts: {
    poolPda: PublicKey;
    poolAuthority: PublicKey;
    lendingPool: PublicKey;
    lendingPoolAuthority: PublicKey;
    borrowReceiptTokenMint: PublicKey;
    collateralReceiptTokenMint: PublicKey;
    borrowerBorrowBlockHeightTokenMint: PublicKey;
    borrowerBorrowReceiptToken: PublicKey;
    borrowerCollateralReceiptToken: PublicKey;
    borrowerBorrowBlockHeightReceiptToken: PublicKey;
  };
}

export async function depositCollateral(
  wallet: any,
  connection: Connection,
  poolPda: PublicKey,
  mintA: PublicKey,
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
      fallIdl ,
      provider
    );

    // 获取 Pool 信息
    const pool = await program.account.pool.fetch(poolPda);
    console.log('Pool info:', {
      amm: pool.amm.toString(),
      mintA: pool.mintA.toString(),
      mintB: pool.mintB.toString(),
    });

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

    // 获取 Borrower Borrow Block Height Token Mint
    const [borrowerBorrowBlockHeightTokenMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED)
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

    // 获取 Borrower Authority PDA
    const [borrowerAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(BORROWER_AUTHORITY_SEED)
      ],
      program.programId
    );
    console.log('Borrower Authority:', borrowerAuthority.toString());

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

    // const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ 
    //   units: 500_000
    // });

    console.log('Sending borrow transaction...');
    const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ 
      units: 1_000_000  // 增加到 1M 单位
    });
    const tx = await program.methods
      .depositCollateral( collateralAmount)
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

    return {
      tx,
      accounts: {
        poolPda,
        poolAuthority,
        lendingPool,
        lendingPoolAuthority,
        borrowReceiptTokenMint,
        collateralReceiptTokenMint,
        borrowerBorrowBlockHeightTokenMint,
        borrowerBorrowReceiptToken,
        borrowerCollateralReceiptToken,
        borrowerBorrowBlockHeightReceiptToken,
      }
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