import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { BORROW_TOKEN_SEED, COLLATERAL_TOKEN_SEED } from './constants';
import { getPoolDetail } from './getPoolDetail';

export interface PendingLiquidation {
    userAuthorityPda: PublicKey;
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
      fallIdl,
      provider
    ) as any;

    const pool = await program.account.pool.fetch(poolPda);
    const mintA = pool.mintA;
    const mintB = pool.mintB;
    const poolDetail = await getPoolDetail(connection, {
      pubkey: poolPda.toString(), 
      amm: pool.amm.toString(), 
      mintA: mintA.toString(), 
      mintB: mintB.toString()
    }, wallet.publicKey);
    const poolPrice = poolDetail.pool.aToB;

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
    const borrowReceiptTokenMintOwners = await connection.getTokenLargestAccounts(borrowReceiptTokenMint);
    const pendingLiquidation: PendingLiquidation[] = [];
    for (const tokenAccount of borrowReceiptTokenMintOwners.value) {
      if (tokenAccount.amount == "0") {
        continue
      }
      const borrowTokenAccountInfo = await getAccount(connection as any, tokenAccount.address);
      const borrowerAuthority = borrowTokenAccountInfo.owner;
      const collateralReceiptTokenAmount = await getUserTokenAmount(connection, borrowerAuthority, collateralReceiptTokenMint);
      console.log("borrowReceiptToken amount", borrowTokenAccountInfo.amount.toString());
      console.log("collateralReceiptTokenAmount", collateralReceiptTokenAmount);
      console.log("Number(borrowTokenAccountInfo.amount) * 2*poolPrice", Number(borrowTokenAccountInfo.amount) * 2*poolPrice);
      if (collateralReceiptTokenAmount < Number(borrowTokenAccountInfo.amount) * 2*poolPrice) {
        pendingLiquidation.push({
          userAuthorityPda: borrowerAuthority,
        });
      }
    }
    console.log("pendingLiquidation", pendingLiquidation);
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
