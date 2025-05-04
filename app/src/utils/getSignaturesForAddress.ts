import { Connection, PublicKey, SignaturesForAddressOptions } from '@solana/web3.js';

export async function getAccountsByInstruction(
    connection: Connection, 
    programId: string,
): Promise<PublicKey[]> {
    const programPubkey = new PublicKey(programId);
    
    // 设置查询选项，只获取最新的10条交易
    const options: SignaturesForAddressOptions = {
        limit: 10
    };
    
    // 获取最新的10条签名
    const signatures = await connection.getSignaturesForAddress(programPubkey, options);
    
    const uniqueSignerAddresses = new Set<string>();
    
    // 遍历交易
    for (const sig of signatures) {
        const tx = await connection.getTransaction(sig.signature);
        if (!tx || !tx.meta) continue;
        
        tx.transaction.message.accountKeys.forEach((account, index) => {
            if (tx.transaction.message.isAccountSigner(index)) {
                uniqueSignerAddresses.add(account.toBase58());
            }
        });
    }
    
    console.log('Recent transactions:', signatures.length);
    console.log('Unique signers:', uniqueSignerAddresses.size);
    
    return Array.from(uniqueSignerAddresses).map(address => new PublicKey(address));
}