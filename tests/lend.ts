import * as anchor from '@coral-xyz/anchor';
import type { Program } from '@coral-xyz/anchor';
import type { Fall } from '../target/types/fall';
import {  createValues, type TestValues } from './mock_value';
import { mintingTokens, transferTokens } from './utils';
import BN from 'bn.js';
describe('Lend', () => {
    const provider = anchor.AnchorProvider.env();
    const connection = provider.connection;
    anchor.setProvider(provider);
    const program = anchor.workspace.Fall as Program<Fall>;
    let values: TestValues;

    beforeEach(async () => {    
        values = createValues();
        const adminBalance = await connection.getBalance(values.admin.publicKey);
        console.log("Admin SOL balance before:", adminBalance);
        await program.methods.createAmm(values.id).accounts({ amm: values.ammKey, admin: values.admin.publicKey }).rpc();

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

        await program.methods.createPool(values.fee)
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
        } as any).rpc();

        await program.methods.initLendingPool2()
        .accounts({
            pool: values.poolKey,
            lendingPoolAuthority: values.lendingPoolAuthority,
            lendingReceiptTokenMint: values.lendingReceiptTokenMint,
            borrowReceiptTokenMint: values.borrowReceiptTokenMint,
            collateralReceiptTokenMint: values.collateralReceiptTokenMint,
        } as any).rpc();

        await program.methods.initLendingPool3()
        .accounts({
            pool: values.poolKey,
            lendingPoolAuthority: values.lendingPoolAuthority,
            lenderLendingBlockHeightTokenMint: values.lenderLendingBlockHeightTokenMint,
            borrowerBorrowBlockHeightTokenMint: values.borrowerBorrowBlockHeightTokenMint,
        } as any).rpc();
    });

    it('lend', async () => {
        try {
            const sim = await program.methods.lend(new BN(100)).accounts({
                pool: values.poolKey,
                lendingPoolAuthority: values.lendingPoolAuthority,
                lendingPoolTokenA: values.lendingPoolAccountA,
                lendingReceiptTokenMint: values.lendingReceiptTokenMint,
                lenderLendingBlockHeightTokenMint: values.lenderLendingBlockHeightTokenMint,
                lender: values.user1Key,
                lenderAuthority: values.user1Authority,
                lenderTokenA: values.user1TokenAAccount,
                lenderLendReceiptToken: values.user1LendReceiptToken,
                lenderLendingBlockHeightReceiptToken: values.user1LenderLendingBlockHeightReceiptToken,
            }).simulate();
            console.log("Simulation logs:", sim);

            await program.methods.lend(new BN(100)).accounts({
                pool: values.poolKey,
                lendingPoolAuthority: values.lendingPoolAuthority,
                lendingPoolTokenA: values.lendingPoolAccountA,
                lendingReceiptTokenMint: values.lendingReceiptTokenMint,
                lenderLendingBlockHeightTokenMint: values.lenderLendingBlockHeightTokenMint,
                lender: values.user1Key,
                lenderAuthority: values.user1Authority,
                lenderTokenA: values.user1TokenAAccount,
                lenderLendReceiptToken: values.user1LendReceiptToken,
                lenderLendingBlockHeightReceiptToken: values.user1LenderLendingBlockHeightReceiptToken,
            }).signers([values.user1]).rpc();

        } catch (error) {   
        console.log("Error:", error);
        }
    });
});
