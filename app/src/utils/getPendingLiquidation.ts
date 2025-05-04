import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { BORROW_TOKEN_SEED, BORROWER_AUTHORITY_SEED, COLLATERAL_TOKEN_SEED } from './constants';
import { getPoolDetail } from './getPoolDetail';
import { Idl } from '@coral-xyz/anchor';
import { getAccountsByInstruction } from './getSignaturesForAddress';
import { BASE_RATE, MIN_COLLATERAL_RATIO } from './constants';  

export interface PendingLiquidation {
    userAuthorityPda: PublicKey;
    collateralReceiptTokenAmount: number;
    borrowReceiptTokenAmount: number;
}

export async function getPendingLiquidation(
  wallet: any,
  poolPda: PublicKey,
  connection: Connection
): Promise<PendingLiquidation[]> {
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
    if (!pool) {
      throw new Error('Pool account not found');
    }
    const poolDetail = await getPoolDetail(wallet, connection, poolPda, wallet.publicKey);
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

    const accounts = await getAccountsByInstruction(connection, program.programId.toString());
    if (!accounts || accounts.length === 0) {
      console.log('No accounts found for the program');
      return [];
    }

    const pendingLiquidation: PendingLiquidation[] = [];
    for (const account of accounts) {
      try {
        console.log('Processing account:', account.toString());
        const [borrowerAuthority] = PublicKey.findProgramAddressSync(
          [
            poolPda.toBuffer(),
            account.toBuffer(),
            Buffer.from(BORROWER_AUTHORITY_SEED)
          ],
          new PublicKey(fallIdl.address)
        );
        const borrowReceiptTokenAmount = await getUserTokenAmount(connection, borrowerAuthority, borrowReceiptTokenMint);
        const collateralReceiptTokenAmount = await getUserTokenAmount(connection, borrowerAuthority, collateralReceiptTokenMint);
        if (collateralReceiptTokenAmount < borrowReceiptTokenAmount *poolDetail.poolInfo.aToB* MIN_COLLATERAL_RATIO/BASE_RATE) {
          pendingLiquidation.push({
            userAuthorityPda: account,
            collateralReceiptTokenAmount: collateralReceiptTokenAmount,
            borrowReceiptTokenAmount: borrowReceiptTokenAmount
          });
        }
      } catch (err) {
        console.error('Error processing account:', account.toString(), err);
        continue; // 跳过出错的账户，继续处理下一个
      }
    }
    return pendingLiquidation;
  } catch (error) {
    console.error('Error fetching pool accounts:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
} 

async function getUserTokenAmount (connection: Connection, walletPublicKey: PublicKey, tokenMint: PublicKey): Promise<number> {
    try{
      const userToken = await getAssociatedTokenAddress(tokenMint, walletPublicKey, true);
      const userTokenAccount = await getAccount(connection as any, userToken);
      return Number(userTokenAccount.amount);
    }catch(e){
      console.log("getUserTokenAmount",e);
      return 0;
    }
}
