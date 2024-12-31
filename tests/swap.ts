// import * as anchor from '@coral-xyz/anchor';
// import type { Program } from '@coral-xyz/anchor';
// import { BN } from 'bn.js';
// import type { Fall } from '../target/types/fall';
// import {  createValues, type TestValues } from './mock_value';
// import { transferTokens, mintingTokens } from './utils';

// describe('Swap', () => {
//   const provider = anchor.AnchorProvider.env();
//   const connection = provider.connection;
//   anchor.setProvider(provider);
//   const program = anchor.workspace.Fall as Program<Fall>;
//   let values: TestValues;

//   beforeEach(async () => {
//     values = createValues();

//     await program.methods.createAmm(values.id).accounts({
//         amm:values.ammKey, 
//         admin: values.admin.publicKey
//          } as any).rpc();

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
//         connection,
//         from: values.admin,
//         to: values.user1Key,
//         tokenMint: values.mintBKeypair.publicKey,
//         amount: 10**5,
//       });

//     await program.methods.createPool( values.fee).accounts({
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

//       await program.methods.depositLiquidity(new BN(10000), new BN(10000)).accounts({
//         pool: values.poolKey,
//         poolAuthority: values.poolAuthority,
//         depositor: values.user1Key,
//         mintLiquidity: values.mintLiquidity,
//         mintA: values.mintAKeypair.publicKey,
//         mintB: values.mintBKeypair.publicKey,
//         poolAccountA: values.poolAccountA,
//         poolAccountB: values.poolAccountB,
//         depositorAccountLiquidity: values.user1LiquidityAccount,
//         depositorAccountA: values.user1TokenAAccount,
//         depositorAccountB: values.user1TokenBAccount,
//     }).signers([values.user1]).rpc();

//   });

//   it('Swap from A to B', async () => {
//     try{
//       const sim = await program.methods.swapExactTokensForTokens(false, new BN(100), new BN(1)).accounts({
//         amm: values.ammKey,
//         pool: values.poolKey,
//         poolAuthority: values.poolAuthority,
//         mintA: values.mintAKeypair.publicKey,
//         mintB: values.mintBKeypair.publicKey,
//         poolAccountA: values.poolAccountA,
//         poolAccountB: values.poolAccountB,
//         lendingPool: values.lendingPoolKey,
//         lendingPoolAuthority: values.lendingPoolAuthority,
//         borrowReceiptTokenMint: values.borrowReceiptTokenMint,
//         collateralReceiptTokenMint: values.collateralReceiptTokenMint,
//         trader: values.user1Key,
//         traderAccountA: values.user1TokenAAccount,
//         traderAccountB: values.user1TokenBAccount,
//         borrower: values.user1Key,
//         borrowerBorrowReceiptToken: values.user1BorrowReceiptToken,
//         borrowerCollateralReceiptToken: values.user1CollateralReceiptToken,
//       } as any).simulate();
//       console.log("Simulation result:", sim);

//       const tx = await program.methods.swapExactTokensForTokens(false, new BN(100), new BN(1)).accounts({
//           amm: values.ammKey,
//           pool: values.poolKey,
//           poolAuthority: values.poolAuthority,
//           mintA: values.mintAKeypair.publicKey,
//           mintB: values.mintBKeypair.publicKey,
//           poolAccountA: values.poolAccountA,
//           poolAccountB: values.poolAccountB,
//           lendingPool: values.lendingPoolKey,
//           lendingPoolAuthority: values.lendingPoolAuthority,
//           borrowReceiptTokenMint: values.borrowReceiptTokenMint,
//           collateralReceiptTokenMint: values.collateralReceiptTokenMint,
//           trader: values.user1Key,
//           traderAccountA: values.user1TokenAAccount,
//           traderAccountB: values.user1TokenBAccount,
//           borrower: values.user1Key,
//           borrowerBorrowReceiptToken: values.user1BorrowReceiptToken,
//           borrowerCollateralReceiptToken: values.user1CollateralReceiptToken,
//         }).signers([values.user1]).rpc();

//       console.log("Transaction signature:", tx);
//       const txDetails = await connection.getTransaction(tx, {
//         commitment: "confirmed",
//         maxSupportedTransactionVersion: 0,
//       });
//       console.log("Program logs:", txDetails?.meta?.logMessages);
//     }catch(e){
//       console.log("Error:", e);
//     }
//   });
// });