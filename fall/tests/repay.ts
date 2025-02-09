import * as anchor from '@coral-xyz/anchor';
import type { Program } from '@coral-xyz/anchor';
import type { Fall } from '../target/types/fall';
import { type TestValues, createValues } from './mock_value';
import { transferTokens, mintingTokens } from './utils';
import BN from 'bn.js';

describe('test repay', () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);
  const program = anchor.workspace.Fall as Program<Fall>;
  let values: TestValues;
  const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000});

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

        await program.methods.createPool().accounts({
            amm: values.ammKey,
            pool: values.poolKey,
            poolAuthority: values.poolAuthority,
            mintLiquidity: values.mintLiquidity,
            mintA: values.mintAKeypair.publicKey,
            mintB: values.mintBKeypair.publicKey,
            poolAccountA: values.poolAccountA,
            poolAccountB: values.poolAccountB,
        } as any).rpc();

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

        await program.methods.initLendingPool1().accounts({
            pool: values.poolKey,
            mintA: values.mintAKeypair.publicKey,
            mintB: values.mintBKeypair.publicKey,
            lendingPoolAuthority: values.lendingPoolAuthority,
            lendingPoolTokenA: values.lendingPoolAccountA,
            lendingPoolTokenB: values.lendingPoolAccountB,
        } as any).rpc();

        await program.methods.initLendingPool2().accounts({
            pool: values.poolKey,
            lendingPoolAuthority: values.lendingPoolAuthority,
            lendingReceiptTokenMint: values.lendingReceiptTokenMint,
            borrowReceiptTokenMint: values.borrowReceiptTokenMint,
            collateralReceiptTokenMint: values.collateralReceiptTokenMint,
        } as any).rpc();

        await program.methods.initLendingPool3().accounts({
            pool: values.poolKey,
            lendingPoolAuthority: values.lendingPoolAuthority,
            lenderLendingBlockHeightTokenMint: values.lenderLendingBlockHeightTokenMint,
            borrowerBorrowBlockHeightTokenMint: values.borrowerBorrowBlockHeightTokenMint,
        } as any).rpc();

        await program.methods.lend(new BN(10000)).accounts({
            pool: values.poolKey,
            lendingPoolAuthority: values.lendingPoolAuthority,
            lendingPoolTokenA: values.lendingPoolAccountA,
            lendingReceiptTokenMint: values.lendingReceiptTokenMint,
            lenderLendingBlockHeightTokenMint: values.lenderLendingBlockHeightTokenMint,
            lender: values.user1Key,
            lenderTokenA: values.user1TokenAAccount,
            lenderLendReceiptToken: values.user1LendReceiptToken,
            lenderLendingBlockHeightReceiptToken: values.user1LenderLendingBlockHeightReceiptToken,
        }).signers([values.user1]).rpc();

        await program.methods.depositCollateral(new BN(200)).accounts({
            pool: values.poolKey,
            lendingPoolAuthority: values.lendingPoolAuthority,
            lendingPoolTokenB: values.lendingPoolAccountB,
            collateralReceiptTokenMint: values.collateralReceiptTokenMint,
            borrower: values.user2Key,
            borrowerTokenB: values.user2TokenBAccount,
            borrowerAuthority: values.user2Authority,
            borrowerCollateralReceiptToken: values.user2CollateralReceiptToken,
        } as any).signers([values.user2]).rpc();

        await program.methods.borrow(new BN(100)).accounts({
            pool: values.poolKey,
            lendingPoolAuthority: values.lendingPoolAuthority,
            lendingPoolTokenA: values.lendingPoolAccountA,
            borrowReceiptTokenMint: values.borrowReceiptTokenMint,
            collateralReceiptTokenMint: values.collateralReceiptTokenMint,
            borrowerBorrowBlockHeightTokenMint: values.borrowerBorrowBlockHeightTokenMint,
            borrower: values.user2Key,
            borrowerTokenA: values.user2TokenAAccount,
            borrowerTokenB: values.user2TokenBAccount,
            borrowerAuthority: values.user2Authority,
            borrowerBorrowReceiptToken: values.user2BorrowReceiptToken,
            borrowerCollateralReceiptToken: values.user2CollateralReceiptToken,
            borrowerBorrowBlockHeightReceiptToken: values.user2BorrowerBorrowBlockHeightReceiptToken,
        } as any).signers([values.user2]).preInstructions([modifyComputeUnits]).rpc();
    });

    it('test repay', async () => {
        try{
            const sim = await program.methods.repay().accounts({
                mintA: values.mintAKeypair.publicKey,
                mintB: values.mintBKeypair.publicKey,
                pool: values.poolKey,
                poolAuthority: values.poolAuthority,
                lendingPoolAuthority: values.lendingPoolAuthority,
                lendingPoolTokenA: values.lendingPoolAccountA,
                lendingPoolTokenB: values.lendingPoolAccountB,
                borrowReceiptTokenMint: values.borrowReceiptTokenMint,
                collateralReceiptTokenMint: values.collateralReceiptTokenMint,
                borrowerBorrowBlockHeightTokenMint: values.borrowerBorrowBlockHeightTokenMint,
                borrower: values.user2Key,
                borrowerAuthority: values.user2Authority,
                borrowerTokenA: values.user2TokenAAccount,
                borrowerTokenB: values.user2TokenBAccount,
                borrowerBorrowReceiptToken: values.user2BorrowReceiptToken,
                borrowerCollateralReceiptToken: values.user2CollateralReceiptToken,
                borrowerBorrowBlockHeightReceiptToken: values.user2BorrowerBorrowBlockHeightReceiptToken,
            } as any) .preInstructions([modifyComputeUnits])   .simulate();
            console.log("Simulation logs:", sim);

            const tx = await program.methods.repay().accounts({
                mintA: values.mintAKeypair.publicKey,
                mintB: values.mintBKeypair.publicKey,
                pool: values.poolKey,
                poolAuthority: values.poolAuthority,
                lendingPoolAuthority: values.lendingPoolAuthority,
                lendingPoolTokenA: values.lendingPoolAccountA,
                lendingPoolTokenB: values.lendingPoolAccountB,
                borrowReceiptTokenMint: values.borrowReceiptTokenMint,
                collateralReceiptTokenMint: values.collateralReceiptTokenMint,
                borrowerBorrowBlockHeightTokenMint: values.borrowerBorrowBlockHeightTokenMint,
                borrower: values.user2Key,
                borrowerTokenA: values.user2TokenAAccount,
                borrowerTokenB: values.user2TokenBAccount,
                borrowerBorrowReceiptToken: values.user2BorrowReceiptToken,
                borrowerCollateralReceiptToken: values.user2CollateralReceiptToken,
                borrowerBorrowBlockHeightReceiptToken: values.user2BorrowerBorrowBlockHeightReceiptToken,
            } as any) .preInstructions([modifyComputeUnits]).signers([values.user2]).rpc();

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