import * as anchor from '@coral-xyz/anchor';
import { createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { type Connection, Keypair, PublicKey, type Signer } from '@solana/web3.js';
import { BN } from 'bn.js';

export const AUTHORITY_SEED= "a"; // authority
export const LIQUIDITY_SEED= "b"; // liquidity
export const LENDING_SEED= "c"; // lending
export const LENDING_AUTHORITY_SEED= "d"; // lending_authority
export const LENDING_TOKEN_SEED= "e"; // lending_token
export const BORROW_TOKEN_SEED= "f"; // borrow_token
export const BORROWER_AUTHORITY_SEED= "g"; // borrower_authority
export const COLLATERAL_TOKEN_SEED= "h"; // collateral_token
export const LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED= "i"; // lending_height_token
export const BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED= "j"; // borrow_height_token   


export interface TestValues {
  id: PublicKey;
  fee: number;
  admin: Keypair;

  mintAKeypair: Keypair;
  mintBKeypair: Keypair;
  defaultSupply: anchor.BN;

  ammKey: PublicKey;
  poolKey: PublicKey;
  poolAuthority: PublicKey;
  mintLiquidity: PublicKey;
  poolAccountA: PublicKey;
  poolAccountB: PublicKey;
  lenderLendingBlockHeightTokenMint: PublicKey;
  borrowerBorrowBlockHeightTokenMint: PublicKey;

  lendingPoolKey: PublicKey;
  lendingPoolAuthority: PublicKey;
  lendingPoolAccountA: PublicKey;
  lendingPoolAccountB: PublicKey;
  lendingReceiptTokenMint: PublicKey;
  borrowReceiptTokenMint: PublicKey;
  collateralReceiptTokenMint: PublicKey;

  user1: Keypair;
  user1Key: PublicKey; 
  user1TokenAAccount: PublicKey;
  user1TokenBAccount: PublicKey;
  user1LiquidityAccount: PublicKey;
  user1Authority: PublicKey;
  user1LendReceiptToken: PublicKey;
  user1BorrowReceiptToken: PublicKey;
  user1CollateralReceiptToken: PublicKey;
  user1LenderLendingBlockHeightReceiptToken: PublicKey;
  user1BorrowerBorrowBlockHeightReceiptToken: PublicKey;

  user2: Keypair;
  user2Key: PublicKey; 
  user2TokenAAccount: PublicKey;
  user2TokenBAccount: PublicKey;
  user2LiquidityAccount: PublicKey;
  user2Authority: PublicKey;
  user2LendReceiptToken: PublicKey;
  user2BorrowReceiptToken: PublicKey;
  user2CollateralReceiptToken: PublicKey;
  user2LenderLendingBlockHeightReceiptToken: PublicKey;
  user2BorrowerBorrowBlockHeightReceiptToken: PublicKey;
}

type TestValuesDefaults = {
  [K in keyof TestValues]+?: TestValues[K];
};
export function createValues(defaults?: TestValuesDefaults): TestValues {
  const id = defaults?.id || Keypair.generate().publicKey;
  const admin = Keypair.generate();
  const ammKey = PublicKey.findProgramAddressSync([id.toBuffer()], anchor.workspace.Fall.programId)[0];

  // Making sure tokens are in the right order
  const mintAKeypair = Keypair.generate();
  let mintBKeypair = Keypair.generate();
  while (new BN(mintBKeypair.publicKey.toBytes()).lt(new BN(mintAKeypair.publicKey.toBytes()))) {
    mintBKeypair = Keypair.generate();
  }

  const poolKey = PublicKey.findProgramAddressSync(
    [ammKey.toBuffer(), mintAKeypair.publicKey.toBuffer(), mintBKeypair.publicKey.toBuffer()],
    anchor.workspace.Fall.programId,
  )[0];
  const poolAuthority = PublicKey.findProgramAddressSync(
    [ammKey.toBuffer(), mintAKeypair.publicKey.toBuffer(), mintBKeypair.publicKey.toBuffer(), Buffer.from(AUTHORITY_SEED)],
    anchor.workspace.Fall.programId,
  )[0];
  const mintLiquidity = PublicKey.findProgramAddressSync(
    [ammKey.toBuffer(), mintAKeypair.publicKey.toBuffer(), mintBKeypair.publicKey.toBuffer(), Buffer.from(LIQUIDITY_SEED)],
    anchor.workspace.Fall.programId,
  )[0];


  // lending 相关账户
  const lendingPoolKey = PublicKey.findProgramAddressSync(
    [poolKey.toBuffer(), mintAKeypair.publicKey.toBuffer(), mintBKeypair.publicKey.toBuffer(), Buffer.from(LENDING_SEED)],
    anchor.workspace.Fall.programId,
  )[0];
  const lendingPoolAuthority = PublicKey.findProgramAddressSync(
    [poolKey.toBuffer(), mintAKeypair.publicKey.toBuffer(), mintBKeypair.publicKey.toBuffer(), Buffer.from(LENDING_AUTHORITY_SEED)],
    anchor.workspace.Fall.programId,
  )[0];

  const lendingReceiptTokenMint = PublicKey.findProgramAddressSync(
    [poolKey.toBuffer(), Buffer.from(LENDING_TOKEN_SEED)],
    anchor.workspace.Fall.programId,
  )[0];
  const borrowReceiptTokenMint = PublicKey.findProgramAddressSync(
    [poolKey.toBuffer(), Buffer.from(BORROW_TOKEN_SEED)],
    anchor.workspace.Fall.programId,
  )[0];
  const collateralReceiptTokenMint = PublicKey.findProgramAddressSync(
    [poolKey.toBuffer(),  Buffer.from(COLLATERAL_TOKEN_SEED)],
    anchor.workspace.Fall.programId,
  )[0];
  const lenderLendingBlockHeightTokenMint = PublicKey.findProgramAddressSync(
    [poolKey.toBuffer(),  Buffer.from(LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED)],
    anchor.workspace.Fall.programId,
  )[0];
  const borrowerBorrowBlockHeightTokenMint = PublicKey.findProgramAddressSync(
    [poolKey.toBuffer(),  Buffer.from(BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED)],
    anchor.workspace.Fall.programId,
  )[0];

  const user1 = Keypair.generate();
  const user2 = Keypair.generate();

  const user1Authority = PublicKey.findProgramAddressSync(
    [poolKey.toBuffer(), user1.publicKey.toBuffer(), Buffer.from(BORROWER_AUTHORITY_SEED)],
    anchor.workspace.Fall.programId,
  )[0];
  const user2Authority = PublicKey.findProgramAddressSync(
    [poolKey.toBuffer(), user2.publicKey.toBuffer(), Buffer.from(BORROWER_AUTHORITY_SEED)],
    anchor.workspace.Fall.programId,
  )[0];

  return {
    id,
    fee: 500,
    admin,

    mintAKeypair,
    mintBKeypair,
    defaultSupply: new BN(100 * 10 ** 6),

    ammKey,
    poolKey,
    poolAuthority,
    mintLiquidity,
    poolAccountA: getAssociatedTokenAddressSync(mintAKeypair.publicKey, poolAuthority, true),
    poolAccountB: getAssociatedTokenAddressSync(mintBKeypair.publicKey, poolAuthority, true),
    lenderLendingBlockHeightTokenMint:lenderLendingBlockHeightTokenMint,
    borrowerBorrowBlockHeightTokenMint:borrowerBorrowBlockHeightTokenMint,

    lendingPoolKey,
    lendingPoolAuthority,
    lendingPoolAccountA: getAssociatedTokenAddressSync(mintAKeypair.publicKey, lendingPoolAuthority, true),
    lendingPoolAccountB: getAssociatedTokenAddressSync(mintBKeypair.publicKey, lendingPoolAuthority, true),
    lendingReceiptTokenMint:lendingReceiptTokenMint,
    borrowReceiptTokenMint:borrowReceiptTokenMint,
    collateralReceiptTokenMint:collateralReceiptTokenMint,

    user1:user1,
    user1Key:user1.publicKey,
    user1TokenAAccount:getAssociatedTokenAddressSync(mintAKeypair.publicKey, user1.publicKey, true),
    user1TokenBAccount:getAssociatedTokenAddressSync(mintBKeypair.publicKey, user1.publicKey, true),
    user1LiquidityAccount: getAssociatedTokenAddressSync(mintLiquidity, user1.publicKey, true),
    user1Authority:user1Authority,
    user1LendReceiptToken: getAssociatedTokenAddressSync(lendingReceiptTokenMint, user1.publicKey, true),
    user1LenderLendingBlockHeightReceiptToken: getAssociatedTokenAddressSync(lenderLendingBlockHeightTokenMint, user1.publicKey, true),
    user1BorrowReceiptToken: getAssociatedTokenAddressSync(borrowReceiptTokenMint, user1Authority, true),
    user1CollateralReceiptToken: getAssociatedTokenAddressSync(collateralReceiptTokenMint, user1Authority, true),
    user1BorrowerBorrowBlockHeightReceiptToken: getAssociatedTokenAddressSync(borrowerBorrowBlockHeightTokenMint, user1Authority, true),

    user2:user2,
    user2Key:user2.publicKey,
    user2TokenAAccount:getAssociatedTokenAddressSync(mintAKeypair.publicKey, user2.publicKey, true),
    user2TokenBAccount:getAssociatedTokenAddressSync(mintBKeypair.publicKey, user2.publicKey, true),
    user2LiquidityAccount: getAssociatedTokenAddressSync(mintLiquidity, user2.publicKey, true),
    user2Authority:user2Authority,
    user2LendReceiptToken: getAssociatedTokenAddressSync(lendingReceiptTokenMint, user2.publicKey, true),
    user2LenderLendingBlockHeightReceiptToken: getAssociatedTokenAddressSync(lenderLendingBlockHeightTokenMint, user2.publicKey, true),
    user2BorrowReceiptToken: getAssociatedTokenAddressSync(borrowReceiptTokenMint, user2Authority, true),
    user2CollateralReceiptToken: getAssociatedTokenAddressSync(collateralReceiptTokenMint, user2Authority, true),
    user2BorrowerBorrowBlockHeightReceiptToken: getAssociatedTokenAddressSync(borrowerBorrowBlockHeightTokenMint, user2Authority, true),
  };
}

