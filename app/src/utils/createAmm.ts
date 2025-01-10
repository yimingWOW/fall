import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import fallIdl from '../idl/fall.json';

export async function createAmm(
  wallet: any,
  connection: Connection,
  ammId: PublicKey,
) {
  try {
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: "confirmed" }
    );

    const program = new anchor.Program(
      fallIdl,
      provider
    );

    const [ammPda] = PublicKey.findProgramAddressSync(
      [ammId.toBuffer()],
      program.programId
    );

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