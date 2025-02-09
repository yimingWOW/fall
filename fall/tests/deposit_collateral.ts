import * as anchor from '@coral-xyz/anchor';
import type { Program } from '@coral-xyz/anchor';
import type { Fall } from '../target/types/fall';
import { type TestValues, createValues } from './mock_value';
import { transferTokens, mintingTokens } from './utils';
import BN from 'bn.js';

describe('deposit collateral', () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);
  const program = anchor.workspace.Fall as Program<Fall>;
  let values: TestValues;

  beforeEach(async () => {
    values = createValues();

    await program.methods.createAmm(values.id).accounts({
      amm:values.ammKey, 
      admin: values.admin.publicKey
    } as any).rpc();

    await mintingTokens({
      connection,
      creator: values.admin,
      mintAKeypair: values.mintAKeypair,
      mintBKeypair: values.mintBKeypair,
    });

    await transferTokens({
      connection,
      from: values.admin,
      to: values.user1Key,
      tokenMint: values.mintAKeypair.publicKey,
      amount: 10**5,
    });

    await transferTokens({
      connection,
      from: values.admin,
      to: values.user1Key,
      tokenMint: values.mintBKeypair.publicKey,
      amount: 10**5,
    });

    await transferTokens({
      connection,
      from: values.admin,
      to: values.user2Key,
      tokenMint: values.mintAKeypair.publicKey,
      amount: 10**5,
    });

    await transferTokens({
      connection,
      from: values.admin,
      to: values.user2Key,
      tokenMint: values.mintBKeypair.publicKey,
      amount: 10**5,
    });

    await program.methods.createPool()
      .accounts({
        amm: values.ammKey,
        pool: values.poolKey,
        poolAuthority: values.poolAuthority,
        mintLiquidity: values.mintLiquidity,
        mintA: values.mintAKeypair.publicKey,
        mintB: values.mintBKeypair.publicKey,
        poolAccountA: values.poolAccountA,
        poolAccountB: values.poolAccountB,
      } as any)
      .rpc();

    await program.methods.depositLiquidity(new BN(10000), new BN(10000)).accounts({
      pool: values.poolKey,
      poolAuthority: values.poolAuthority,
      depositor: values.user1Key,
      mintLiquidity: values.mintLiquidity,
      mintA: values.mintAKeypair.publicKey,
      mintB: values.mintBKeypair.publicKey,
      poolAccountA: values.poolAccountA,
      poolAccountB: values.poolAccountB,
      depositorAccountLiquidity: values.user1LiquidityAccount,
      depositorAccountA: values.user1TokenAAccount,
      depositorAccountB: values.user1TokenBAccount,
    }).signers([values.user1]).rpc();

    await program.methods.initLendingPool1()
    .accounts({
        pool: values.poolKey,
        mintA: values.mintAKeypair.publicKey,
        mintB: values.mintBKeypair.publicKey,
        lendingPoolAuthority: values.lendingPoolAuthority,
        lendingPoolTokenA: values.lendingPoolAccountA,
        lendingPoolTokenB: values.lendingPoolAccountB,
    } as any)
    .rpc();

    await program.methods.initLendingPool2()
      .accounts({
          pool: values.poolKey,
          lendingPoolAuthority: values.lendingPoolAuthority,
          lendingReceiptTokenMint: values.lendingReceiptTokenMint,
          borrowReceiptTokenMint: values.borrowReceiptTokenMint,
          collateralReceiptTokenMint: values.collateralReceiptTokenMint,
      } as any)
      .rpc();

    await program.methods.initLendingPool3()
      .accounts({
          pool: values.poolKey,
          lendingPoolAuthority: values.lendingPoolAuthority,
          lenderLendingBlockHeightTokenMint: values.lenderLendingBlockHeightTokenMint,
          borrowerBorrowBlockHeightTokenMint: values.borrowerBorrowBlockHeightTokenMint,
      } as any)
      .rpc();

    await program.methods.lend(new BN(10000)).accounts({
      mintA: values.mintAKeypair.publicKey,
      mintB: values.mintBKeypair.publicKey,
      pool: values.poolKey,
      poolAuthority: values.poolAuthority,
      lendingPool: values.lendingPoolKey,
      lendingPoolAuthority: values.lendingPoolAuthority,
      lendingPoolTokenA: values.lendingPoolAccountA,
      lendingPoolTokenB: values.lendingPoolAccountB,
      lendingReceiptTokenMint: values.lendingReceiptTokenMint,
      borrowReceiptTokenMint: values.borrowReceiptTokenMint,
      lenderLendingBlockHeightTokenMint: values.lenderLendingBlockHeightTokenMint,
      lender: values.user1Key,
      lenderTokenA: values.user1TokenAAccount,
      lenderLendReceiptToken: values.user1LendReceiptToken,
      lenderLendingBlockHeightReceiptToken: values.user1LenderLendingBlockHeightReceiptToken,
    }).signers([values.user1]).rpc();
  });

  it('deposit collateral', async () => {
    try {
        const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ 
            units: 500_000 
        });

        const sim = await program.methods.depositCollateral(new BN(100)).accounts({
            pool: values.poolKey,
            lendingPoolAuthority: values.lendingPoolAuthority,
            lendingPoolTokenB: values.lendingPoolAccountB,
            collateralReceiptTokenMint: values.collateralReceiptTokenMint,
            borrower: values.user2Key,
            borrowerTokenB: values.user2TokenBAccount,
            borrowerAuthority: values.user2Authority,
            borrowerCollateralReceiptToken: values.user2CollateralReceiptToken,
        } as any).preInstructions([modifyComputeUnits]).simulate();
        console.log("Simulation logs:", sim);

        const tx = await program.methods.depositCollateral(new BN(100)).accounts({
          pool: values.poolKey,
          lendingPoolAuthority: values.lendingPoolAuthority,
          lendingPoolTokenB: values.lendingPoolAccountB,
          collateralReceiptTokenMint: values.collateralReceiptTokenMint,
          borrower: values.user2Key,
          borrowerTokenB: values.user2TokenBAccount,
          borrowerAuthority: values.user2Authority,
          borrowerCollateralReceiptToken: values.user2CollateralReceiptToken,
        } as any).signers([values.user2]).preInstructions([modifyComputeUnits]).rpc();
        console.log("Transaction signature:", tx);
            
        const txInfo = await connection.getTransaction(tx, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
        });

        if (txInfo?.meta?.logMessages) {
            console.log("Program Logs:");
            txInfo.meta.logMessages.forEach(log => {
                console.log(log);
        });
      }
    } catch (error) {
        console.error("Error:", error);
    }
  });
});