import * as anchor from '@coral-xyz/anchor';
import { 
  createMint, 
  getAssociatedTokenAddressSync, 
  getOrCreateAssociatedTokenAccount, 
  mintTo,
  transfer
} from '@solana/spl-token';
import { 
  Connection, 
  Keypair, 
  LAMPORTS_PER_SOL,
  PublicKey
} from '@solana/web3.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

const aimAddress1 = new PublicKey('GUXNPX5ci1Qj76MZe2aRJ33zK48VmT6gXVyR86CsF4T5');
const aimAddress2 = new PublicKey('2mXXs3ZLK7UpDDwHmJajcMTT3YRkg4Ymo9osQSUu8CAu');

async function main() {
  const connection = new Connection('http://localhost:8899', 'confirmed');
  // const connection = new Connection(
  //   'https://api.devnet.solana.com',
  //   {
  //     commitment: 'confirmed',
  //     confirmTransactionInitialTimeout: 600000 ,// 60 seconds
  //     wsEndpoint: 'wss://api.devnet.solana.com/' // 添加 WebSocket 端点
  //   }
  // );  
  
  // 加载默认钱包
  const userHomeDir = os.homedir();
  const walletPath = path.join(userHomeDir, '.config', 'solana', 'id.json');
  
  if (!fs.existsSync(walletPath)) {
    throw new Error('Default Solana wallet not found! Please create one using "solana-keygen new"');
  }

  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );
  
  console.log('Using wallet:', walletKeypair.publicKey.toString());

  // 创建两个代币
  console.log('Creating Token A...');
  const mintAKeypair = Keypair.generate();
  console.log('Secret Key:', Array.from(mintAKeypair.secretKey)); // 转换为普通数组以便复制
  await createMint(
    connection,
    walletKeypair,
    walletKeypair.publicKey,
    walletKeypair.publicKey,
    6,
    mintAKeypair
  );

  console.log('Creating Token B...');
  const mintBKeypair = Keypair.generate();
  console.log('Secret Key:', Array.from(mintBKeypair.secretKey)); // 转换为普通数组以便复制
  await createMint(
    connection,
    walletKeypair,
    walletKeypair.publicKey,
    walletKeypair.publicKey,
    6,
    mintBKeypair
  );

  // 创建代币账户并铸造代币
  console.log('Creating token accounts and minting tokens...');
  const mintAmount = 1000000000; // 1000 tokens with 6 decimals

  const accountA = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    mintAKeypair.publicKey,
    walletKeypair.publicKey,
    true
  );

  const accountB = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    mintBKeypair.publicKey,
    walletKeypair.publicKey,
    true
  );

  await mintTo(
    connection,
    walletKeypair,
    mintAKeypair.publicKey,
    accountA.address,
    walletKeypair,
    mintAmount * 2 // 铸造双倍数量，一半用于转账
  );

  await mintTo(
    connection,
    walletKeypair,
    mintBKeypair.publicKey,
    accountB.address,
    walletKeypair,
    mintAmount * 2 // 铸造双倍数量，一半用于转账
  );

  // 为目标地址创建代币账户并转账
  console.log('Creating target accounts and transferring tokens...');
  
  // 为目标地址创建代币账户
  const targetAccountA1 = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    mintAKeypair.publicKey,
    aimAddress1,
    true
  );
  const targetAccountB1 = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    mintBKeypair.publicKey,
    aimAddress1,
    true
  );

  const targetAccountA2 = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    mintAKeypair.publicKey,
    aimAddress2,
    true
  );
  const targetAccountB2 = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    mintBKeypair.publicKey,
    aimAddress2,
    true
  );

  // 转账 Token A 转账 Token B
  console.log('Transferring Token A...');
  await transfer(
    connection,
    walletKeypair,
    accountA.address,
    targetAccountA1.address,
    walletKeypair.publicKey,
    mintAmount
  );
  console.log('Transferring Token B...');
  await transfer(
    connection,
    walletKeypair,
    accountB.address,
    targetAccountB1.address,
    walletKeypair.publicKey,
    mintAmount
  );
  console.log('Transferring Token A...');
  await transfer(
    connection,
    walletKeypair,
    accountA.address,
    targetAccountA2.address,
    walletKeypair.publicKey,
    mintAmount
  );
  console.log('Transferring Token B...');
  await transfer(
    connection,
    walletKeypair,
    accountB.address,
    targetAccountB2.address,
    walletKeypair.publicKey,
    mintAmount
  );


  // 保存代币信息
  const tokenInfo = {
    wallet: walletKeypair.publicKey.toString(),
    tokenA: {
      mint: mintAKeypair.publicKey.toString(),
      account: accountA.address.toString(),
      targetAccount1: targetAccountA1.address.toString(),
      targetAccount2: targetAccountA2.address.toString()
    },
    tokenB: {
      mint: mintBKeypair.publicKey.toString(),
      account: accountB.address.toString(),
      targetAccount1: targetAccountB1.address.toString(),
      targetAccount2: targetAccountB2.address.toString()
    },
    targetWallet1: aimAddress1.toString(),
    targetWallet2: aimAddress2.toString()
  };

  fs.writeFileSync('./scripts/token-info.json', JSON.stringify(tokenInfo, null, 2));

  // 打印余额确认
  const walletBalanceA = await connection.getTokenAccountBalance(accountA.address);
  const walletBalanceB = await connection.getTokenAccountBalance(accountB.address);
  const targetBalanceA1 = await connection.getTokenAccountBalance(targetAccountA1.address);
  const targetBalanceB1 = await connection.getTokenAccountBalance(targetAccountB1.address);
  const targetBalanceA2 = await connection.getTokenAccountBalance(targetAccountA2.address);
  const targetBalanceB2 = await connection.getTokenAccountBalance(targetAccountB2.address);
  
  console.log('\nFinal balances:');
  console.log(`Wallet Token A balance: ${walletBalanceA.value.uiAmount}`);
  console.log(`Wallet Token B balance: ${walletBalanceB.value.uiAmount}`);
  console.log(`Target Token A balance: ${targetBalanceA1.value.uiAmount}`);
  console.log(`Target Token B balance: ${targetBalanceB1.value.uiAmount}`);
  console.log(`Target Token A balance: ${targetBalanceA2.value.uiAmount}`);
  console.log(`Target Token B balance: ${targetBalanceB2.value.uiAmount}`);

  console.log('\nToken information saved to token-info.json');
  console.log('Mints created:');
  console.log(`Token A: ${mintAKeypair.publicKey.toString()}`);
  console.log(`Token B: ${mintBKeypair.publicKey.toString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});