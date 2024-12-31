import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import fallIdl from '../idl/fall.json';

export async function createAmm(
  wallet: any,
  connection: Connection,
  ammId: PublicKey,
) {
  try {
    console.log('Step 1: Creating provider');
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: "confirmed" }
    );

    console.log('Step 2: Creating Program instance');
    // 根据构造函数定义修正
    const program = new anchor.Program(
      fallIdl,
      provider
    );

    console.log('Step 3: Finding PDA');
    const [ammPda] = PublicKey.findProgramAddressSync(
      [ammId.toBuffer()],
      program.programId
    );

    console.log('Step 4: Sending transaction');
    const tx = await program.methods
      .createAmm(ammId)
      .accounts({
        amm: ammPda,
        admin: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }).rpc();

    return tx;
  } catch (error) {
    console.error('Error details:', error);
    throw error;
  }
}