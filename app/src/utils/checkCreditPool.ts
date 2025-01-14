import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import fallIdl from '../idl/fall.json';
import { 
  LENDING_AUTHORITY_SEED,
  COLLATERAL_TOKEN_SEED,
  LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED,
} from './constants';
import { Idl } from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';

export interface CheckCreditPoolResult {
  isCreditPoolInitialized: boolean;
}

export async function checkCreditPool(
  wallet: AnchorWallet,
  connection: Connection,
  poolPda: PublicKey,
  mintA: PublicKey,
): Promise<CheckCreditPoolResult> {
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
    console.log("program", program);
    const [lendingPoolAuthorityPda] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(LENDING_AUTHORITY_SEED)],
      program.programId
    );
    console.log("lendingPoolAuthorityPda", lendingPoolAuthorityPda);
    const [collateralReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(COLLATERAL_TOKEN_SEED)],
      program.programId
    );
    const lendingPoolAccountA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: lendingPoolAuthorityPda
    });
    const [lenderLendingBlockHeightMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), Buffer.from(LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED)],
      program.programId
    );

    console.log('Step 1: Initializing lending pool...');
    if (!await accountExists(connection, lendingPoolAccountA)) {
        return {
            isCreditPoolInitialized: false
        }
      } 
    console.log('Step 2: Initializing lending pool...');
    if (!await accountExists(connection, collateralReceiptTokenMint)) {
        return {
            isCreditPoolInitialized: false
        }
    } 
    console.log('Step 3: Initializing lending pool...');
    if (!await accountExists(connection, lenderLendingBlockHeightMint)) {
        return {
            isCreditPoolInitialized: false
        }
    } 
    return {
      isCreditPoolInitialized: true
    };
  } catch (error) {
    console.error('Error', error);
  }
  return {
    isCreditPoolInitialized: true
  };
}
async function accountExists(connection: Connection, publicKey: PublicKey): Promise<boolean> {
  const account = await connection.getAccountInfo(publicKey);
  return account !== null;
}