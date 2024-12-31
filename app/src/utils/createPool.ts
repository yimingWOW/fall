import * as anchor from '@coral-xyz/anchor';
import { web3 } from '@project-serum/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';
import { 
  AUTHORITY_SEED,
  LIQUIDITY_SEED,
} from '../utils/constants';
import { Idl } from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';

export async function createPool(
  wallet: AnchorWallet,
  connection: Connection,
  ammPda: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
  fee: number,
) {
  try {
    console.log('Creating pool connection:', connection);
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { 
        commitment: "confirmed",
        preflightCommitment: "confirmed" 
      }
    );

    const program = new anchor.Program(
      fallIdl as Idl,
      provider
    );

    // Pool PDA
    const [poolPda] = PublicKey.findProgramAddressSync(
      [ammPda.toBuffer(), mintA.toBuffer(), mintB.toBuffer()],
      program.programId
    );

    // Pool Authority PDA
    const [poolAuthorityPda] = PublicKey.findProgramAddressSync(
      [ammPda.toBuffer(), mintA.toBuffer(), mintB.toBuffer(), Buffer.from(AUTHORITY_SEED)],
      program.programId
    );

    // Liquidity Mint PDA
    const [liquidityMintPda] = PublicKey.findProgramAddressSync(
      [ammPda.toBuffer(), mintA.toBuffer(), mintB.toBuffer(), Buffer.from(LIQUIDITY_SEED)],
      program.programId
    );

    // Pool Token Accounts
    const poolAccountA = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: poolAuthorityPda
    });

    const poolAccountB = await anchor.utils.token.associatedAddress({
      mint: mintB,
      owner: poolAuthorityPda
    });
  
  // 打印所有账户
  const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ 
    units: 1_000_000  // 增加到 1M 单位
  });
  const tx = await program.methods
      .createPool(fee)
      .accounts({
        amm: ammPda,
        mintA: mintA,
        mintB: mintB,
        pool: poolPda,
        poolAuthority: poolAuthorityPda,
        mintLiquidity: liquidityMintPda,
        poolAccountA: poolAccountA,
        poolAccountB: poolAccountB,
        payer: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).preInstructions([modifyComputeUnits]).rpc({
        commitment: 'confirmed',
      });

    console.log('Transaction signature:', tx);
    return {
      tx,
      poolPda,
      poolAuthorityPda,
      liquidityMintPda,
      poolAccountA,
      poolAccountB,
    };
  } catch (error) {
    console.error('Error', error);
  }
}