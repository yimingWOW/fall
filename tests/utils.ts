import * as anchor from '@coral-xyz/anchor';
import { createMint, getAssociatedTokenAddressSync, 
  getOrCreateAssociatedTokenAccount, mintTo, 
  createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import { type Connection, Keypair, PublicKey, sendAndConfirmTransaction, type Signer, Transaction } from '@solana/web3.js';

export async function sleep(seconds: number) {
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export const generateSeededKeypair = (seed: string) => {
  return Keypair.fromSeed(anchor.utils.bytes.utf8.encode(anchor.utils.sha256.hash(seed)).slice(0, 32));
};

export const expectRevert = async (promise: Promise<any>) => {
  try {
    await promise;
    throw new Error('Expected a revert');
  } catch {
    return;
  }
};

export const mintingTokens = async ({
  connection,
  creator,
  holder = creator,
  mintAKeypair,
  mintBKeypair,
  mintedAmount = 100,
  decimals = 6,
}: {
  connection: Connection;
  creator: Signer;
  holder?: Signer;
  mintAKeypair: Keypair;
  mintBKeypair: Keypair;
  mintedAmount?: number;
  decimals?: number;
}) => {
  // Mint tokens
  await connection.confirmTransaction(await connection.requestAirdrop(creator.publicKey, 10 ** 10));
  await createMint(connection, creator, creator.publicKey, creator.publicKey, decimals, mintAKeypair);
  await createMint(connection, creator, creator.publicKey, creator.publicKey, decimals, mintBKeypair);
  await getOrCreateAssociatedTokenAccount(connection, holder, mintAKeypair.publicKey, holder.publicKey, true);
  await getOrCreateAssociatedTokenAccount(connection, holder, mintBKeypair.publicKey, holder.publicKey, true);
  await mintTo(
    connection,
    creator,
    mintAKeypair.publicKey,
    getAssociatedTokenAddressSync(mintAKeypair.publicKey, holder.publicKey, true),
    creator.publicKey,
    mintedAmount * 10 ** decimals,
  );
  await mintTo(
    connection,
    creator,
    mintBKeypair.publicKey,
    getAssociatedTokenAddressSync(mintBKeypair.publicKey, holder.publicKey, true),
    creator.publicKey,
    mintedAmount * 10 ** decimals,
  );
};


export async function transferTokens({
  connection,
  from,  // admin
  to,    // user
  tokenMint,
  amount,
}: {
  connection: Connection;
  from: Keypair;
  to: PublicKey;
  tokenMint: PublicKey;
  amount: number;
}) {
  const fromATA = getAssociatedTokenAddressSync(tokenMint, from.publicKey);
  const toATA = getAssociatedTokenAddressSync(tokenMint, to);
  const createATAInstructions = [];
  if (!(await connection.getAccountInfo(toATA))) {
    createATAInstructions.push(
      createAssociatedTokenAccountInstruction(
        from.publicKey,
        toATA,
        to,
        tokenMint
      )
    );
  }

  const transferInstructions = [
    createTransferInstruction(
      fromATA,
      toATA,
      from.publicKey,
      amount
    ),
  ];

  const tx = new Transaction()
    .add(...createATAInstructions)
    .add(...transferInstructions);

  await sendAndConfirmTransaction(connection, tx, [from]);
}