import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import fallIdl from '../idl/fall.json';


export async function getPoolPrice(
  connection: Connection,
  pool: {
    pubkey: string;
    amm: string;
    mintA: string;
    mintB: string;
  }
): Promise<{
  aToB: number;
  bToA: number;
  reserveA: number;
  reserveB: number;
}> {
  try {
    // 获取池子权限账户
    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [
        new PublicKey(pool.amm).toBuffer(),
        new PublicKey(pool.mintA).toBuffer(),
        new PublicKey(pool.mintB).toBuffer(),
        Buffer.from("authority")
      ],
      new PublicKey(fallIdl.address)
    );

    // 获取代币账户
    const poolAccountA = await getAssociatedTokenAddress(
      new PublicKey(pool.mintA),
      poolAuthority,
      true
    );

    const poolAccountB = await getAssociatedTokenAddress(
      new PublicKey(pool.mintB),
      poolAuthority,
      true
    );

    // 获取池子中的代币余额
    const accountA = await getAccount(connection, poolAccountA);
    const accountB = await getAccount(connection, poolAccountB);

    const reserveA = Number(accountA.amount);
    const reserveB = Number(accountB.amount);

    // 计算价格比率 (考虑精度为6)
    const aToB = reserveB / reserveA;
    const bToA = reserveA / reserveB;

    return {
      aToB: aToB,
      bToA: bToA,
      reserveA: reserveA ,
      reserveB: reserveB 
    };
  } catch (error) {
    console.error('Error getting pool price:', error);
    throw error;
  }
} 