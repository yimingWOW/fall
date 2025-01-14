import { Connection, PublicKey } from '@solana/web3.js';

const tokenCache = new Map<string, string>();

export async function getTokenInfo(
  connection: Connection, 
  mintAddress: string
): Promise<string> {
  try {
    if (tokenCache.has(mintAddress)) {
      return tokenCache.get(mintAddress)!;
    }
    const Metadata = require("@metaplex-foundation/mpl-token-metadata");
    let mintPubkey = new PublicKey("9MwGzSyuQRqmBHqmYwE6wbP3vzRBj4WWiYxWns3rkR7A");
    let tokenmetaPubkey = await Metadata.getPDA(mintPubkey);
    const tokenmeta = await Metadata.load(connection, tokenmetaPubkey);

    if (tokenmeta.symbol) {
      tokenCache.set(mintAddress, tokenmeta.symbol);
      return tokenmeta.symbol;
    }

    return mintAddress.slice(0, 4) + '...' + mintAddress.slice(-4);
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return mintAddress.slice(0, 4) + '...' + mintAddress.slice(-4);
  }
}