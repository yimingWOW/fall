import { getAccount, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import { AUTHORITY_SEED,LENDING_AUTHORITY_SEED,LENDING_TOKEN_SEED,BORROW_TOKEN_SEED,COLLATERAL_TOKEN_SEED,BORROWER_AUTHORITY_SEED,LIQUIDITY_SEED } from './constants';
import { PoolInfo } from './getPoolList';
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import fallIdl from '../idl/fall.json';
import { 
  LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED,
} from './constants';
import { Idl } from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import defaultTokenIcon from '../assets/default-token.png';

export interface PoolStatusInfo {
  createPool1: boolean;
  createPool2: boolean;
  initLendingPool1: boolean;
  initLendingPool2: boolean;
  initLendingPool3: boolean;
}

export type PoolDetailInfo = {
  poolStatus: PoolStatusInfo;
  poolInfo: PoolInfo;
  lendingPoolInfo: {
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
    liquidityAmount: string;
    lendingReceiptAmount: string;
    borrowReceiptAmount: string;
    collateralReceiptAmount: string;
  };
}

export async function getPoolDetail(
  wallet: AnchorWallet,
  connection: Connection,
  poolPk: PublicKey,
  walletPublicKey: PublicKey  
): Promise<PoolDetailInfo> {
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

    const pool = await program.account.pool.fetch(poolPk);
    let amm: any;
    try{
      amm = await program.account.amm.fetch(pool.amm);
      console.log("amm", amm);
    }catch(e){
      console.log("amm", e);
    }

    const mintA = new PublicKey(pool.mintA);
    const mintB = new PublicKey(pool.mintB);
    const [borrowerAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPk.toBuffer(),
        walletPublicKey.toBuffer(),
        Buffer.from(BORROWER_AUTHORITY_SEED)
      ],
      new PublicKey(fallIdl.address)
    );
    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [pool.amm.toBuffer(), mintA.toBuffer(), mintB.toBuffer(), Buffer.from(AUTHORITY_SEED)],
      program.programId
    );
    const [liquidityMint] = PublicKey.findProgramAddressSync(
      [
        poolPk.toBuffer(),
        Buffer.from(LIQUIDITY_SEED)
      ],
      new PublicKey(fallIdl.address)
    );
    const [lendingPoolAuthority] = PublicKey.findProgramAddressSync(
      [
        poolPk.toBuffer(),
        Buffer.from(LENDING_AUTHORITY_SEED)
      ],
      new PublicKey(fallIdl.address)
    );
    const [lendingReceiptMint] = PublicKey.findProgramAddressSync(
      [
        poolPk.toBuffer(),
        Buffer.from(LENDING_TOKEN_SEED)
      ],
      new PublicKey(fallIdl.address)
    );
    const [borrowReceiptMint] = PublicKey.findProgramAddressSync(
      [
        poolPk.toBuffer(),
        Buffer.from(BORROW_TOKEN_SEED)
      ],
      new PublicKey(fallIdl.address)
    );
    const [collateralReceiptMint] = PublicKey.findProgramAddressSync(
      [
        poolPk.toBuffer(),
        Buffer.from(COLLATERAL_TOKEN_SEED)
      ],
      new PublicKey(fallIdl.address)
    );
    const [liquidityMintPda] = PublicKey.findProgramAddressSync(
      [poolPk.toBuffer(), Buffer.from(LIQUIDITY_SEED)], 
      program.programId
    );
    const [lendingPoolAuthorityPda] = PublicKey.findProgramAddressSync(
      [poolPk.toBuffer(), Buffer.from(LENDING_AUTHORITY_SEED)],
      program.programId
    );
    const [lendingReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPk.toBuffer(),Buffer.from(LENDING_TOKEN_SEED)],
      program.programId
    );
    const [lenderLendingBlockHeightMint] = PublicKey.findProgramAddressSync(
      [poolPk.toBuffer(), Buffer.from(LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED)],
      program.programId
    );
    console.log("lendingPoolAuthorityPda", lendingPoolAuthorityPda);
    let lendingPoolAccountA: PublicKey;
    let initLendingPool1: boolean;
    try {
      lendingPoolAccountA = await anchor.utils.token.associatedAddress({
        mint: mintA,
        owner: lendingPoolAuthorityPda
      });
      initLendingPool1=await accountExists(connection, lendingPoolAccountA).catch(() => false);
    } catch (error) {
      console.error('Error getting lendingPoolAccountA:', error);
      initLendingPool1=false;
    }
    console.log("lendingPoolAccountA", initLendingPool1);

    const [
      createPool1,
      createPool2,
      initLendingPool2,
      initLendingPool3,
      poolAccountAInfo,
      poolAccountBInfo,
      adminFeeAmount,
      lendingPoolAccountAInfo,
      lendingPoolAccountBInfo,
      liquidityMintInfo,
      lendingReceiptMintInfo,
      borrowReceiptMintInfo,
      collateralReceiptMintInfo,
      userTokenAAccount,
      userTokenBAccount,
      userLiquidityAmount,
      userLendingReceiptAmount,
      userBorrowReceiptAmount,
      userCollateralReceiptAmount,
    ] = await Promise.all([
      accountExists(connection, poolPk).catch(() => false),
      accountExists(connection, liquidityMintPda).catch(() => false),
      accountExists(connection, lendingReceiptTokenMint).catch(() => false),
      accountExists(connection, lenderLendingBlockHeightMint).catch(() => false),
      getUserTokenAmount(connection, poolAuthority, pool.mintA).catch(() => 0),
      getUserTokenAmount(connection, poolAuthority, pool.mintB).catch(() => 0),
      getUserTokenAmount(connection, amm.admin, liquidityMint).catch(() => 0),
      getUserTokenAmount(connection, lendingPoolAuthority, pool.mintA).catch(() => 0),
      getUserTokenAmount(connection, lendingPoolAuthority, pool.mintB).catch(() => 0),
      getMint(connection, liquidityMint).catch(() => ({ supply: 0 })),
      getMint(connection, lendingReceiptMint).catch(() => ({ supply: 0 })),
      getMint(connection, borrowReceiptMint).catch(() => ({ supply: 0 })),
      getMint(connection, collateralReceiptMint).catch(() => ({ supply: 0 })),
      getUserTokenAmount(connection, walletPublicKey, mintA).catch(() => 0),
      getUserTokenAmount(connection, walletPublicKey, mintB).catch(() => 0),
      getUserTokenAmount(connection, walletPublicKey, liquidityMint).catch(() => 0),
      getUserTokenAmount(connection, borrowerAuthority, lendingReceiptMint).catch(() => 0),
      getUserTokenAmount(connection, borrowerAuthority, borrowReceiptMint).catch(() => 0),
      getUserTokenAmount(connection, borrowerAuthority, collateralReceiptMint).catch(() => 0),
    ]);

    // 避免除以零的情况
    const aToB = poolAccountAInfo === 0 ? 0 : Number(poolAccountBInfo) / Number(poolAccountAInfo);
    const bToA = poolAccountBInfo === 0 ? 0 : Number(poolAccountAInfo) / Number(poolAccountBInfo);

    return {
      poolStatus: {
        createPool1,
        createPool2,
        initLendingPool1,
        initLendingPool2,
        initLendingPool3,
      },
      poolInfo: {
        poolPk: poolPk,
        amm: pool.amm,
        admin: amm.admin,
        mintA: mintA,
        mintB: mintB,
        liquidityMintAmount: Number(liquidityMintInfo.supply),
        adminFeeAmount: Number(adminFeeAmount),
        aToB,
        bToA,
        tokenASymbol: mintA.toString().slice(0, 4),
        tokenBSymbol: mintB.toString().slice(0, 4),
        tokenAIcon: defaultTokenIcon,
        tokenBIcon: defaultTokenIcon,
        tokenAAmount: Number(poolAccountAInfo),
        tokenBAmount: Number(poolAccountBInfo),
      },
      lendingPoolInfo: {
        tokenAAmount: Number(lendingPoolAccountAInfo),
        tokenBAmount: Number(lendingPoolAccountBInfo),
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
        tokenAAmount: userTokenAAccount.toString(),
        tokenBAmount: userTokenBAccount.toString(),
        liquidityAmount: userLiquidityAmount.toString(),
        lendingReceiptAmount: userLendingReceiptAmount.toString(),
        borrowReceiptAmount: userBorrowReceiptAmount.toString(),
        collateralReceiptAmount: userCollateralReceiptAmount.toString()
      }
    };
  } catch (error) {
    console.error('Error getting lending pool details:', error);
    return {
      poolStatus: {
        createPool1: false,
        createPool2: false,
        initLendingPool1: false,
        initLendingPool2: false,
        initLendingPool3: false,
      },
      poolInfo: {
        poolPk: new PublicKey(poolPk),
        amm: new PublicKey(""),
        admin: new PublicKey(""),
        mintA: new PublicKey(""),
        mintB: new PublicKey(""),
        liquidityMintAmount: 0,
        adminFeeAmount: 0,
        aToB: 0,
        bToA: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
      },
      lendingPoolInfo: {
        tokenAAmount: 0,
        tokenBAmount: 0,
        lendingReceiptSupply: 0,
        borrowReceiptSupply: 0,
        collateralReceiptSupply: 0,
        addresses: {
          lendingReceipt: '',
          borrowReceipt: '',
          collateralReceipt: '',
        },
      },
      userAssets: {
        tokenAAmount: '0',
        tokenBAmount: '0',
        liquidityAmount: '0',
        lendingReceiptAmount: '0',
        borrowReceiptAmount: '0',
        collateralReceiptAmount: '0'
      }
    };
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

async function accountExists(connection: Connection, publicKey: PublicKey): Promise<boolean> {
  const account = await connection.getAccountInfo(publicKey);
  return account !== null;
}


