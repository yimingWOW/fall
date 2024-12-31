import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';

const LENDING_TOKEN_SEED = "lending_token";
const BORROW_TOKEN_SEED = "borrow_token";
const COLLATERAL_TOKEN_SEED = "collateral_token";
const LENDING_AUTHORITY_SEED = "lending_authority";
const BORROWER_AUTHORITY_SEED = "borrower_authority";

export async function getLendingPoolDetails(
  connection: Connection,
  lendingPool: {
    pool: string;
    mintA: string;
    mintB: string;
  },
  walletPublicKey: PublicKey  // 添加钱包公钥参数
): Promise<{
  tokenAAmount: number;
  tokenBAmount: number;
  lendingReceiptSupply: number;
  borrowReceiptSupply: number;
  collateralReceiptSupply: number;
  addresses: {
    lendingReceipt: string;
    borrowReceipt: string;
    collateralReceipt: string;
    lendingPoolAuthority: string;
  };
  userAssets: {
    tokenAAmount: string;
    tokenBAmount: string;
    lendingReceiptAmount: string;
    borrowReceiptAmount: string;
    collateralReceiptAmount: string;
  };
}> {
  try {
    const poolPda = new PublicKey(lendingPool.pool);
    const mintA = new PublicKey(lendingPool.mintA);
    const mintB = new PublicKey(lendingPool.mintB);

    // 获取 lending pool authority PDA
    const [lendingPoolAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        mintA.toBuffer(),
        mintB.toBuffer(),
        Buffer.from(LENDING_AUTHORITY_SEED)
      ],
      new PublicKey(fallIdl.address)
    );

    // 获取 receipt token mint PDAs
    const [lendingReceiptMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        mintA.toBuffer(),
        Buffer.from(LENDING_TOKEN_SEED)
      ],
      new PublicKey(fallIdl.address)
    );

    const [borrowReceiptMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        mintA.toBuffer(),
        Buffer.from(BORROW_TOKEN_SEED)
      ],
      new PublicKey(fallIdl.address)
    );

    const [collateralReceiptMint] = PublicKey.findProgramAddressSync(
      [
        poolPda.toBuffer(),
        mintB.toBuffer(),
        Buffer.from(COLLATERAL_TOKEN_SEED)
      ],
      new PublicKey(fallIdl.address)
    );

    // 获取代币账户地址
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

    // 并行获取所有需要的账户信息
    const [
      accountA,
      accountB,
      lendingReceiptMintInfo,
      borrowReceiptMintInfo,
      collateralReceiptMintInfo
    ] = await Promise.all([
      getAccount(connection, lendingPoolAccountA),
      getAccount(connection, lendingPoolAccountB),
      getMint(connection, lendingReceiptMint),
      getMint(connection, borrowReceiptMint),
      getMint(connection, collateralReceiptMint)
    ]);

    // 获取用户的代币账户地址
    const userTokenA = await getAssociatedTokenAddress(
      mintA,
      walletPublicKey,
      true
    );

    const userTokenB = await getAssociatedTokenAddress(
      mintB,
      walletPublicKey,
      true
    );

    const userLendingReceipt = await getAssociatedTokenAddress(
      lendingReceiptMint,
      walletPublicKey,
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
    const userBorrowReceipt = await getAssociatedTokenAddress(
      borrowReceiptMint,
      borrowerAuthority,
      true
    );

    const userCollateralReceipt = await getAssociatedTokenAddress(
      collateralReceiptMint,
      borrowerAuthority,
      true
    );

    // 获取用户账户信息（使用try-catch因为账户可能不存在）
    const getUserBalance = async (address: PublicKey) => {
      try {
        const account = await getAccount(connection, address);
        return account.amount.toString();
      } catch (error) {
        return "0";
      }
    };

    // 并行获取用户所有代币余额
    const [
      userTokenAAmount,
      userTokenBAmount,
      userLendingReceiptAmount,
      userBorrowReceiptAmount,
      userCollateralReceiptAmount
    ] = await Promise.all([
      getUserBalance(userTokenA),
      getUserBalance(userTokenB),
      getUserBalance(userLendingReceipt),
      getUserBalance(userBorrowReceipt),
      getUserBalance(userCollateralReceipt)
    ]);
    console.log("userTokenAAmount", userTokenAAmount);
    console.log("userTokenBAmount", userTokenBAmount);
    console.log("userLendingReceiptAmount", userLendingReceiptAmount);
    console.log("userBorrowReceiptAmount", userBorrowReceiptAmount);
    console.log("userCollateralReceiptAmount", userCollateralReceiptAmount);

    console.log("accountA.amount------------------", accountA.amount);
    return {
      // 代币余额（考虑精度为6）
      tokenAAmount: Number(accountA.amount),
      tokenBAmount: Number(accountB.amount),
      // receipt tokens 的总供应量
      lendingReceiptSupply: Number(lendingReceiptMintInfo.supply),
      borrowReceiptSupply: Number(borrowReceiptMintInfo.supply),
      collateralReceiptSupply: Number(collateralReceiptMintInfo.supply),
      // 相关地址
      addresses: {
        lendingReceipt: lendingReceiptMint.toString(),
        borrowReceipt: borrowReceiptMint.toString(),
        collateralReceipt: collateralReceiptMint.toString(),
        lendingPoolAuthority: lendingPoolAuthority.toString()
      },
      // 用户资产
      userAssets: {
        tokenAAmount: userTokenAAmount,
        tokenBAmount: userTokenBAmount,
        lendingReceiptAmount: userLendingReceiptAmount,
        borrowReceiptAmount: userBorrowReceiptAmount,
        collateralReceiptAmount: userCollateralReceiptAmount
      }
    };
  } catch (error) {
    console.error('Error getting lending pool details:', error);
    throw error;
  }
}