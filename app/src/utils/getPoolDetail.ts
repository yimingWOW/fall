import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress, getAssociatedTokenAddressSync, getMint } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { AUTHORITY_SEED,LENDING_AUTHORITY_SEED,LENDING_TOKEN_SEED,BORROW_TOKEN_SEED,COLLATERAL_TOKEN_SEED,BORROWER_AUTHORITY_SEED } from './constants';

export type PoolDetailInfo = {
  pool: {
    aToB: number;
    bToA: number;
    tokenAAmount: number;
    tokenBAmount: number;
  };
  lendingPool: {
    tokenAAmount: number;
    tokenBAmount: number;
    addresses: {
      lendingReceipt: string;
      borrowReceipt: string;
      collateralReceipt: string;
    };
    lendingReceiptSupply: number;
    borrowReceiptSupply: number;
    collateralReceiptSupply: number;
  };
  userAssets: {
    tokenAAmount: string;
    tokenBAmount: string;
    lendingReceiptAmount: string;
    borrowReceiptAmount: string;
    collateralReceiptAmount: string;
  };
}

export async function getPoolDetail(
  connection: Connection,
  pool: {
    pubkey: string;
    amm: string;
    mintA: string;
    mintB: string;
  },
  walletPublicKey: PublicKey  
): Promise<PoolDetailInfo> {
  try {
    const poolPda = new PublicKey(pool.pubkey);
    const mintA = new PublicKey(pool.mintA);
    const mintB = new PublicKey(pool.mintB);

    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [
        new PublicKey(pool.amm).toBuffer(),
        new PublicKey(pool.mintA).toBuffer(),
        new PublicKey(pool.mintB).toBuffer(),
        Buffer.from(AUTHORITY_SEED)
      ],
      new PublicKey(fallIdl.address)
    );
    const poolAccountA = await getAssociatedTokenAddress(
      new PublicKey(pool.mintA),
      poolAuthority,
      true
    );
    const poolAccountB = await getAssociatedTokenAddress(
      new PublicKey(pool.mintB),
      poolAuthority,
      true
    );
    const [borrowerAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        walletPublicKey.toBuffer(),
        Buffer.from(BORROWER_AUTHORITY_SEED)
      ],
      new PublicKey(fallIdl.address)
    );
    const poolAccountAInfo = await getAccount(connection as any, poolAccountA);
    const poolAccountBInfo = await getAccount(connection as any, poolAccountB);
    const poolTokenAAmount = Number(poolAccountAInfo.amount);
    const poolTokenBAmount = Number(poolAccountBInfo.amount);
    const aToB = poolTokenBAmount / poolTokenAAmount;
    const bToA = poolTokenAAmount / poolTokenBAmount;

    const [lendingPoolAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(LENDING_AUTHORITY_SEED)
      ],
      new PublicKey(fallIdl.address)
    );
    const [lendingReceiptMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(LENDING_TOKEN_SEED)
      ],
      new PublicKey(fallIdl.address)
    );
    const [borrowReceiptMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(BORROW_TOKEN_SEED)
      ],
      new PublicKey(fallIdl.address)
    );
    const [collateralReceiptMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        Buffer.from(COLLATERAL_TOKEN_SEED)
      ],
      new PublicKey(fallIdl.address)
    );

    const lendingPoolAccountA = await getAssociatedTokenAddress(
      mintA,
      lendingPoolAuthority,
      true
    );

    const lendingPoolAccountB = await getAssociatedTokenAddress(
      mintB,
      lendingPoolAuthority,
      true
    );

    const lendingPoolAccountAInfo = await getAccount(connection as any, lendingPoolAccountA);
    const lendingPoolAccountBInfo = await getAccount(connection as any, lendingPoolAccountB);
    const lendingReceiptMintInfo = await getMint(connection as any, lendingReceiptMint);
    const borrowReceiptMintInfo = await getMint(connection as any, borrowReceiptMint);
    const collateralReceiptMintInfo = await getMint(connection as any, collateralReceiptMint);

    console.log("walletPublicKey",walletPublicKey);
    const userTokenA = await getAssociatedTokenAddressSync(
      mintA,
      walletPublicKey,
      true
    );

    const userTokenB = await getAssociatedTokenAddress(
      mintB,
      walletPublicKey,
      true
    );

    const userTokenAAccount = await getAccount(connection as any, userTokenA);
    const userTokenBAccount = await getAccount(connection as any, userTokenB);
    const userLendingReceiptAccount = await getUserTokenAmount(connection as any, borrowerAuthority, lendingReceiptMint);
    const userBorrowReceiptAccount = await getUserTokenAmount(connection as any, borrowerAuthority, borrowReceiptMint);
    const userCollateralReceiptAccount = await getUserTokenAmount(connection as any, borrowerAuthority, collateralReceiptMint);

    return {
      pool: {
        aToB: aToB,
        bToA: bToA,
        tokenAAmount: poolTokenAAmount,
        tokenBAmount: poolTokenBAmount,
      },
      lendingPool: {
        tokenAAmount: Number(lendingPoolAccountAInfo.amount),
        tokenBAmount: Number(lendingPoolAccountBInfo.amount),
        lendingReceiptSupply: Number(lendingReceiptMintInfo.supply),
        borrowReceiptSupply: Number(borrowReceiptMintInfo.supply),
        collateralReceiptSupply: Number(collateralReceiptMintInfo.supply),
        addresses: {
          lendingReceipt: lendingReceiptMint.toString(),
          borrowReceipt: borrowReceiptMint.toString(),
          collateralReceipt: collateralReceiptMint.toString(),
        },
      },
      userAssets: {
        tokenAAmount: userTokenAAccount.amount.toString(),
        tokenBAmount: userTokenBAccount.amount.toString(),
        lendingReceiptAmount: userLendingReceiptAccount.toString(),
        borrowReceiptAmount: userBorrowReceiptAccount.toString(),
        collateralReceiptAmount: userCollateralReceiptAccount.toString()
      }
    };
  } catch (error) {
    console.error('Error getting lending pool details:', error);
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