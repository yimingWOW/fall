import { FC, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { createLendingPool } from '../utils/createLendingPool';

export const CreateLendingPoolForm: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string>("");
  const [formData, setFormData] = useState({
    poolId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLastTxSignature("");
    setIsLoading(true);

    if (!wallet) {
      setError("Please connect your wallet first");
      setIsLoading(false);
      return;
    }

    try {
      // 验证输入的公钥格式
      const poolPubkey = new PublicKey(formData.poolId);

      const result = await createLendingPool(
        wallet,
        connection,
        poolPubkey,
      );
      
      console.log(`Transaction URL: https://explorer.solana.com/tx/${result.tx}`);
      console.log('Lending Pool PDA:', result.lendingPoolPda.toString());
      console.log('Borrow Receipt Token Mint:', result.borrowReceiptTokenMint.toString());
      console.log('Collateral Receipt Token Mint:', result.collateralReceiptTokenMint.toString());
      
      setLastTxSignature(result.tx);
      setFormData({  poolId: '' }); // 重置表单
    } catch (err) {
      console.error("Error creating lending pool:", err);
      setError(err instanceof Error ? err.message : "Failed to create lending pool");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="create-amm-container">
        <h2>Create Lending Pool</h2>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {lastTxSignature && (
          <div className="success-message">
            Lending Pool created successfully! 
            <a 
              href={`https://explorer.solana.com/tx/${lastTxSignature}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View transaction
            </a>
          </div>
        )}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Pool Pubkey:</label>
            <input
              type="text"
              value={formData.poolId}
              onChange={(e) => setFormData({...formData, poolId: e.target.value})}
              placeholder="Enter Pool Pubkey"
              required
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading || !wallet}
          >
            {isLoading ? 'Creating...' : 'Create Lending Pool'}
          </button>
        </form>
      </div>
    </div>
  );
};