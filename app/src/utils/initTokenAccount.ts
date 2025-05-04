import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { AnchorWallet } from '@solana/wallet-adapter-react';

export async function initTokenAccount(
  connection: Connection,
  wallet: AnchorWallet,
  tokenMint: PublicKey
): Promise<PublicKey> {
  const associatedTokenAddress = await getAssociatedTokenAddress(tokenMint, wallet.publicKey, true);
  const instruction = createAssociatedTokenAccountInstruction(
    wallet.publicKey,
    associatedTokenAddress,
    wallet.publicKey,
    tokenMint
  );

  const transaction = new Transaction();
  transaction.add(instruction);

  const latestBlockhash = await connection.getLatestBlockhash();
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.feePayer = wallet.publicKey;

  try {
    const signedTx = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize());

    await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    }, 'confirmed');

    return associatedTokenAddress;
  } catch (error) {
    console.error('Error initializing token account:', error);
    throw error;
  }
}