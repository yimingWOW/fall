// import * as anchor from '@coral-xyz/anchor';
// import type { Program } from '@coral-xyz/anchor';
// import type { Fall } from '../target/types/fall';
// import { createValues, type TestValues } from './mock_value';
// import { transferTokens, mintingTokens } from './utils';

// describe('Create lending pool', () => {
//   const provider = anchor.AnchorProvider.env();
//   const connection = provider.connection;
//   anchor.setProvider(provider);
//   const program = anchor.workspace.Fall as Program<Fall>;
//   let values: TestValues;

//   beforeEach(async () => {
//     values = createValues();
//     await program.methods.createAmm(values.id)
//       .accounts({
//         amm: values.ammKey,
//         admin: values.admin.publicKey
//       } as any)
//       .rpc();

//     await mintingTokens({
//       connection,
//       creator: values.admin,
//       mintAKeypair: values.mintAKeypair,
//       mintBKeypair: values.mintBKeypair,
//     });

//     await transferTokens({
//       connection,
//       from: values.admin,
//       to: values.user1Key,
//       tokenMint: values.mintAKeypair.publicKey,
//       amount: 10**5,
//     });

//     await transferTokens({
//       connection,
//       from: values.admin,
//       to: values.user1Key,
//       tokenMint: values.mintBKeypair.publicKey,
//       amount: 10**5,
//     });

//     await program.methods.createPool(values.fee)
//       .accounts({
//         amm: values.ammKey,
//         pool: values.poolKey,
//         poolAuthority: values.poolAuthority,
//         mintLiquidity: values.mintLiquidity,
//         mintA: values.mintAKeypair.publicKey,
//         mintB: values.mintBKeypair.publicKey,
//         poolAccountA: values.poolAccountA,
//         poolAccountB: values.poolAccountB,
//         lenderLendingBlockHeightTokenMint: values.lenderLendingBlockHeightTokenMint,
//         borrowerBorrowBlockHeightTokenMint: values.borrowerBorrowBlockHeightTokenMint,
//       } as any)
//       .rpc();
//   });

//   it('Create lending pool', async () => {
//     try {
//       const sim = await program.methods.createLendingPool()
//         .accounts({
//           pool: values.poolKey,
//           mintA: values.mintAKeypair.publicKey,
//           mintB: values.mintBKeypair.publicKey,
//           lendingPool: values.lendingPoolKey,
//           lendingPoolAuthority: values.lendingPoolAuthority,
//           lendingReceiptTokenMint: values.lendingReceiptTokenMint,
//           borrowReceiptTokenMint: values.borrowReceiptTokenMint,
//           collateralReceiptTokenMint: values.collateralReceiptTokenMint,
//         })
//         .simulate({ skipPreflight: true });
//       console.log("Simulation logs:", sim);

//       const tx = await program.methods.createLendingPool()
//         .accounts({
//           pool: values.poolKey,
//           mintA: values.mintAKeypair.publicKey,
//           mintB: values.mintBKeypair.publicKey,
//           lendingPool: values.lendingPoolKey,
//           lendingPoolAuthority: values.lendingPoolAuthority,
//           lendingPoolTokenA: values.lendingPoolAccountA,
//           lendingPoolTokenB: values.lendingPoolAccountB,
//           lendingReceiptTokenMint: values.lendingReceiptTokenMint,
//           borrowReceiptTokenMint: values.borrowReceiptTokenMint,
//           collateralReceiptTokenMint: values.collateralReceiptTokenMint,
//         } as any)
//         .rpc();

//       console.log("Transaction signature:", tx);

//       const txInfo = await connection.getTransaction(tx, {
//         commitment: 'confirmed',
//         maxSupportedTransactionVersion: 0
//       });

//       if (txInfo?.meta?.logMessages) {
//         console.log("Program Logs:");
//         txInfo.meta.logMessages.forEach(log => {
//           console.log(log);
//         });
//       }
//     } catch (error) {
//       console.error("Error:", error);
//     }
//   });
// });