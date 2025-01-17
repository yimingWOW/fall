import { Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { NATIVE_MINT, createSyncNativeInstruction, getAssociatedTokenAddress } from '@solana/spl-token';

export async function wrapSol(
  connection: Connection,
  wallet: any,
  amountInSol: number
) {
  try {
    // 1. 获取用户的 wSOL 关联账户地址
    const associatedTokenAccount = await getAssociatedTokenAddress(
      NATIVE_MINT,
      wallet.publicKey
    );

    const transaction = new Transaction();

    // 2. 转账SOL到关联账户
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: associatedTokenAccount,
        lamports: amountInSol * LAMPORTS_PER_SOL,
      })
    );

    // 3. 同步原生SOL余额
    transaction.add(createSyncNativeInstruction(associatedTokenAccount));

    // 4. 获取最新的 blockhash
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = wallet.publicKey;

    // 5. 发送并确认交易
    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction({
      signature,
      ...latestBlockhash
    });

    return signature;
  } catch (error) {
    console.error("Error wrapping SOL:", error);
    throw error;
  }
}
