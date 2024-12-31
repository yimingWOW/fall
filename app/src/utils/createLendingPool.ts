import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { 
  LENDING_SEED,
  LENDING_AUTHORITY_SEED,
  LENDING_TOKEN_SEED,
  BORROW_TOKEN_SEED,
  COLLATERAL_TOKEN_SEED,
} from '../utils/constants';

export async function createLendingPool(
  wallet: any,
  connection: Connection,
  poolPda: PublicKey,
) {
  try {
    console.log('Creating lending pool...');
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: "confirmed" }
    );

    const program = new anchor.Program(
      fallIdl,
      provider
    );

    console.log('Fetching pool info...');
    const pool = await program.account.pool.fetch(poolPda);
    console.log('Pool info:', {
      amm: pool.amm.toString(),
      mintA: pool.mintA.toString(),
      mintB: pool.mintB.toString(),
    });

    const mintA = pool.mintA;
    const mintB = pool.mintB;

    // 获取 Lending Pool PDA
    const [lendingPoolPda] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), mintA.toBuffer(), mintB.toBuffer(), Buffer.from(LENDING_SEED)],
      program.programId
    );

    // 获取 Lending Pool Authority PDA
    const [lendingPoolAuthorityPda] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), mintA.toBuffer(), mintB.toBuffer(), Buffer.from(LENDING_AUTHORITY_SEED)],
      program.programId
    );

    // 获取 Lending Receipt Token Mint PDA
    const [lendingReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), mintA.toBuffer(), Buffer.from(LENDING_TOKEN_SEED)],
      program.programId
    );

    // 获取 Borrow Receipt Token Mint PDA
    const [borrowReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), mintA.toBuffer(), Buffer.from(BORROW_TOKEN_SEED)],
      program.programId
    );

    // 获取 Collateral Receipt Token Mint PDA
    const [collateralReceiptTokenMint] = PublicKey.findProgramAddressSync(
      [poolPda.toBuffer(), mintB.toBuffer(), Buffer.from(COLLATERAL_TOKEN_SEED)],
      program.programId
    );

    // 获取 Lending Pool Token Accounts
    const lendingPoolAccountA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: lendingPoolAuthorityPda
    });

    const lendingPoolAccountB = await anchor.utils.token.associatedAddress({
      mint: mintB,
      owner: lendingPoolAuthorityPda
    });

    console.log('Sending transaction...');
    const createTx = await program.methods.createLendingPool().accounts({
        pool: poolPda,
        mintA: mintA,
        mintB: mintB,
        lendingPool: lendingPoolPda,
        lendingPoolAuthority: lendingPoolAuthorityPda,
        lendingPoolTokenA: lendingPoolAccountA,
        lendingPoolTokenB: lendingPoolAccountB,
        lendingReceiptTokenMint: lendingReceiptTokenMint,
        borrowReceiptTokenMint: borrowReceiptTokenMint,
        collateralReceiptTokenMint: collateralReceiptTokenMint,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,    
      }).rpc();

    // 等待交易确认
    await connection.confirmTransaction(createTx, 'confirmed');

    console.log('Step 2: Initializing lending pool...');
    const initTx = await program.methods.initLendingPool().accounts({
        pool: poolPda,
        mintA: mintA,
        mintB: mintB,
        lendingPool: lendingPoolPda,
        lendingPoolAuthority: lendingPoolAuthorityPda,
        lendingPoolTokenA: lendingPoolAccountA,
        lendingPoolTokenB: lendingPoolAccountB,
        lendingReceiptTokenMint: lendingReceiptTokenMint,
        borrowReceiptTokenMint: borrowReceiptTokenMint,
        collateralReceiptTokenMint: collateralReceiptTokenMint,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,    
    }).rpc();

    console.log('Init lending pool tx:', initTx);

    const [createTxInfo, initTxInfo] = await Promise.all([
      connection.getTransaction(createTx, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      }),
      connection.getTransaction(initTx, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      })
    ]);

    // 打印日志
    console.log("Create Transaction Logs:");
    createTxInfo?.meta?.logMessages?.forEach(log => {
      console.log(log);
    });

    console.log("Init Transaction Logs:");
    initTxInfo?.meta?.logMessages?.forEach(log => {
      console.log(log);
    });

    return {
      createTx,
      initTx,
      lendingPoolPda,
      lendingPoolAuthorityPda,
      lendingReceiptTokenMint,
      borrowReceiptTokenMint,
      collateralReceiptTokenMint,
      lendingPoolAccountA,
      lendingPoolAccountB
    };
  } catch (error) {
    console.error('Error in createLendingPool:', error);
    throw error;
  }
}