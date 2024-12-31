// import * as anchor from '@coral-xyz/anchor';
// import type { Program } from '@coral-xyz/anchor';
// import type { Fall } from '../target/types/fall';
// import {  createValues, type TestValues } from './mock_value';
// import { transferTokens, mintingTokens } from './utils';
// import { BN } from '@project-serum/anchor';

// describe('Deposit liquidity', () => {
//   const provider = anchor.AnchorProvider.env();
//   const connection = provider.connection;
//   anchor.setProvider(provider);
//   const program = anchor.workspace.Fall as Program<Fall>;
//   let values: TestValues;

//   beforeEach(async () => {
//     values = createValues();
//     await program.methods.createAmm(values.id).accounts({ amm: values.ammKey, admin: values.admin.publicKey }).rpc();
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

//     await program.methods.createPool(values.fee).accounts({
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
//     }).rpc();

//   });

//   it('Deposit equal amounts', async () => {
//     console.log(values.user1Key.toBase58());
//     try{
//         const sim = await program.methods.depositLiquidity(new BN(10 ** 3), new BN(10 ** 3)).accounts({
//             pool: values.poolKey,
//             poolAuthority: values.poolAuthority,
//             depositor: values.user1Key,
//             mintLiquidity: values.mintLiquidity,
//             mintA: values.mintAKeypair.publicKey,
//             mintB: values.mintBKeypair.publicKey,
//             poolAccountA: values.poolAccountA,
//             poolAccountB: values.poolAccountB,
//             depositorAccountLiquidity: values.user1LiquidityAccount,
//             depositorAccountA: values.user1TokenAAccount,
//             depositorAccountB: values.user1TokenBAccount,
//         }).simulate();;  
//         console.log("sim:", sim);

//         const tx = await program.methods.depositLiquidity(new BN(10 ** 3), new BN(10 ** 3)).accounts({
//             pool: values.poolKey,
//             poolAuthority: values.poolAuthority,
//             depositor: values.user1Key,
//             mintLiquidity: values.mintLiquidity,
//             mintA: values.mintAKeypair.publicKey,
//             mintB: values.mintBKeypair.publicKey,
//             poolAccountA: values.poolAccountA,
//             poolAccountB: values.poolAccountB,
//             depositorAccountLiquidity: values.user1LiquidityAccount,
//             depositorAccountA: values.user1TokenAAccount,
//             depositorAccountB: values.user1TokenBAccount,
//         }).signers([values.user1]).rpc();
//         console.log(tx);

//         const txDetails = await connection.getTransaction(tx, {
//             commitment: "confirmed",
//             maxSupportedTransactionVersion: 0
//         });
//         console.log("Program logs:", txDetails?.meta?.logMessages);
//     }catch(e){
//       console.log(e);
//     }
// });
// });
