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
}

export async function getPendingLiquidation(
  wallet: any,
  poolPda: PublicKey,
  connection: Connection
): Promise<PublicKey[]> {
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
    const poolInfo = {
      poolPk: poolPda,    
      amm: new PublicKey(pool.amm), 
      mintA: new PublicKey(mintA), 
      mintB: new PublicKey(mintB),
      fee: pool.fee,
      minCollateralRatio: pool.minCollateralRatio,
      tokenAAmount: pool.tokenAAmount,
      tokenBAmount: pool.tokenBAmount,
    }
    const poolDetail = await getPoolDetail(wallet, connection, poolInfo as any, wallet.publicKey);
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

    const pendingLiquidation: PublicKey[] = [];
    for (const account of accounts) {
      console.log('Signer:', account.toString());
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
        pendingLiquidation.push(account);
      }
    }
    return pendingLiquidation;
  } catch (error) {
    console.error('Error fetching pool accounts:', error);
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
