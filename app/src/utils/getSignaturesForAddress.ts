import { Connection, PublicKey } from '@solana/web3.js';

export async function getAccountsByInstruction(connection: Connection, programId: string) {
    const programPubkey = new PublicKey(programId);
    
    // 获取程序的最近签名
    const signatures = await connection.getSignaturesForAddress(programPubkey);
    
    const uniqueAccounts = new Set();
    
    // 遍历交易
    for (const sig of signatures) {
        const tx = await connection.getTransaction(sig.signature);
        if (!tx || !tx.meta) continue;
        
        // 获取交易中的账户
        tx.transaction.message.accountKeys.forEach(account => {
            uniqueAccounts.add(account.toString());
            console.log(account.toString());
        });
    }
    
    return Array.from(uniqueAccounts);
}