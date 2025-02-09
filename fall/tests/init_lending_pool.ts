import * as anchor from '@coral-xyz/anchor';
import type { Program } from '@coral-xyz/anchor';
import type { Fall } from '../target/types/fall';
import { createValues, type TestValues } from './mock_value';
import { transferTokens, mintingTokens } from './utils';

describe('Create lending pool', () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);
  const program = anchor.workspace.Fall as Program<Fall>;
  let values: TestValues;

  beforeEach(async () => {
    values = createValues();
    await program.methods.createAmm(values.id)
      .accounts({
        amm: values.ammKey,
        admin: values.admin.publicKey
      } as any)
      .rpc();

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
  });

  it('Create lending pool', async () => {
    try {
      const sim = await program.methods.initLendingPool3()
        .accounts({
          pool: values.poolKey,
          lendingPoolAuthority: values.lendingPoolAuthority,
          lenderLendingBlockHeightTokenMint: values.lenderLendingBlockHeightTokenMint,
          borrowerBorrowBlockHeightTokenMint: values.borrowerBorrowBlockHeightTokenMint,
        })
        .simulate({ skipPreflight: true });
      console.log("Simulation logs:", sim);

      const tx = await program.methods.initLendingPool3()
        .accounts({
            pool: values.poolKey,
            lendingPoolAuthority: values.lendingPoolAuthority,
            lenderLendingBlockHeightTokenMint: values.lenderLendingBlockHeightTokenMint,
            borrowerBorrowBlockHeightTokenMint: values.borrowerBorrowBlockHeightTokenMint,
        } as any)
        .rpc();
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