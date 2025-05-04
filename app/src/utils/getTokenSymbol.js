import { Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { web3 } from '@coral-xyz/anchor';
import { programs } from "@metaplex/js"

const Metadata = require("@metaplex-foundation/mpl-token-metadata");

interface TokenMetadata {
  name: string;
  symbol: string;
}

export const getTokenSymbol = async (
  connection: Connection,
  mintAddress: string,
): Promise<TokenMetadata> => {
  try {
    const tokenMetadata = programs.metadata.Metadata.findByOwnerV2(connection, walletPublicKey);


    let pda = await getMetadataPDA(mintAddress);
    const metadataPda = Metadata.fromAccountAddress(connection, new PublicKey(mintAddress));
    const account = await Metadata.fromAccountAddress(connection, metadataPda);

    return {
      name: account.data.name,
      symbol: account.data.symbol,
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    throw error;
  }
};

async function getMetadataPDA(mint) 
{
  const [publicKey] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("metadata"), 
    Metadata.PROGRAM_ID.toBuffer(), 
    mint.toBuffer()],
    Metadata.PROGRAM_ID
  );
  return publicKey;
}