import * as anchor from '@coral-xyz/anchor';
import { web3 } from '@project-serum/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { 
  ADMIN_PUBLIC_KEY,
  AUTHORITY_SEED,
  LIQUIDITY_SEED,
  LENDING_AUTHORITY_SEED,
  LENDING_TOKEN_SEED,
  BORROW_TOKEN_SEED,
  COLLATERAL_TOKEN_SEED,
  LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED,
  BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED,
} from '../utils/constants';
import { Idl } from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';

export interface CreatePoolResult {
  tx1: string;
  tx2: string;
  initTx1: string;
  initTx2: string;
  initTx3: string;
}
export async function createPool(
  wallet: AnchorWallet,
  connection: Connection,
  ammPda: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
): Promise<CreatePoolResult> {
  try {
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { 
        commitment: "confirmed",
        preflightCommitment: "confirmed" 
      }
    );
    const program = new anchor.Program(
      (fallIdl as any) as Idl,
      provider
    ) as any;

    const [poolPda] = PublicKey.findProgramAddressSync(
      [ammPda.toBuffer(), mintA.toBuffer(), mintB.toBuffer()],
      program.programId
    );
    const [poolAuthorityPda] = PublicKey.findProgramAddressSync(
      [ammPda.toBuffer(), mintA.toBuffer(), mintB.toBuffer(), Buffer.from(AUTHORITY_SEED)],
      program.programId
    );
    const [liquidityMintPda] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(LIQUIDITY_SEED)],
      program.programId
    );
    const [lendingPoolAuthorityPda] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(LENDING_AUTHORITY_SEED)],
      program.programId
    );
    const [lendingReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(),Buffer.from(LENDING_TOKEN_SEED)],
      program.programId
    );
    const [borrowReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(),  Buffer.from(BORROW_TOKEN_SEED)],
      program.programId
    );
    const [collateralReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(COLLATERAL_TOKEN_SEED)],
      program.programId
    );
    const [lenderLendingBlockHeightMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED)],
      program.programId
    );
    const [borrowerBorrowBlockHeightMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED)],
      program.programId
    );
    const adminFeeAccount = await anchor.utils.token.associatedAddress({
      mint: liquidityMintPda,
      owner: new PublicKey(ADMIN_PUBLIC_KEY),
    });
    const poolAccountA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: poolAuthorityPda
    });
    const poolAccountB = await anchor.utils.token.associatedAddress({
      mint: mintB,
      owner: poolAuthorityPda
    });
    const lendingPoolAccountA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: lendingPoolAuthorityPda
    });
    const lendingPoolAccountB = await anchor.utils.token.associatedAddress({
      mint: mintB,
      owner: lendingPoolAuthorityPda
    });
    const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ 
      units: 1_000_000  
    });
    console.log('Step 1: Creating pool...');
    let tx1: string='';
    if (!await accountExists(connection, poolPda)) {
      tx1 = await program.methods.createPool1().accounts({
        amm: ammPda,
        mintA: mintA,
        mintB: mintB,
        pool: poolPda,
        poolAuthority: poolAuthorityPda,
        poolAccountA: poolAccountA,
        poolAccountB: poolAccountB,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        }).preInstructions([modifyComputeUnits]).rpc({
          commitment: 'confirmed',
        });
      await connection.confirmTransaction(tx1, 'confirmed');
      console.log('Transaction signature:', tx1);
    } else {
      console.log('Pool already exists, skipping...');
    }
    console.log('Step 2: Creating pool...');
    let tx2: string='';
    if (!await accountExists(connection, liquidityMintPda)) {
      tx2 = await program.methods.createPool2().accounts({
          amm: ammPda,
          mintA: mintA,
          mintB: mintB,
          pool: poolPda,
          poolAuthority: poolAuthorityPda,
          liquidityMint: liquidityMintPda,
          admin: ADMIN_PUBLIC_KEY,
          adminFeeAccount: adminFeeAccount,
          payer: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        }).preInstructions([modifyComputeUnits]).rpc({
          commitment: 'confirmed',
        });
        await connection.confirmTransaction(tx2, 'confirmed');
      console.log('Transaction signature:', tx2);
    } else {
      console.log('Pool already exists, skipping...');
    }
    console.log('Step 2: Initializing lending pool...');
    let initTx1: string='';
    if (!await accountExists(connection, lendingPoolAccountA)) {
      initTx1 = await program.methods.initLendingPool1().accounts({
          pool: poolPda,
          mintA: mintA,
          mintB: mintB,
          lendingPoolAuthority: lendingPoolAuthorityPda,
          lendingPoolTokenA: lendingPoolAccountA,
          lendingPoolTokenB: lendingPoolAccountB,
          payer: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,    
        }).rpc();
        await connection.confirmTransaction(initTx1, 'confirmed');
      } else {
        console.log("Lending pool 1 already initialized, skipping...");
    }
    console.log('Step 3: Initializing lending pool...');
    let initTx2: string='';
    if (!await accountExists(connection, lendingReceiptTokenMint)) {
      initTx2 = await program.methods.initLendingPool2().accounts({
          pool: poolPda,
          lendingPoolAuthority: lendingPoolAuthorityPda,
          lendingReceiptTokenMint: lendingReceiptTokenMint,
          borrowReceiptTokenMint: borrowReceiptTokenMint,
          collateralReceiptTokenMint: collateralReceiptTokenMint,
          payer: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,    
      }).rpc();
      await connection.confirmTransaction(initTx2, 'confirmed');
    } else {
      console.log("Lending pool 2 already initialized, skipping...");
    }
    console.log('Step 4: Initializing lending pool...');
    let initTx3: string='';
    if (!await accountExists(connection, lenderLendingBlockHeightMint)) {
      initTx3 = await program.methods.initLendingPool3().accounts({
        pool: poolPda,
        lendingPoolAuthority: lendingPoolAuthorityPda,
        lenderLendingBlockHeightMint: lenderLendingBlockHeightMint,
        borrowerBorrowBlockHeightMint: borrowerBorrowBlockHeightMint,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,    
      }).rpc();
      await connection.confirmTransaction(initTx3, 'confirmed');
    } else {
      console.log("Lending pool 3 already initialized, skipping...");
    }
    return {
      tx1,
      tx2,
      initTx1,
      initTx2,
      initTx3,
    };
  } catch (error) {
    console.error('Error', error);
  }
  return {
    tx1: '',
    tx2: '',
    initTx1: '',
    initTx2: '',
    initTx3: '',
  };
}

async function accountExists(connection: Connection, publicKey: PublicKey): Promise<boolean> {
  const account = await connection.getAccountInfo(publicKey);
  return account !== null;
}