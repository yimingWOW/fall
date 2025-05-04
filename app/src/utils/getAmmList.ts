import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import * as anchor from '@coral-xyz/anchor';
import fallIdl from '../idl/fall.json';
import { Idl } from '@coral-xyz/anchor';

export interface AmmInfo {
  pubkey: string;
  ammid: string;
  admin: string;
}

export const getAmmAccounts = async (
  wallet: AnchorWallet,
  connection: Connection
): Promise<AmmInfo[]> => {
  console.log('Getting AMM accounts connection:', connection);
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    { preflightCommitment: "confirmed" }
  );

  const program = new anchor.Program(
    (fallIdl as any) as Idl,
    provider
  ) as any;

  const accounts = await program.account.amm.all();
  for (const account of accounts) {
    console.log('AMM Account Details:', {
        publicKey: account.publicKey.toString(),
        id: account.account.id.toString(),
        admin: account.account.admin.toString()
    });
  }
  
  return accounts.map((account: any) => ({
    pubkey: account.publicKey.toString(),
    ammid: account.account.id.toString(),
    admin: account.account.admin.toString()
  }));
}; 